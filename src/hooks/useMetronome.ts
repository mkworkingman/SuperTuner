import { useState, useEffect, useRef } from 'react'

export function useMetronome() {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [error, setError] = useState<string | null>(null)

    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                await audioCtxRef.current?.suspend()
            } else {
                if (isActive) {
                    await audioCtxRef.current?.resume()
                }
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

                    await audioCtxRef.current.audioWorklet.addModule(
                        '/worklets/metronomeProcessor.js',
                    )
                }

                const audioCtx = audioCtxRef.current!

                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume()
                }

                if (!workletNodeRef.current) {
                    const metronomeNode = new AudioWorkletNode(audioCtx, 'metronome-processor')
                    metronomeNode.connect(audioCtx.destination)
                    workletNodeRef.current = metronomeNode
                }

                if (isMounted) {
                    workletNodeRef.current.port.postMessage({ type: 'START' })
                    workletNodeRef.current.port.postMessage({ type: 'SET_BPM', value: bpm })
                }
            } catch (err) {
                console.error('Metronome Worklet error:', err)
                setError('Failed to start audio engine')
                setIsActive(false)
            }
        }

        initAudio()

        return () => {
            isMounted = false
            workletNodeRef.current?.port.postMessage({ type: 'STOP' })
        }
    }, [isActive, bpm])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({ type: 'SET_BPM', value: bpm })
    }, [bpm])

    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close()
                audioCtxRef.current = null
                workletNodeRef.current = null
            }
        }
    }, [])

    const toggleMetronome = () => setIsActive((prev) => !prev)

    return {
        isActive,
        bpm,
        setBpm,
        toggleMetronome,
        error,
    }
}
