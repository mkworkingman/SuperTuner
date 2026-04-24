import { NoteSystem } from '@/types'

export default function NoteSystemToggle({
    value,
    onChange,
}: {
    value: NoteSystem
    onChange: (val: NoteSystem) => void
}) {
    const systems: { label: NoteSystem; example: string }[] = [
        { label: 'english', example: 'C D E F G A B' },
        { label: 'german', example: 'C D E F G A H' },
        { label: 'solfege', example: 'Do Re Mi Fa Sol La Si' },
        { label: 'solfegeTi', example: 'Do Re Mi Fa Sol La Ti' },
    ]

    return (
        <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-1">
            {systems.map((sys) => {
                const isActive = value === sys.label
                return (
                    <button
                        key={sys.label}
                        onClick={() => onChange(sys.label)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        } `}
                    >
                        <p>{sys.label}</p>
                        <p>{sys.example}</p>
                    </button>
                )
            })}
        </div>
    )
}
