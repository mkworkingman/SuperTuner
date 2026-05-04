class MetronomeProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.sampleCount = 0
        this.isPlaying = false
        this.bpm = 120
        this.beat = 0

        this.port.onmessage = (e) => {
            const { type, value } = e.data
            if (type === 'START') this.isPlaying = true
            if (type === 'STOP') {
                this.isPlaying = false
                this.sampleCount = 0
                this.beat = 0
            }
            if (type === 'SET_BPM') {
                this.bpm = value
            }
        }
    }

    process(inputs, outputs) {
        const output = outputs[0]
        const channel = output[0]

        if (!this.isPlaying || !channel) return true

        const samplesPerBeat = (sampleRate * 60) / this.bpm

        for (let i = 0; i < channel.length; i++) {
            if (this.sampleCount <= 0) {
                this.triggerClick(channel, i)
                this.sampleCount = samplesPerBeat
                this.beat++
            } else {
                const clickDuration = 0.05 * sampleRate
                const samplesSinceClick = samplesPerBeat - this.sampleCount

                if (samplesSinceClick < clickDuration) {
                    const freq = (this.beat - 1) % 4 === 0 ? 880 : 440
                    const t = samplesSinceClick / sampleRate
                    channel[i] =
                        Math.sign(Math.sin(2 * Math.PI * freq * t)) *
                        (1 - samplesSinceClick / clickDuration) *
                        0.1
                } else {
                    channel[i] = 0
                }
            }
            this.sampleCount--
        }

        return true
    }

    triggerClick(channel, index) {
        channel[index] = 0.1
    }
}

registerProcessor('metronome-processor', MetronomeProcessor)
