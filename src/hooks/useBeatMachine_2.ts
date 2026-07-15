import { useState } from 'react'
import { BeatGrid } from '@/types'
import audioEngine from '@/lib/audioContext_2'

const INITIAL_GRID: BeatGrid = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

export function useBeatMachine_2() {
    // const [isActive, setIsActive] = useState(false)
    // console.log(audioEngine)
    // const init = async () => {
    //     const node = await audioEngine.getAudioWorkletNode()
    //     node.port.postMessage({
    //         type: 'INIT_GRID',
    //         payload: {
    //             grid: INITIAL_GRID,
    //             gridLength: INITIAL_GRID.kick?.length,
    //             stepsPerBeat: 4, // or whatever your default is
    //         },
    //     })
    //     node.port.postMessage({ type: 'START' })
    //     audioEngine.suspendAudio()
    // }
    // init()
    // console.log(audioEngine)
}
