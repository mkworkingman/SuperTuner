type CustomGroupButtonProps = {
    isColumn?: boolean
    children: React.ReactNode
}

export default function CustomGroupButton({ isColumn = false, children }: CustomGroupButtonProps) {
    return (
        <div
            className={`${isColumn ? 'flex flex-col' : 'w-fit flex-row'} w-fit rounded-xl border border-slate-800 bg-slate-900 p-1`}
        >
            {children}
        </div>
    )
}
