type A4ToggleType = {
    value: number
    onChange: (val: number) => void
}

export default function A4Toggle({ value, onChange }: A4ToggleType) {
    const options = [440, 432, 415]

    return (
        <div className="w-fit rounded-xl border border-slate-800 bg-slate-900 p-1">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                        value === opt
                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/20'
                            : 'cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    )
}
