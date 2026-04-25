class PitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.chunkSize = Math.round(sampleRate * 0.1)
        this.buffer = new Float32Array(this.chunkSize + 2048)
        this.writeIndex = 0
    }

    process(inputs) {
        const input = inputs[0]?.[0]
        if (!input) return true

        for (let i = 0; i < input.length; ) {
            const remainingInBuffer = this.buffer.length - this.writeIndex
            const toCopy = Math.min(input.length - i, remainingInBuffer)

            if (toCopy === 0) {
                this.port.postMessage(new Error('Buffer overflow'))
                break
            }

            this.buffer.set(input.subarray(i, i + toCopy), this.writeIndex)
            this.writeIndex += toCopy
            i += toCopy

            if (this.writeIndex >= this.chunkSize) {
                const chunk = this.buffer.slice(0, this.chunkSize)
                this.port.postMessage(chunk, [chunk.buffer])
                const remaining = this.writeIndex - this.chunkSize
                if (remaining > 0) {
                    this.buffer.copyWithin(0, this.chunkSize, this.writeIndex)
                }
                this.writeIndex = remaining
            }
        }
        return true
    }
}

registerProcessor('pitch-processor', PitchProcessor)
