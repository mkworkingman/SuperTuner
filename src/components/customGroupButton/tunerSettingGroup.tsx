type TunerSettingGroupProps = {
    isColumn?: boolean
    children: React.ReactNode
}

export default function TunerSettingGroup({ isColumn = false, children }: TunerSettingGroupProps) {
    return (
        <div
            className={`${isColumn ? 'flex flex-col' : 'w-fit flex-row'} w-fit rounded-xl border border-slate-800 bg-slate-900 p-1`}
        >
            {children}
        </div>
    )
}
