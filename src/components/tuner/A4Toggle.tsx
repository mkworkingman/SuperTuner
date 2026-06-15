import { CustomButton, CustomGroupButton } from '@/components/ui'

type A4ToggleType = {
    value: number
    onChange: (val: number) => void
}

export default function A4Toggle({ value, onChange }: A4ToggleType) {
    const options = [440, 432, 415]

    return (
        <CustomGroupButton>
            {options.map((opt) => (
                <CustomButton key={opt} onClick={() => onChange(opt)} isActive={value === opt}>
                    {opt}
                </CustomButton>
            ))}
        </CustomGroupButton>
    )
}
