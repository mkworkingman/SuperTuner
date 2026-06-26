import { useState, useEffect, useRef, useMemo } from 'react'
import init, { detect_pitch } from '@/wasm/wasm_study'
import { NoteSystem, AccidentalMode, PitchProcessorEvent } from '@/types'
import { NOTE_SYSTEMS } from '@/consts'
import { ensureWorklet, resumeAudio, suspendAudio } from '@/lib/audioContext'

const WORKLET_URL = '/worklets/pitchProcessor.js'

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
    //TODO: figure out: do I need isReady or not?
    const [isReady, setIsReady] = useState(() => isWasmLoaded)
    const [isActive, setIsActive] = useState(false)
    const [currentFrequency, setCurrentFrequency] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    // Bumped to force a full teardown + re-init (e.g. when the mic stream is
    // dropped while the tab is backgrounded). Toggling isActive off/on in the
    // same handler would be auto-batched into a no-op, so it can't restart.
    const [restartToken, setRestartToken] = useState(0)

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
                await suspendAudio()
                return
            }
            if (!isActive) return

            const track = streamRef.current?.getAudioTracks()[0]
            if (!track || track.readyState === 'ended' || !track.enabled) {
                console.log('Stream lost in background, restarting...')
                setRestartToken((t) => t + 1)
            } else {
                await resumeAudio()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [isActive])

    useEffect(() => {
        if (!isActive || !isReady) return

        let cancelled = false

        const initAudio = async () => {
            try {
                const audioCtx = await ensureWorklet(WORKLET_URL)
                if (cancelled) return

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                    },
                })

                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop())
                    return
                }

                const source = audioCtx.createMediaStreamSource(stream)
                const pitchNode = new AudioWorkletNode(audioCtx, 'pitch-processor')

                pitchNode.port.onmessage = (event: MessageEvent<PitchProcessorEvent>) => {
                    const freq = detect_pitch(event.data, audioCtx.sampleRate)
                    if (freq > 0) {
                        setCurrentFrequency(freq)
                    }
                }

                source.connect(pitchNode)

                sourceRef.current = source
                workletNodeRef.current = pitchNode
                streamRef.current = stream
                setError(null)
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
            cancelled = true
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
        // The shared AudioContext is a singleton and is intentionally never
        // closed here; we only tear down this hook's nodes and mic stream.
    }, [isActive, isReady, restartToken])

    const startAudio = () => setIsActive(true)
    const stopAudio = () => setIsActive(false)

    return { isReady, isActive, startAudio, stopAudio, error, note }
}
