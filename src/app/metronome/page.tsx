'use client'
import Link from 'next/link'
import { useMetronome } from '@/hooks/useMetronome'

export default function Metronome() {
    const { isActive, bpm, setBpm, toggleMetronome, error } = useMetronome()

    return (
        <div className="p-8">
            <Link href="/">Back</Link>
            <h2 className="mb-4 text-xl font-bold">Metronome</h2>

            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

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
                    {isActive ? 'STOP' : 'START'}
                </button>
            </div>
        </div>
    )
}
