import { AccidentalMode } from '@/types'
import TunerSettingButton from './ui/tunerSettingButton'
import TunerSettingGroup from './ui/tunerSettingGroup'

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
        <TunerSettingGroup>
            {options.map((opt) => (
                <TunerSettingButton
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    isActive={value === opt.value}
                >
                    {opt.label}
                </TunerSettingButton>
            ))}
        </TunerSettingGroup>
    )
}
