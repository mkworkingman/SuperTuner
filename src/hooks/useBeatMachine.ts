import { BeatGrid, BeatProcessorMessage, BeatProcessorEvent } from '@/types'
import { ensureWorklet, resumeAudio, suspendAudio } from '@/lib/audioContext'
import { useState, useEffect, useRef, useCallback } from 'react'

const WORKLET_URL = '/worklets/beatProcessor.js'

export function useBeatMachine(initialGrid: BeatGrid, spb: number) {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [grid, setGrid] = useState<BeatGrid>(initialGrid)
    const [stepsPerBeat, setStepsPerBeat] = useState<number>(spb)
    const [activeStep, setActiveStep] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const workletNodeRef = useRef<AudioWorkletNode | null>(null)

    // Latest config, read once when the node is (re)started on activation.
    // Live edits are pushed by the dedicated effects/callbacks below, so the
    // activation effect must NOT depend on them — that would tear down and
    // restart playback (resetting the playhead to step 0) on every change.
    const configRef = useRef({ grid, bpm, stepsPerBeat })
    useEffect(() => {
        configRef.current = { grid, bpm, stepsPerBeat }
    }, [grid, bpm, stepsPerBeat])

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) await suspendAudio()
            else if (isActive) await resumeAudio()
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive])

    useEffect(() => {
        if (!isActive) {
            workletNodeRef.current?.port.postMessage({ type: 'STOP' } satisfies BeatProcessorMessage)
            return
        }

        let cancelled = false

        const initAudio = async () => {
            try {
                const audioCtx = await ensureWorklet(WORKLET_URL)
                if (cancelled) return

                if (!workletNodeRef.current) {
                    const beatNode = new AudioWorkletNode(audioCtx, 'beat-processor')

                    beatNode.port.onmessage = (e: MessageEvent<BeatProcessorEvent>) => {
                        if (e.data.type === 'TICK') setActiveStep(e.data.step)
                    }

                    beatNode.connect(audioCtx.destination)
                    workletNodeRef.current = beatNode
                }

                const cfg = configRef.current
                const port = workletNodeRef.current.port
                port.postMessage({
                    type: 'INIT_GRID',
                    payload: {
                        grid: cfg.grid,
                        gridLength: Object.values(cfg.grid)[0]?.length ?? 0,
                        stepsPerBeat: cfg.stepsPerBeat,
                    },
                } satisfies BeatProcessorMessage)
                port.postMessage({ type: 'SET_BPM', payload: cfg.bpm } satisfies BeatProcessorMessage)
                port.postMessage({ type: 'START' } satisfies BeatProcessorMessage)
                setError(null)
            } catch (err) {
                console.error('Beat Machine Error:', err)
                setError('Failed to start audio engine')
                setIsActive(false)
            }
        }

        initAudio()

        return () => {
            cancelled = true
            workletNodeRef.current?.port.postMessage({ type: 'STOP' } satisfies BeatProcessorMessage)
        }
    }, [isActive])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({
            type: 'SET_BPM',
            payload: bpm,
        } satisfies BeatProcessorMessage)
    }, [bpm])

    // Disconnect the node on unmount; the shared AudioContext is a singleton and
    // is intentionally never closed here.
    useEffect(() => {
        return () => {
            workletNodeRef.current?.port.postMessage({ type: 'STOP' } satisfies BeatProcessorMessage)
            workletNodeRef.current?.disconnect()
            workletNodeRef.current = null
        }
    }, [])

    const toggleBeatMachine = () => setIsActive((prev) => !prev)

    const toggleCell = useCallback((instrument: string, step: number) => {
        setGrid((prev) => {
            const currentInstrumentSteps = prev[instrument]

            if (!currentInstrumentSteps) return prev

            const newValue = currentInstrumentSteps[step] === 1 ? 0 : 1

            workletNodeRef.current?.port.postMessage({
                type: 'UPDATE_GRID',
                payload: { instrument, step, value: newValue },
            } satisfies BeatProcessorMessage)
            return {
                ...prev,
                [instrument]: currentInstrumentSteps.map((v, i) => (i === step ? newValue : v)),
            }
        })
    }, [])

    const resize = useCallback(
        (length: number) => {
            const next = {} as BeatGrid
            for (const [key, row] of Object.entries(grid) as [keyof BeatGrid, number[]][]) {
                next[key] =
                    length < row.length
                        ? row.slice(0, length)
                        : [...row, ...Array(length - row.length).fill(0)]
            }
            workletNodeRef.current?.port.postMessage({
                type: 'INIT_GRID',
                payload: {
                    grid: next,
                    gridLength: length,
                    stepsPerBeat,
                },
            } satisfies BeatProcessorMessage)
            setGrid(next)
        },
        [grid, stepsPerBeat],
    )

    const changeBeatsPerMinute = useCallback((steps: number) => {
        workletNodeRef.current?.port.postMessage({
            type: 'UPDATE_SPB',
            payload: steps,
        } satisfies BeatProcessorMessage)
        setStepsPerBeat(steps)
    }, [])

    return {
        isActive,
        bpm,
        setBpm,
        grid,
        activeStep,
        toggleBeatMachine,
        toggleCell,
        error,
        resize,
        changeBeatsPerMinute,
    }
}
