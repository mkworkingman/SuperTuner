import { useEffect } from 'react'
import { BeatGrid } from '@/types'
import { useAudioEngineStore } from '@/store/store'

const INITIAL_GRID: BeatGrid = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

export function useBeatMachine_2() {
    const state = useAudioEngineStore((state) => state)

    useEffect(() => {
        state.actions.initAudio()
        state.workletNode?.port.postMessage({
            type: 'INIT_GRID',
            payload: {
                grid: INITIAL_GRID,
                gridLength: INITIAL_GRID.kick?.length,
                stepsPerBeat: 4, // or whatever your default is
            },
        })
    }, [state.actions, state.workletNode?.port])

    const startAudio = async () => {
        await state.actions.resumeAudio()
        state.workletNode?.port.postMessage({ type: 'START' })
    }

    const stopAudio = async () => {
        await state.actions.suspendAudio()
        state.workletNode?.port.postMessage({ type: 'STOP' })
    }

    return {
        startAudio,
        stopAudio,
    }
}
