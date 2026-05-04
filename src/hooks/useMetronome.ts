import { useState, useEffect, useRef } from 'react'

export function useMetronome() {
    const [isActive, setIsActive] = useState(false)
    const [bpm, setBpm] = useState(120)
    const [beatCount, setBeatCount] = useState(4)
    const [isAccentEnabled, setIsAccentEnabled] = useState(true)
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

                    await audioCtxRef.current.audioWorklet.addModule(
                        '/worklets/metronomeProcessor.js',
                    )
                }

                const audioCtx = audioCtxRef.current!
                if (audioCtx.state === 'suspended') await audioCtx.resume()

                if (!workletNodeRef.current) {
                    const metronomeNode = new AudioWorkletNode(audioCtx, 'metronome-processor')
                    metronomeNode.connect(audioCtx.destination)
                    workletNodeRef.current = metronomeNode
                }

                if (isMounted) {
                    const port = workletNodeRef.current.port
                    port.postMessage({ type: 'SET_BPM', value: bpm })
                    port.postMessage({ type: 'SET_BEAT_COUNT', value: beatCount })
                    port.postMessage({ type: 'SET_ACCENT', value: isAccentEnabled })
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
        workletNodeRef.current?.port.postMessage({ type: 'SET_BPM', value: bpm })
    }, [bpm])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({
            type: 'SET_BEAT_COUNT',
            value: beatCount,
        })
    }, [beatCount])

    useEffect(() => {
        workletNodeRef.current?.port.postMessage({ type: 'SET_ACCENT', value: isAccentEnabled })
    }, [isAccentEnabled])

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
        toggleMetronome,
        error,
    }
}
