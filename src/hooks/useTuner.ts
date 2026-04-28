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
let isWasmLoaded = false // TODO: Into the store?

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

    const audioCtxRef = useRef<AudioContext | null>(null)
    const workletNodeRef = useRef<AudioWorkletNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)

    const notesNames = useMemo(() => NOTE_SYSTEMS[system][accidental], [system, accidental])

    const note = useMemo((): NoteInfo => {
        if (!currentFrequency || currentFrequency <= 0) return null
        const p = 69 + 12 * Math.log2(currentFrequency / A4)
        const nearestStep = Math.round(p)
        const name = notesNames[((nearestStep % 12) + 12) % 12]!
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
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                audioCtxRef.current?.suspend()
            } else {
                if (isActive) {
                    const stream = streamRef.current
                    const track = stream?.getAudioTracks()[0]

                    if (!track || track.readyState === 'ended' || !track.enabled) {
                        console.log('Stream lost in background, restarting...')
                        setIsActive(false)
                        setIsActive(true)
                    } else {
                        await audioCtxRef.current?.resume()
                    }
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive])

    useEffect(() => {
        if (!isActive || !isReady) return

        let isMounted = true

        const initAudio = async () => {
            try {
                if (!audioCtxRef.current) {
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    audioCtxRef.current = new (
                        window.AudioContext || (window as any).webkitAudioContext
                    )()
                    /* eslint-enable @typescript-eslint/no-explicit-any */
                    await audioCtxRef.current.audioWorklet.addModule('/worklets/pitchProcessor.js')
                }

                const audioCtx = audioCtxRef.current!

                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume()
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

                const source = audioCtx.createMediaStreamSource(stream)
                const pitchNode = new AudioWorkletNode(audioCtx, 'pitch-processor')

                pitchNode.port.onmessage = (event) => {
                    const buffer = event.data
                    const freq = detect_pitch(buffer, audioCtx.sampleRate)
                    if (freq > 0) {
                        setCurrentFrequency(freq)
                    }
                }

                source.connect(pitchNode)

                sourceRef.current = source
                workletNodeRef.current = pitchNode
                streamRef.current = stream
            } catch (err) {
                console.error('Microphone/Worklet error:', err)
                let message = 'Could not access microphone'
                if (err instanceof DOMException && err.name === 'NotAllowedError') {
                    message = 'Microphone permission denied.'
                } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                    message = 'No microphone found.'
                }
                setError(message)
                setIsActive(false)
            }
        }

        initAudio()

        return () => {
            isMounted = false
            setCurrentFrequency(null)

            if (sourceRef.current) {
                sourceRef.current.disconnect()
                sourceRef.current = null
            }
            if (workletNodeRef.current) {
                workletNodeRef.current.disconnect()
                workletNodeRef.current = null
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop())
                streamRef.current = null
            }
        }
    }, [isActive, isReady])

    useEffect(() => {
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close()
                audioCtxRef.current = null
            }
        }
    }, [])

    const startAudio = () => setIsActive(true)
    const stopAudio = () => setIsActive(false)

    return { isReady, isActive, startAudio, stopAudio, error, note }
}
