class PitchProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.chunkSize = Math.round(sampleRate * 0.1)
        this.buffer = new Float32Array(this.chunkSize)
        this.bufferFill = 0
    }

    process(inputs) {
        const input = inputs[0]?.[0]
        if (!input) return true

        const spaceLeft = this.chunkSize - this.bufferFill

        if (input.length <= spaceLeft) {
            this.buffer.set(input, this.bufferFill)
            this.bufferFill += input.length
        } else {
            this.buffer.set(input.subarray(0, spaceLeft), this.bufferFill)

            if (this.port) {
                const chunkToSend = this.buffer.slice()
                this.port.postMessage(chunkToSend, [chunkToSend.buffer])
            }

            const leftovers = input.subarray(spaceLeft)
            this.buffer.set(leftovers, 0)
            this.bufferFill = leftovers.length
        }

        return true
    }
}

registerProcessor('pitch-processor', PitchProcessor)
