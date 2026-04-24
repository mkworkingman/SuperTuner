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

// TODO: switcher does not work for now
export function useTuner(
    A4: number = 440,
    system: NoteSystem = 'english',
    accidental: AccidentalMode = 'sharps',
) {
    const [isReady, setIsReady] = useState(false)
    const [note, setNote] = useState<NoteInfo>(null)

    const audioContextRef = useRef<AudioContext>(null)
    const analyserRef = useRef<AnalyserNode>(null)
    const streamRef = useRef<MediaStream>(null)
    const requestRef = useRef<number>(null)

    const notesNames = useMemo(() => NOTE_SYSTEMS[system][accidental], [system, accidental])

    const settingsRef = useRef({ A4, notesNames })

    useEffect(() => {
        init().then(() => setIsReady(true))

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
            if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
        }
    }, [])

    useEffect(() => {
        settingsRef.current = { A4, notesNames }
    }, [A4, notesNames])

    const getNoteInfo = (frequency: number): NoteInfo => {
        if (frequency <= 0) return null

        const p = 69 + 12 * Math.log2(frequency / A4)
        const nearestStep = Math.round(p)
        const name = notesNames[((nearestStep % 12) + 12) % 12]
        const octave = Math.floor(nearestStep / 12) - 1

        const targetFrequency = A4 * Math.pow(2, (nearestStep - 69) / 12)
        const centsOff = Math.floor(1200 * Math.log2(frequency / targetFrequency))
        const absCentsOff = Math.abs(centsOff)
        const color = absCentsOff <= 5 ? '#22c55e' : absCentsOff <= 15 ? '#eab308' : '#ef4444'
        // TODO: <= 5 for green is too much maybe? Recheck it

        return {
            name,
            octave,
            centsOff,
            frequency: `${frequency.toFixed(2)} Hz`,
            targetFrequency: `${targetFrequency.toFixed(2)} Hz`,
            color,
        }
    }

    const startAudio = async () => {
        if (audioContextRef.current) return

        try {
            const audioContext = new (
                window.AudioContext ||
                (window as typeof window & { webkitAudioContext: typeof AudioContext })
                    .webkitAudioContext
            )()
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()

            analyser.fftSize = 8192
            source.connect(analyser)

            audioContextRef.current = audioContext
            streamRef.current = stream
            analyserRef.current = analyser

            const buffer = new Float32Array(analyser.fftSize)
            let lastTimestamp = 0

            const tick = (currentTimestamp: number) => {
                analyser.getFloatTimeDomainData(buffer)
                const freq = detect_pitch(buffer, audioContext.sampleRate)

                if (freq > 0 && currentTimestamp - lastTimestamp > 100) {
                    setNote(getNoteInfo(freq))
                    lastTimestamp = currentTimestamp
                }

                requestRef.current = requestAnimationFrame(tick)
            }

            requestRef.current = requestAnimationFrame(tick) // TODO: make it less frequent than 60fps
        } catch (err) {
            console.log('Error with microphone', err)
        }
    }

    return { isReady, note, startAudio }
}
