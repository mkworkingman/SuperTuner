'use client'
import Link from 'next/link'
import { useTuner } from '@/hooks/useTuner'

export default function Tuner() {
    const { isReady, note, startAudio } = useTuner()

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
