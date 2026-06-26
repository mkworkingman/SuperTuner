import { BeatProcessorMessage, BeatProcessorEvent } from '@/types'
import { ensureWorklet, resumeAudio, suspendAudio } from '@/lib/audioContext'
import { useState, useEffect, useRef } from 'react'

const WORKLET_URL = '/worklets/beatProcessor.js'

const buildGrid = (count: number, accent: boolean) => {
    const accentRow = Array(count).fill(0)
    const beepRow = Array(count).fill(0)
    for (let i = 0; i < count; i++) {
        if (i === 0 && accent) accentRow[i] = 1
        else beepRow[i] = 1
    }
    return { accent: accentRow, beep: beepRow }
}

export function useMetronome() {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [beatCount, setBeatCount] = useState(4)
    const [isAccentEnabled, setIsAccentEnabled] = useState(true)
    const [activeStep, setActiveStep] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const workletNodeRef = useRef<AudioWorkletNode | null>(null)

    // Latest config, read once when the node is (re)started on activation.
    // Live changes are pushed by the dedicated effects below, so the activation
    // effect must NOT depend on them — that would restart the metronome (and
    // reset the playhead) on every BPM / beat-count / accent change.
    const configRef = useRef({ bpm, beatCount, isAccentEnabled })
    useEffect(() => {
        configRef.current = { bpm, beatCount, isAccentEnabled }
    }, [bpm, beatCount, isAccentEnabled])

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
                    const metronomeNode = new AudioWorkletNode(audioCtx, 'beat-processor')

                    metronomeNode.port.onmessage = (e: MessageEvent<BeatProcessorEvent>) => {
                        if (e.data.type === 'TICK') setActiveStep(e.data.step)
                    }

                    metronomeNode.connect(audioCtx.destination)
                    workletNodeRef.current = metronomeNode
                }

                const cfg = configRef.current
                const port = workletNodeRef.current.port
                port.postMessage({
                    type: 'INIT_GRID',
                    payload: {
                        grid: buildGrid(cfg.beatCount, cfg.isAccentEnabled),
                        gridLength: cfg.beatCount,
                        stepsPerBeat: 1,
                    },
                } satisfies BeatProcessorMessage)
                port.postMessage({ type: 'SET_BPM', payload: cfg.bpm } satisfies BeatProcessorMessage)
                port.postMessage({ type: 'START' } satisfies BeatProcessorMessage)
                setError(null)
            } catch (err) {
                console.error('Metronome Error:', err)
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

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({
            type: 'INIT_GRID',
            payload: {
                grid: buildGrid(beatCount, isAccentEnabled),
                gridLength: beatCount,
                stepsPerBeat: 1,
            },
        } satisfies BeatProcessorMessage)
    }, [beatCount, isAccentEnabled])

    // Disconnect the node on unmount; the shared AudioContext is a singleton and
    // is intentionally never closed here.
    useEffect(() => {
        return () => {
            workletNodeRef.current?.port.postMessage({ type: 'STOP' } satisfies BeatProcessorMessage)
            workletNodeRef.current?.disconnect()
            workletNodeRef.current = null
        }
    }, [])

    const toggleMetronome = () => setIsActive((prev) => !prev)

    return {
        isActive,
        bpm,
        setBpm,
        beatCount,
        setBeatCount,
        isAccentEnabled,
        setIsAccentEnabled,
        activeStep,
        toggleMetronome,
        error,
    }
}
