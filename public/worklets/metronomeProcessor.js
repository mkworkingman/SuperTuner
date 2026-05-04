class MetronomeProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.sampleCount = 0
        this.isPlaying = false
        this.bpm = 120
        this.beat = 0
        this.beatCount = 4
        this.isAccentEnabled = true
        this.currentClickFreq = 440

        this.port.onmessage = (e) => {
            const { type, value } = e.data

            switch (type) {
                case 'START':
                    this.isPlaying = true
                    break
                case 'STOP':
                    this.isPlaying = false
                    this.sampleCount = 0
                    this.beat = 0
                    break
                case 'SET_BPM':
                    this.bpm = value
                    break
                case 'SET_BEAT_COUNT':
                    this.beatCount = value
                    this.beat = 0
                    break
                case 'SET_ACCENT':
                    this.isAccentEnabled = value
                    break
                default:
                    console.warn(`Unknown message type: ${type}`)
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
                const isFirstBeat = this.beat % this.beatCount === 0
                this.currentClickFreq = this.isAccentEnabled && isFirstBeat ? 880 : 440

                this.sampleCount = samplesPerBeat
                this.beat++
            }

            const clickDuration = 0.05 * sampleRate
            const samplesSinceClickStart = samplesPerBeat - this.sampleCount

            if (samplesSinceClickStart < clickDuration) {
                const t = samplesSinceClickStart / sampleRate

                channel[i] =
                    Math.sign(Math.sin(2 * Math.PI * this.currentClickFreq * t)) *
                    (1 - samplesSinceClickStart / clickDuration) *
                    0.1
            } else {
                channel[i] = 0
            }

            this.sampleCount--
        }

        return true
    }
}

registerProcessor('metronome-processor', MetronomeProcessor)
