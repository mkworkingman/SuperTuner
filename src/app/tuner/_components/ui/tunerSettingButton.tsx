type TunerSettingButtonType = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive: boolean
}

export default function TunerSettingButton({ isActive, ...props }: TunerSettingButtonType) {
    return (
        <button
            {...props}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                isActive
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'cursor-pointer text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
        >
            {props.children}
        </button>
    )
}
