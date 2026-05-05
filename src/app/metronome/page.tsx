'use client'
import Link from 'next/link'
import { useMetronome } from '@/hooks/useMetronome'
import InputRange from './_components/inputRange'

export default function Metronome() {
    const {
        isActive,
        bpm,
        setBpm,
        beatCount,
        setBeatCount,
        isAccentEnabled,
        setIsAccentEnabled,
        toggleMetronome,
        error,
    } = useMetronome()

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

            <div className="flex max-w-xs flex-col gap-4 font-semibold">
                <InputRange
                    label="BPM"
                    min="40"
                    max="240"
                    value={bpm}
                    onMouseUp={(e) => setBpm(Number(e.currentTarget.value))}
                />
                <InputRange
                    label="Beat Count"
                    min="2"
                    max="8"
                    value={beatCount}
                    onMouseUp={(e) => setBeatCount(Number(e.currentTarget.value))}
                    disabled={!isAccentEnabled}
                />

                <label className="flex cursor-pointer items-center gap-3 select-none">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded"
                        checked={isAccentEnabled}
                        onChange={() => setIsAccentEnabled((prev) => !prev)}
                    />
                    <span>Enable Accent (Beat 1)</span>
                </label>

                <button onClick={toggleMetronome} className="rounded bg-black p-2 text-white">
                    {isActive ? 'STOP' : 'START'}
                </button>
            </div>
        </div>
    )
}
