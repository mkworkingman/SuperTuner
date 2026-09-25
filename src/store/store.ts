import { create } from 'zustand'
import { WorkletUrl } from '@/types'

interface StoreState {
    ctx: AudioContext | null
    workletNode: AudioWorkletNode | null
    loadedModules: Set<WorkletUrl[0]>
    isRunning: boolean
    status: 'idle' | 'pending' | 'success' | 'failure'
    actions: {
        initAudio: (moduleUrl: WorkletUrl) => Promise<void>
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
            loadedModules: new Set<WorkletUrl[0]>(),
            isRunning: false,
            status: 'idle',

            actions: {
                initAudio(moduleUrl) {
                    initPromise ??= (async () => {
                        set({ status: 'pending' })

                        let { ctx, workletNode, loadedModules } = get()
                        ctx ??= new (window.AudioContext || window.webkitAudioContext)()
                        set({ ctx })
                        if (ctx.state === 'running') await ctx.suspend()

                        if (!loadedModules.has(moduleUrl[0])) {
                            await ctx.audioWorklet.addModule(moduleUrl[0])
                            loadedModules = new Set(loadedModules).add(moduleUrl[0])
                        }

                        if (!workletNode) {
                            workletNode = new AudioWorkletNode(ctx, moduleUrl[1])
                            workletNode.connect(ctx.destination)
                        }

                        set({
                            ctx,
                            workletNode,
                            loadedModules,
                            status: 'success',
                        })
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
