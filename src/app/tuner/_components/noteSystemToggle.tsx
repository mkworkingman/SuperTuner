import { NoteSystem } from '@/types'
import TunerSettingButton from './ui/tunerSettingButton'
import TunerSettingGroup from './ui/tunerSettingGroup'

export default function NoteSystemToggle({
    value,
    onChange,
}: {
    value: NoteSystem
    onChange: (val: NoteSystem) => void
}) {
    const options: { value: NoteSystem; label: string; example: string }[] = [
        { value: 'english', label: 'English', example: 'C D E F G A B' },
        { value: 'german', label: 'German', example: 'C D E F G A H' },
        { value: 'solfege', label: 'Solfege', example: 'Do Re Mi Fa Sol La Si' },
        { value: 'solfegeTi', label: 'Solfege (Ti)', example: 'Do Re Mi Fa Sol La Ti' },
    ]

    return (
        <TunerSettingGroup isColumn>
            {options.map((opt) => {
                return (
                    <TunerSettingButton
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        isActive={value === opt.value}
                    >
                        <p>{opt.label}</p>
                        <p className="text-xs font-normal opacity-70">{opt.example}</p>
                    </TunerSettingButton>
                )
            })}
        </TunerSettingGroup>
    )
}
