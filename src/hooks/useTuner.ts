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

// TODO: switcher does not work for now
export function useTuner(
    A4: number = 440,
    system: NoteSystem = 'english',
    accidental: AccidentalMode = 'sharps',
) {
    const [isReady, setIsReady] = useState(isWasmLoaded)
    const [isActive, setIsActive] = useState(false)
    const [currentFrequency, setCurrentFrequency] = useState<number | null>(null)

    const audioContextRef = useRef<AudioContext | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
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

        if (!wasmPromise) {
            wasmPromise = init().then(() => {
                isWasmLoaded = true
            })
        }

        let isMounted = true
        wasmPromise.then(() => {
            if (isMounted) setIsReady(true)
        })

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        if (!isActive || !isReady) return

        let isMounted = true
        let requestID: number

        const start = async () => {
            try {
                const audioContext = new (
                    window.AudioContext ||
                    (window as typeof window & { webkitAudioContext: typeof AudioContext })
                        .webkitAudioContext
                )()
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

                if (audioContext.state === 'suspended') {
                    await audioContext.resume()
                }

                const source = audioContext.createMediaStreamSource(stream)
                const analyser = audioContext.createAnalyser()

                analyser.fftSize = 8192
                source.connect(analyser)

                audioContextRef.current = audioContext
                streamRef.current = stream

                const buffer = new Float32Array(analyser.fftSize)
                let lastTimestamp = 0

                const tick = (currentTimestamp: number) => {
                    analyser.getFloatTimeDomainData(buffer)
                    const freq = detect_pitch(buffer, audioContext.sampleRate)

                    if (freq > 0 && currentTimestamp - lastTimestamp > 100) {
                        if (freq !== currentFrequencyRef.current) {
                            currentFrequencyRef.current = freq
                            setCurrentFrequency(freq)
                        }
                        lastTimestamp = currentTimestamp
                    }
                    requestID = requestAnimationFrame(tick)
                }

                requestID = requestAnimationFrame(tick)
            } catch (err) {
                console.log('Error with microphone', err)
                setIsActive(false)
            }
        }

        start()

        return () => {
            isMounted = false
            setCurrentFrequency(null)
            if (requestID) cancelAnimationFrame(requestID)
            if (audioContextRef.current) audioContextRef.current.close()
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
            audioContextRef.current = null
            streamRef.current = null
            currentFrequencyRef.current = null
        }
    }, [isActive, isReady])

    const startAudio = () => setIsActive(true)
    const stopAudio = () => setIsActive(false)

    return { isReady, isActive, startAudio, stopAudio, note }
}
