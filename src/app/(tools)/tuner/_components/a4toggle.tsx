import TunerSettingButton from '@/components/customButton'
import TunerSettingGroup from '@/components/customGroupButton'

type A4ToggleType = {
    value: number
    onChange: (val: number) => void
}

export default function A4Toggle({ value, onChange }: A4ToggleType) {
    const options = [440, 432, 415]

    return (
        <TunerSettingGroup>
            {options.map((opt) => (
                <TunerSettingButton
                    key={opt}
                    onClick={() => onChange(opt)}
                    isActive={value === opt}
                >
                    {opt}
                </TunerSettingButton>
            ))}
        </TunerSettingGroup>
    )
}
