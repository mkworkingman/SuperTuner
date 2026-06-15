import { AccidentalMode } from '@/types'
import { CustomButton, CustomGroupButton } from '@/components/ui'

type AccidentalToggleProps = {
    value: AccidentalMode
    onChange: (val: AccidentalMode) => void
}

export default function AccidentalToggle({ value, onChange }: AccidentalToggleProps) {
    const options: { value: AccidentalMode; label: string }[] = [
        { value: 'sharps', label: '♯' },
        { value: 'flats', label: '♭' },
    ]

    return (
        <CustomGroupButton>
            {options.map((opt) => (
                <CustomButton
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    isActive={value === opt.value}
                >
                    {opt.label}
                </CustomButton>
            ))}
        </CustomGroupButton>
    )
}
