import { create } from 'zustand'
import { WorkletUrl } from '@/types'

interface StoreState {
    ctx: AudioContext | null
    workletNode: AudioWorkletNode | null
    loadedModules: Set<WorkletUrl>
    isRunning: boolean
    status: 'idle' | 'pending' | 'success' | 'failure'
    actions: {
        initAudio: (moduleUrl: WorkletUrl) => Promise<void>
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
            loadedModules: new Set<WorkletUrl>(),
            isRunning: false,
            status: 'idle',

            actions: {
                async initAudio(moduleUrl) {
                    const status = get().status
                    if (status === 'pending' || status === 'success') return
                    set({ status: 'pending' })

                    let { ctx, workletNode, loadedModules } = get()
                    ctx ??= new (window.AudioContext || window.webkitAudioContext)()
                    ctx.suspend()

                    try {
                        if (!loadedModules.has(moduleUrl)) {
                            await ctx.audioWorklet.addModule(moduleUrl)
                            loadedModules = new Set(loadedModules).add(moduleUrl)
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
