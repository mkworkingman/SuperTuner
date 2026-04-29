import { AccidentalMode } from '@/types'

export default function AccidentalToggle({
    value,
    onChange,
}: {
    value: AccidentalMode
    onChange: (val: AccidentalMode) => void
}) {
    return (
        <div className="w-fit rounded-xl border border-slate-800 bg-slate-900 p-1">
            <button
                onClick={() => onChange('sharps')}
                className={`rounded-lg px-6 py-2 text-lg transition-all duration-200 ${
                    value === 'sharps'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'cursor-pointer text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
            >
                ♯
            </button>
            <button
                onClick={() => onChange('flats')}
                className={`rounded-lg px-6 py-2 text-lg transition-all ${
                    value === 'flats'
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'cursor-pointer text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
            >
                ♭
            </button>
        </div>
    )
}
