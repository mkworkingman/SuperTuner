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
    const { isReady, isActive, note, startAudio, stopAudio, error } = useTuner(
        A4,
        system,
        accidental,
    )

    return (
        <div className="rounded-b-lg border p-8 shadow-sm">
            <Link href="/">Back</Link>
            <h2 className="mb-4 text-xl font-bold">Tuner</h2>

            {!isReady ? (
                <p>Loading WebAssembly...</p>
            ) : (
                <>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={isActive ? stopAudio : startAudio}
                                className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                            >
                                {isActive ? 'Stop Listening' : 'Start Listening'}
                            </button>

                            <div className="h-60 w-90 rounded-xl bg-white p-6 text-center">
                                <div className="flex h-full flex-col items-center justify-center">
                                    {isActive && note ? (
                                        <>
                                            <p className="mb-2 font-mono text-xl text-slate-500">
                                                {note.frequency}
                                            </p>
                                            <h1
                                                className="text-8xl font-black transition-colors"
                                                style={{ color: note.color }}
                                            >
                                                {note.name}
                                                <span className="align-top text-4xl">
                                                    {note.octave}
                                                </span>
                                            </h1>
                                            <div className="mt-4 flex flex-col items-center">
                                                <div className="relative h-2 w-48 overflow-hidden rounded-full bg-slate-200">
                                                    <div className="absolute top-0 bottom-0 left-1/2 z-10 w-1 -translate-x-1/2 bg-slate-800" />
                                                    <div
                                                        className="absolute top-0 bottom-0 transition-all duration-100"
                                                        style={{
                                                            left: '50%',
                                                            width: `${Math.abs(note.centsOff)}%`,
                                                            transform:
                                                                note.centsOff < 0
                                                                    ? 'translateX(-100%)'
                                                                    : 'translateX(0)',
                                                            backgroundColor: note.color,
                                                        }}
                                                    />
                                                </div>
                                                <p
                                                    className="mt-2 text-sm font-bold"
                                                    style={{ color: note.color }}
                                                >
                                                    {note.centsOff > 0
                                                        ? `+${note.centsOff}`
                                                        : note.centsOff}
                                                    cents
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-slate-400 italic">
                                            {isActive
                                                ? 'Waiting for sound...'
                                                : 'Press start to tune'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <A4Toggle value={A4} onChange={setA4} />
                                <NoteSystemToggle value={system} onChange={setSystem} />
                                <AccidentalToggle value={accidental} onChange={setAccidental} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
