import { AccidentalMode } from '@/types'

export default function AccidentalToggle({
    value,
    onChange,
}: {
    value: AccidentalMode
    onChange: (val: AccidentalMode) => void
}) {
    return (
        <div className="inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
                onClick={() => onChange('sharps')}
                className={`cursor-pointer rounded-lg px-6 py-2 text-lg transition-all ${
                    value === 'sharps'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                ♯
            </button>
            <button
                onClick={() => onChange('flats')}
                className={`cursor-pointer rounded-lg px-6 py-2 text-lg transition-all ${
                    value === 'flats'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                ♭
            </button>
        </div>
    )
}
