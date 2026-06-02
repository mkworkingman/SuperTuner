import { BeatGrid } from '@/types'
import { useState, useEffect, useRef, useCallback } from 'react'

export function useBeatMachine(initialGrid: BeatGrid) {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [grid, setGrid] = useState<BeatGrid>(initialGrid)
    const [activeStep, setActiveStep] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                await audioCtxRef.current?.suspend()
            } else if (isActive) {
                await audioCtxRef.current?.resume()
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive])

    useEffect(() => {
        if (!isActive) {
            workletNodeRef.current?.port.postMessage({ type: 'STOP' })
            return
        }

        let isMounted = true

        const initAudio = async () => {
            try {
                if (!audioCtxRef.current) {
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    audioCtxRef.current = new (
                        window.AudioContext || (window as any).webkitAudioContext
                    )()
                    /* eslint-enable @typescript-eslint/no-explicit-any */

                    await audioCtxRef.current.audioWorklet.addModule('/worklets/beatProcessor.js')
                }

                const audioCtx = audioCtxRef.current!
                if (audioCtx.state === 'suspended') await audioCtx.resume()

                if (!workletNodeRef.current) {
                    const beatNode = new AudioWorkletNode(audioCtx, 'beat-processor')

                    beatNode.port.onmessage = (e) => {
                        if (e.data.type === 'TICK') {
                            setActiveStep(e.data.step)
                        }
                    }

                    beatNode.connect(audioCtx.destination)
                    workletNodeRef.current = beatNode

                    beatNode.port.postMessage({
                        type: 'INIT_GRID',
                        payload: {
                            grid,
                            gridLength: Object.values(grid)[0]?.length ?? 0,
                            stepsPerBeat: 4,
                        },
                    })
                }

                if (isMounted) {
                    const port = workletNodeRef.current.port
                    port.postMessage({ type: 'SET_BPM', payload: bpm })
                    port.postMessage({ type: 'START' })
                }
            } catch (err) {
                console.error('Beat Machine Error:', err)
                setError('Failed to start audio engine')
                setIsActive(false)
            }
        }

        initAudio()

        return () => {
            isMounted = false
            workletNodeRef.current?.port.postMessage({ type: 'STOP' })
        }
    }, [isActive, bpm, grid])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({ type: 'SET_BPM', payload: bpm })
    }, [bpm])

    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close()
            }
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
            })
            return {
                ...prev,
                [instrument]: currentInstrumentSteps.map((v, i) => (i === step ? newValue : v)),
            }
        })
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
    }
}
