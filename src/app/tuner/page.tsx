'use client'
import Link from 'next/link'
import init, { detect_pitch } from '@/wasm/wasm_study'
import { useEffect, useRef, useState } from 'react'

type note = {
    name: string
    octave: number
    centsOff: number
    frequency: string
    targetFrequency: string
    color: string
} | null

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function Tuner() {
    const [isReady, setIsReady] = useState(false)
    const [note, setNote] = useState<note>(null)

    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const requestRef = useRef<number | null>(null)

    useEffect(() => {
        init().then(() => setIsReady(true))

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
            if (audioContextRef.current) audioContextRef.current.close()
            if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop())
        }
    }, [])

    const getNoteInfo = (frequency: number): note => {
        if (frequency <= 0) return null
        const A4 = 440 // TODO: should be customizable
        const p = 69 + 12 * Math.log2(frequency / A4)
        const nearestStep = Math.round(p)
        const name = NOTES[((nearestStep % 12) + 12) % 12]
        const octave = Math.floor(nearestStep / 12) - 1

        const targetFrequency = A4 * Math.pow(2, (nearestStep - 69) / 12)
        const centsOff = Math.floor(1200 * Math.log2(frequency / targetFrequency))
        const absCentsOff = Math.abs(centsOff)
        const color = absCentsOff <= 5 ? 'green' : absCentsOff <= 15 ? 'yellow' : 'red' // TODO: pick normal colors in right format, not precreated by browser; also, maybe different range

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
        const audioContext = new window.AudioContext()
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()

        analyser.fftSize = 8192
        source.connect(analyser)

        audioContextRef.current = audioContext
        streamRef.current = stream
        analyserRef.current = analyser

        const buffer = new Float32Array(analyser.fftSize)

        const tick = () => {
            analyser.getFloatTimeDomainData(buffer)
            const freq = detect_pitch(buffer, audioContext.sampleRate)

            if (freq > 0) {
                setNote(getNoteInfo(freq))
            }

            requestRef.current = requestAnimationFrame(tick)
        }

        tick() // TODO: make it less frequent than 60fps
    }

    return (
        <div className="rounded-lg border p-8 shadow-sm">
            <Link href="/">Back</Link>
            <h2 className="mb-4 text-xl font-bold">Tuner</h2>

            {!isReady ? (
                <p>Loading WebAssembly...</p>
            ) : (
                <div className="space-y-4">
                    <button
                        onClick={startAudio}
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    >
                        Start Listening
                    </button>

                    <div className="mt-4">
                        <p className="font-mono text-3xl">{note?.frequency}</p>
                        <p className="text-5xl font-bold" style={{ color: note?.color }}>
                            {note?.name}
                            {note?.octave}
                        </p>
                        <p>Target: {note?.targetFrequency}</p>
                        <p>centsOff: {note?.centsOff}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
