'use client'
import { useBeatMachine } from '@/hooks/useBeatMachine'
import Link from 'next/link'
import TunerSettingButton from '@/components/customButton'
import InputRange from '@/components/inputRange'
import BeatMachineGrid from './_components/beatMachineGrid'
import { TOOLS_CLASSNAME } from '@/consts'

export default function BeatMachine() {
    const { isActive, bpm, setBpm, grid, activeStep, toggleBeatMachine, toggleCell, error } =
        useBeatMachine()

    return (
        <div className={`bg-app-beat ${TOOLS_CLASSNAME}`}>
            {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            <TunerSettingButton isActive={isActive} onClick={toggleBeatMachine}>
                {isActive ? 'STOP' : 'START'}
            </TunerSettingButton>

            <InputRange
                min="60"
                max="200"
                value={bpm}
                onMouseUp={(e) => setBpm(parseInt(e.currentTarget.value))}
                label="BPM"
            />

            <BeatMachineGrid
                isActive={isActive}
                grid={grid}
                activeStep={activeStep}
                toggleCell={toggleCell}
            />
        </div>
    )
}
