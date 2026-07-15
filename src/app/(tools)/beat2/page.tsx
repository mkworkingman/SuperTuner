'use client'
import { useBeatMachine } from '@/hooks/useBeatMachine'
import { CustomButton, InputRange } from '@/components/ui'
import BeatMachineGrid from '@/components/BeatMachineGrid'
import { TOOLS_CLASSNAME } from '@/consts'
import { BeatGrid } from '@/types'
import { useBeatMachine_2 } from '@/hooks/useBeatMachine_2'

const INITIAL_GRID: BeatGrid = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

const STEPS_PER_BEAT = 4

export default function BeatMachine() {
    useBeatMachine_2()

    return (
        <div className={`bg-app-beat ${TOOLS_CLASSNAME}`}>
            {/* {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            <CustomButton isActive={isActive} onClick={toggleBeatMachine}>
                {isActive ? 'STOP' : 'START'}
            </CustomButton> */}

            {/* <button onClick={() => resize(12)}>RESIZE(12)</button>
            <button onClick={() => changeBeatsPerMinute(2)}>stepsPerBeat(2)</button>

            <InputRange
                min="60"
                max="200"
                value={bpm}
                onMouseUp={(e) => setBpm(parseInt(e.currentTarget.value))}
                label="BPM"
            /> */}

            {/* <BeatMachineGrid
                isActive={isActive}
                grid={grid}
                activeStep={activeStep}
                toggleCell={toggleCell}
            /> */}
        </div>
    )
}
