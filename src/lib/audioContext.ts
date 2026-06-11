let ctx: AudioContext | null = null
const loadedModules = new Set<string>()

export async function ensureWorklet(url: string): Promise<AudioContext> {
    const audioCtx = (ctx ??= new (window.AudioContext || window.webkitAudioContext)())
    if (!loadedModules.has(url)) {
        await audioCtx.audioWorklet.addModule(url)
        loadedModules.add(url)
    }
    if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
    }
    return audioCtx
}

export async function resumeAudio() {
    if (ctx?.state === 'suspended') await ctx.resume()
}

export async function suspendAudio() {
    if (ctx?.state === 'running') await ctx.suspend()
}
