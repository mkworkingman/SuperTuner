'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'

export default function Metronome() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [bpm, setBpm] = useState(120)
    const timerRef = useRef<number | null>(null)
    const audioCtxRef = useRef<AudioContext | null>(null)

    function playClick(ctx: AudioContext, freq: number) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.frequency.value = freq
        osc.type = 'square'

        gain.gain.setValueAtTime(1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + 0.05)
    }

    const toggleMetronome = () => {
        if (isPlaying) {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
            setIsPlaying(false)
            return
        }

        if (!audioCtxRef.current) {
            /* eslint-disable @typescript-eslint/no-explicit-any */
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            /* eslint-enable @typescript-eslint/no-explicit-any */
        }

        setIsPlaying(true)

        let beat = 0
        const interval = (60 / bpm) * 1000

        timerRef.current = window.setInterval(() => {
            if (audioCtxRef.current) {
                const freq = beat % 4 === 0 ? 440 : 220
                playClick(audioCtxRef.current, freq)
                beat++
            }
        }, interval)
    }

    return (
        <div className="p-8">
            <Link href="/">Back</Link>
            <h2 className="mb-4 text-xl font-bold">Metronome</h2>

            <div className="flex max-w-xs flex-col gap-4">
                <label>BPM: {bpm}</label>
                <input
                    type="range"
                    min="40"
                    max="240"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                />

                <button onClick={toggleMetronome} className="rounded bg-black p-2 text-white">
                    {isPlaying ? 'STOP' : 'START'}
                </button>
            </div>
        </div>
    )
}
