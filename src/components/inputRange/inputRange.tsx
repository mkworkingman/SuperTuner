'use client'
import { MouseEventHandler, useState } from 'react'
import style from './inputRange.module.scss'

type InputRangeType = {
    label: string
    min: string | number
    max: string | number
    value: number
    onMouseUp: MouseEventHandler<HTMLInputElement>
    disabled?: boolean
}

export default function InputRange({
    label,
    min,
    max,
    value,
    onMouseUp,
    disabled,
}: InputRangeType) {
    const [visualValue, setVisualValue] = useState(value ?? 0)

    return (
        <div className="flex flex-col-reverse">
            <input
                type="range"
                min={min}
                max={max}
                value={visualValue}
                onMouseUp={onMouseUp}
                onChange={(e) => setVisualValue(Number(e.target.value))}
                className={style.input}
                disabled={disabled}
            />
            <label className={style.label}>
                {label}: {visualValue}
            </label>
        </div>
    )
}
