'use client'
import Link from 'next/link'
import { useTuner } from '@/hooks/useTuner'
import A4Toggle from './_components/a4toggle'
import NoteSystemToggle from './_components/noteSystemToggle'
import AccidentalToggle from './_components/accidentalToggle'
import { useState } from 'react'
import { AccidentalMode, NoteSystem } from '@/types'

export default function Tuner() {
    const [A4, setA4] = useState(440)
    const [system, setSystem] = useState<NoteSystem>('english')
    const [accidental, setAccidental] = useState<AccidentalMode>('sharps')
    const { isReady, isActive, note, startAudio, stopAudio } = useTuner(A4, system, accidental)

    return (
        <div className="rounded-lg border p-8 shadow-sm">
            <Link href="/">Back</Link>
            <h2 className="mb-4 text-xl font-bold">Tuner</h2>

            {!isReady ? (
                <p>Loading WebAssembly...</p>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={isActive ? stopAudio : startAudio}
                            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                        >
                            {isActive ? 'Stop Listening' : 'Start Listening'}
                        </button>
                        <div>
                            <A4Toggle value={A4} onChange={setA4} />
                            <NoteSystemToggle value={system} onChange={setSystem} />
                            <AccidentalToggle value={accidental} onChange={setAccidental} />
                        </div>
                    </div>
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
