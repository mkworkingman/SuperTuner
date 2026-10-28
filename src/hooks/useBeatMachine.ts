import { useEffect, useRef } from 'react'
import { BeatGrid } from '@/types'
import { useAudioActions, useWorkletNode } from '@/store/store'

const INITIAL_GRID: BeatGrid = {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hats: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}
const INITIAL_BPM = 120
const STEPS_PER_BEAT = 4

export function useBeatMachine() {
    const actions = useAudioActions()
    const workletNode = useWorkletNode()
    const currentStepRef = useRef(0)
    const stepIndicatorRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let cancelled = false

        actions.initAudio().catch((err) => {
            if (!cancelled) {
                console.error('Failed to init audio:', err)
            }
        })

        const port = workletNode?.port
        if (!port) return

        const handleMessage = (e: MessageEvent) => {
            switch (e.data.type) {
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

        // The node is shared and READY fires once per tab: send the full config
        // on every mount, the processor may still hold another tool's state.
        port.postMessage({
            type: 'INIT_GRID',
            payload: {
                grid: INITIAL_GRID,
                gridLength: INITIAL_GRID.kick?.length,
                stepsPerBeat: STEPS_PER_BEAT,
            },
        })
        port.postMessage({ type: 'SET_BPM', payload: INITIAL_BPM })

        return () => {
            cancelled = true
            port.postMessage({ type: 'STOP' })
            actions.stopAudio()
            actions.suspendAudio()
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
