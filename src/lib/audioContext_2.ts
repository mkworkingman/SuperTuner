const audioEngine = {
    ctx: null as AudioContext | null,
    audioWorkletNode: null as AudioWorkletNode | null,
    loadedModules: new Set<string>(),

    async getAudioContext(url: string): Promise<AudioContext> {
        this.ctx ??= new (window.AudioContext || window.webkitAudioContext)()
        if (!this.loadedModules.has(url)) {
            await this.ctx.audioWorklet.addModule(url)
            this.loadedModules.add(url)
        }
        if (this.ctx.state === 'suspended') await this.ctx.resume()
        return this.ctx
    },

    async getAudioWorkletNode(): Promise<AudioWorkletNode> {
        const ctx = await this.getAudioContext('/worklets/beatProcessor.js')
        if (!this.audioWorkletNode) {
            this.audioWorkletNode = new AudioWorkletNode(ctx, 'beat-processor')
            this.audioWorkletNode.connect(ctx.destination)
        }
        // ctx.suspend()
        return this.audioWorkletNode
    },

    async resumeAudio() {
        if (this.ctx?.state === 'suspended') await this.ctx.resume()
    },

    async suspendAudio() {
        if (this.ctx?.state === 'running') await this.ctx.suspend()
    },
}

export default audioEngine
