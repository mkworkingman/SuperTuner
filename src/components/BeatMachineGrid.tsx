'use client'
import { BeatGrid } from '@/types'

type BeatMachineGridType = {
    isActive: boolean
    grid: BeatGrid
    activeStep: number
    toggleCell: (instrument: string, step: number) => void
}

export default function BeatMachineGrid({
    isActive,
    grid,
    activeStep,
    toggleCell,
}: BeatMachineGridType) {
    return (
        <div className="grid gap-3">
            {Object.entries(grid).map(([instrument, steps]) => (
                <div key={instrument} className="flex items-center gap-3">
                    <span className="w-16 text-right font-mono text-[10px] font-bold tracking-tighter text-slate-500 uppercase">
                        {instrument}
                    </span>

                    <div className="flex flex-1 gap-1.5">
                        {steps.map((value, i) => {
                            const isCurrent = i === activeStep && isActive
                            return (
                                <button
                                    key={i}
                                    onClick={() => toggleCell(instrument, i)}
                                    className={`h-12 flex-1 rounded-sm transition-all duration-75 ${value === 1 ? 'bg-orange-500' : 'bg-slate-800'} ${isCurrent ? 'opacity-100 ring-2 ring-white ring-inset' : value === 1 ? 'opacity-90' : 'opacity-60'} ${i % 4 === 0 && i !== 0 ? 'border-l border-slate-600' : 'border-none'} hover:brightness-110 active:scale-95`}
                                />
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
