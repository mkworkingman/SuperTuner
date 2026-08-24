import { useState, useEffect, useRef } from 'react'

export function useMetronome() {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [beatCount, setBeatCount] = useState(4)
    const [isAccentEnabled, setIsAccentEnabled] = useState(true)
    const [activeStep, setActiveStep] = useState(0)
    const [error, setError] = useState<string | null>(null)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)

    const buildGrid = (count: number, accent: boolean) => {
        const accentRow = Array(count).fill(0)
        const beepRow = Array(count).fill(0)
        for (let i = 0; i < count; i++) {
            if (i === 0 && accent) accentRow[i] = 1
            else beepRow[i] = 1
        }
        return { accent: accentRow, beep: beepRow }
    }

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
                    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
                    await audioCtxRef.current.audioWorklet.addModule('/worklets/beatProcessor.js')
                }

                const audioCtx = audioCtxRef.current!
                if (audioCtx.state === 'suspended') await audioCtx.resume()

                if (!workletNodeRef.current) {
                    const metronomeNode = new AudioWorkletNode(audioCtx, 'beat-processor')

                    metronomeNode.port.onmessage = (e) => {
                        if (e.data.type === 'TICK') {
                            setActiveStep(e.data.step)
                        }
                    }

                    metronomeNode.connect(audioCtx.destination)
                    workletNodeRef.current = metronomeNode

                    metronomeNode.port.postMessage({
                        type: 'INIT_GRID',
                        payload: {
                            grid: buildGrid(beatCount, isAccentEnabled),
                            gridLength: beatCount,
                            stepsPerBeat: 1,
                        },
                    })
                }

                if (isMounted) {
                    const port = workletNodeRef.current.port
                    port.postMessage({ type: 'SET_BPM', payload: bpm })
                    port.postMessage({ type: 'START' })
                }
            } catch (err) {
                console.error('Metronome Error:', err)
                setError('Failed to start audio engine')
                setIsActive(false)
            }
        }

        initAudio()

        return () => {
            isMounted = false
            workletNodeRef.current?.port.postMessage({ type: 'STOP' })
        }
    }, [isActive, bpm, beatCount, isAccentEnabled])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({ type: 'SET_BPM', payload: bpm })
    }, [bpm])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({
            type: 'INIT_GRID',
            payload: {
                grid: buildGrid(beatCount, isAccentEnabled),
                gridLength: beatCount,
                stepsPerBeat: 1,
            },
        })
    }, [beatCount, isAccentEnabled])

    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close()
            }
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
