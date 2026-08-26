import { create } from 'zustand'

interface StoreState {
    ctx: AudioContext | null
    workletNode: AudioWorkletNode | null
    loadedModules: Set<string>
    isRunning: boolean
    status: 'idle' | 'pending' | 'success' | 'failure'
    actions: {
        initAudio: () => Promise<void>
        runAudio: () => Promise<void>
        stopAudio: () => void
        suspendAudio: () => void
    }
}

export const useAudioEngineStore = create<StoreState>()(
    (set, get) =>
        ({
            ctx: null,
            workletNode: null,
            loadedModules: new Set<string>(),
            isRunning: false,
            status: 'idle',

            actions: {
                async initAudio() {
                    const status = get().status
                    if (status === 'pending' || status === 'success') return
                    set({ status: 'pending' })

                    let { ctx, workletNode, loadedModules } = get()
                    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
                    ctx.suspend()

                    try {
                        if (!loadedModules.has('/worklets/beatProcessor.js')) {
                            await ctx.audioWorklet.addModule('/worklets/beatProcessor.js')
                            loadedModules = new Set(loadedModules).add('/worklets/beatProcessor.js')
                        }

                        if (!workletNode) {
                            workletNode = new AudioWorkletNode(ctx, 'beat-processor')
                            workletNode.connect(ctx.destination)
                        }

                        set({
                            ctx,
                            workletNode,
                            loadedModules,
                            status: 'success',
                        })
                    } catch (error) {
                        console.error(error)
                        set({ status: 'failure' })
                    }
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
