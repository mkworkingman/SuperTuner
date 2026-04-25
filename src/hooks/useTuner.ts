import { useState, useEffect, useRef, useMemo } from 'react'
import init, { detect_pitch } from '@/wasm/wasm_study'
import { NoteSystem, AccidentalMode } from '@/types'
import { NOTE_SYSTEMS } from '@/consts'

type NoteInfo = {
    name: string
    octave: number
    centsOff: number
    frequency: string
    targetFrequency: string
    color: string
} | null

let wasmPromise: Promise<void> | null = null
let isWasmLoaded = false
let globalAudioContext: AudioContext | null = null
let globalAnalyser: AnalyserNode | null = null

const loadWasm = () => {
    if (wasmPromise) return wasmPromise

    wasmPromise = init()
        .then(() => {
            isWasmLoaded = true
        })
        .catch((err) => {
            wasmPromise = null
            throw err
        })

    return wasmPromise
}

export function useTuner(
    A4: number = 440,
    system: NoteSystem = 'english',
    accidental: AccidentalMode = 'sharps',
) {
    const [isReady, setIsReady] = useState(() => isWasmLoaded)
    const [isActive, setIsActive] = useState(false)
    const [currentFrequency, setCurrentFrequency] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    const streamRef = useRef<MediaStream | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const currentFrequencyRef = useRef<number | null>(null)

    const notesNames = useMemo(() => NOTE_SYSTEMS[system][accidental], [system, accidental])

    const note = useMemo((): NoteInfo => {
        if (!currentFrequency || currentFrequency <= 0) return null

        const p = 69 + 12 * Math.log2(currentFrequency / A4)
        const nearestStep = Math.round(p)
        const name = notesNames[((nearestStep % 12) + 12) % 12]
        const octave = Math.floor(nearestStep / 12) - 1

        const targetFrequency = A4 * Math.pow(2, (nearestStep - 69) / 12)
        const centsOff = Math.floor(1200 * Math.log2(currentFrequency / targetFrequency))
        const absCentsOff = Math.abs(centsOff)
        const color = absCentsOff <= 5 ? '#22c55e' : absCentsOff <= 15 ? '#eab308' : '#ef4444'
        // TODO: <= 5 for green is too much maybe? Recheck it

        return {
            name,
            octave,
            centsOff,
            frequency: `${currentFrequency.toFixed(2)} Hz`,
            targetFrequency: `${targetFrequency.toFixed(2)} Hz`,
            color,
        }
    }, [currentFrequency, A4, notesNames])

    useEffect(() => {
        if (isWasmLoaded) return

        let isMounted = true

        loadWasm()
            .then(() => {
                if (isMounted) setIsReady(true)
            })
            .catch((err) => {
                console.error('WASM Load Error:', err)
                if (isMounted) setError('Failed to initialize engine')
            })

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (globalAudioContext?.state === 'running') {
                    globalAudioContext.suspend()
                }
            } else {
                currentFrequencyRef.current = null
                if (isActive && globalAudioContext?.state === 'suspended') {
                    globalAudioContext.resume()
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive])

    useEffect(() => {
        if (!isActive || !isReady) return

        let isMounted = true
        let requestID: number

        const start = async () => {
            try {
                if (!globalAudioContext || !globalAnalyser) {
                    globalAudioContext = new (
                        window.AudioContext ||
                        (window as typeof window & { webkitAudioContext: typeof AudioContext })
                            .webkitAudioContext
                    )()
                    globalAnalyser = globalAudioContext.createAnalyser()
                    globalAnalyser.fftSize = 8192
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    },
                })

                if (!isMounted) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }

                if (globalAudioContext.state === 'suspended') {
                    await globalAudioContext.resume()
                }

                const source = globalAudioContext.createMediaStreamSource(stream)

                source.connect(globalAnalyser)

                sourceRef.current = source
                streamRef.current = stream

                const buffer = new Float32Array(globalAnalyser.fftSize)
                let lastTimestamp = 0

                const tick = (currentTimestamp: number) => {
                    if (!isMounted || !globalAnalyser || !globalAudioContext) return

                    const elapsed = currentTimestamp - lastTimestamp

                    if (elapsed >= 100) {
                        lastTimestamp = currentTimestamp
                        globalAnalyser.getFloatTimeDomainData(buffer)
                        const freq = detect_pitch(buffer, globalAudioContext.sampleRate)

                        if (freq > 0 && freq !== currentFrequencyRef.current) {
                            currentFrequencyRef.current = freq
                            setCurrentFrequency(freq)
                        }
                    }

                    requestID = requestAnimationFrame(tick)
                }

                requestID = requestAnimationFrame(tick)
            } catch (err) {
                console.error('Error with microphone', err)

                let message = 'Could not access microphone'

                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    message = 'Microphone permission denied. Please enable it in your browser.'
                } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                    message = 'No microphone found on this device.'
                }

                setError(message)
                setIsActive(false)
            }
        }

        start()

        return () => {
            isMounted = false
            setCurrentFrequency(null)
            currentFrequencyRef.current = null

            if (requestID) cancelAnimationFrame(requestID)

            if (sourceRef.current) {
                sourceRef.current.disconnect()
                sourceRef.current = null
            }

            if (globalAudioContext && globalAudioContext.state === 'running') {
                globalAudioContext.suspend()
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
                streamRef.current = null
            }
        }
    }, [isActive, isReady])

    const startAudio = () => setIsActive(true)
    const stopAudio = () => setIsActive(false)

    return { isReady, isActive, startAudio, stopAudio, error, note }
}
