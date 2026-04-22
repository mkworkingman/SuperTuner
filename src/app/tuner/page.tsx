'use client'
import Link from 'next/link'
import init, { detect_pitch } from '@/wasm/wasm_study'
import { useEffect, useRef, useState } from 'react'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export default function Tuner() {
    const [isReady, setIsReady] = useState(false)
    const [frequency, setFrequency] = useState(0)
    const [note, setNote] = useState('-')

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

    const getNoteInfo = (freq: number) => {
        if (freq <= 0) return '-'
        const p = 69 + 12 * Math.log2(freq / 440)
        const nearestStep = Math.round(p)
        const name = NOTES[nearestStep % 12]
        const octave = Math.floor(nearestStep / 12) - 1
        return `${name}${octave}`
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
                setFrequency(freq)
                setNote(getNoteInfo(freq))
            }

            requestRef.current = requestAnimationFrame(tick)
        }

        tick()
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
                        <p className="font-mono text-3xl">{frequency.toFixed(2)} Hz</p>
                        <p className="text-5xl font-bold text-blue-600">{note}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
