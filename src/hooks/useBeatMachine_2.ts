import { useEffect, useRef } from 'react'
import { BeatGrid } from '@/types'
import { WORKLET_MODULE_URLS } from '@/consts'
import { useAudioEngineStore } from '@/store/store'

const INITIAL_GRID: BeatGrid = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

export function useBeatMachine_2() {
    const actions = useAudioEngineStore((state) => state.actions)
    const workletNode = useAudioEngineStore((state) => state.workletNode)
    const currentStepRef = useRef(0)
    const stepIndicatorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let cancelled = false

        actions.initAudio(WORKLET_MODULE_URLS.beat).catch((err) => {
            if (!cancelled) {
                console.error('Failed to init audio:', err)
            }
        })

        const port = workletNode?.port
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
                    actions.suspendAudio()
                    break
                case 'TICK':
                    console.log(e.data.step)

                    const prevStep = currentStepRef.current
                    currentStepRef.current = e.data.step
                    if (stepIndicatorRef.current) {
                        stepIndicatorRef.current
                            .querySelector(`[data-step="${prevStep}"]`)
                            ?.removeAttribute('data-active')
                        stepIndicatorRef.current
                            .querySelector(`[data-step="${e.data.step}"]`)
                            ?.setAttribute('data-active', 'true')
                    }
                    break
            }
        }

        port.addEventListener('message', handleMessage)
        port.start()

        return () => {
            cancelled = true
            port.removeEventListener('message', handleMessage)
        }
    }, [actions, workletNode])

    const startAudio = async () => {
        await actions.runAudio()
        workletNode?.port.postMessage({ type: 'START' })
    }

    const stopAudio = async () => {
        actions.stopAudio()
        workletNode?.port.postMessage({ type: 'STOP' })
    }

    return {
        startAudio,
        stopAudio,
        stepIndicatorRef,
    }
}
