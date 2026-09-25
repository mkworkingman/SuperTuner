import { create } from 'zustand'

interface StoreState {
    ctx: AudioContext | null
    workletNode: AudioWorkletNode | null
    isRunning: boolean
    status: 'idle' | 'pending' | 'success' | 'failure'
    actions: {
        initAudio: () => Promise<void>
        runAudio: () => Promise<void>
        stopAudio: () => void
        suspendAudio: () => void
    }
}

let initPromise: Promise<void> | null = null

export const useAudioEngineStore = create<StoreState>()(
    (set, get) =>
        ({
            ctx: null,
            workletNode: null,
            isRunning: false,
            status: 'idle',

            actions: {
                initAudio() {
                    initPromise ??= (async () => {
                        set({ status: 'pending' })

                        let { ctx } = get()
                        ctx ??= new (window.AudioContext || window.webkitAudioContext)()
                        set({ ctx })
                        if (ctx.state === 'running') await ctx.suspend()

                        await ctx.audioWorklet.addModule('/worklets/processor2.js')

                        const workletNode = new AudioWorkletNode(ctx, 'beat-processor')
                        workletNode.connect(ctx.destination)

                        set({ workletNode, status: 'success' })
                    })().catch((error) => {
                        console.error(error)
                        set({ status: 'failure' })
                        initPromise = null
                    })

                    return initPromise
                },

                async runAudio() {
                    const { ctx, status } = get()
                    if (status !== 'success') return

                    if (ctx?.state === 'suspended') await ctx.resume()
                    set({ isRunning: true })
                },

                stopAudio() {
                    const { ctx, status } = get()
                    if (ctx?.state !== 'running' || status !== 'success') return

                    set({
                        isRunning: false,
                    })
                },

                suspendAudio() {
                    const { ctx } = get()
                    ctx?.suspend()
                },
            },
        }) satisfies StoreState,
)
