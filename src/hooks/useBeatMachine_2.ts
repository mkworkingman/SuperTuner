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
        let cancelled = false

        state.actions.initAudio().catch((err) => {
            if (!cancelled) {
                console.error('Failed to init audio:', err)
            }
        })

        const port = state.workletNode?.port
        if (!port) return

        const handleMessage = (e: MessageEvent) => {
            switch (e.data.type) {
                case 'READY':
                    port.postMessage({
                        type: 'INIT_GRID',
                        payload: {
                            grid: INITIAL_GRID,
                            gridLength: INITIAL_GRID.kick?.length,
                            stepsPerBeat: 4,
                        },
                    })
                    console.log('READY')
                    break
                case 'AUTO_SUSPEND':
                    state.actions.suspendAudio()
                    break
                case 'TICK':
                    console.log(e.data.step)
                    break
            }
        }

        port.addEventListener('message', handleMessage)
        port.start()

        return () => {
            cancelled = true
            port.removeEventListener('message', handleMessage)
        }
    }, [state.actions, state.workletNode?.port])

    const startAudio = async () => {
        await state.actions.runAudio()
        state.workletNode?.port.postMessage({ type: 'START' })
    }

    const stopAudio = async () => {
        state.actions.stopAudio()
        state.workletNode?.port.postMessage({ type: 'STOP' })
    }

    return {
        startAudio,
        stopAudio,
    }
}
