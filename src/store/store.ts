import { create } from 'zustand'

interface StoreState {
    ctx: AudioContext | null
    workletNode: AudioWorkletNode | null
    loadedModules: Set<string>
    isRunning: boolean
    status: 'idle' | 'pending' | 'success' | 'failure'
    autoSuspendTimer: ReturnType<typeof setTimeout> | null
    actions: {
        initAudio: () => Promise<void>
        resumeAudio: () => Promise<void>
        suspendAudio: () => Promise<void>
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
            autoSuspendTimer: null,

            actions: {
                async initAudio() {
                    const status = get().status
                    if (status === 'pending' || status === 'success') return
                    set({ status: 'pending' })

                    let { ctx, workletNode, loadedModules } = get()
                    ctx ??= new (window.AudioContext || window.webkitAudioContext)()

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
                            autoSuspendTimer: setTimeout(() => {
                                ctx.suspend()
                            }, 5000),
                        })
                    } catch (error) {
                        console.error(error)
                        set({ status: 'failure' })
                    }
                },

                async resumeAudio() {
                    const { ctx, status, autoSuspendTimer } = get()
                    if (status !== 'success') return

                    if (autoSuspendTimer) {
                        clearTimeout(autoSuspendTimer)
                    }

                    if (ctx?.state === 'suspended') await ctx.resume()
                    set({ isRunning: true, autoSuspendTimer: null })
                },

                async suspendAudio() {
                    const { ctx, status } = get()
                    if (ctx?.state !== 'running' || status !== 'success') return

                    set({
                        isRunning: false,
                        autoSuspendTimer: setTimeout(() => {
                            ctx.suspend()
                        }, 5000),
                    })
                },
            },
        }) satisfies StoreState,
)
