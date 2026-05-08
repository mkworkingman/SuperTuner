class BeatProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.sampleCount = 0
        this.isPlaying = false
        this.bpm = 120
        this.currentStep = 0
        this.totalSteps = 16

        this.instrumentConfig = {
            kick: { freq: 60, gain: 0.2 },
            snare: { freq: 220, gain: 0.1 },
            hats: { freq: 1760, gain: 0.1 },
            crash: { freq: 3520, gain: 0.1 },
        }

        this.grid = {
            kick: new Array(16).fill(0),
            snare: new Array(16).fill(0),
            hats: new Array(16).fill(0),
            crash: new Array(16).fill(0),
        }

        this.activeVoices = []

        this.port.onmessage = (e) => {
            const { type, payload } = e.data
            switch (type) {
                case 'START':
                    this.isPlaying = true
                    break
                case 'STOP':
                    this.isPlaying = false
                    this.sampleCount = 0
                    this.currentStep = 0
                    this.activeVoices = []
                    break
                case 'SET_BPM':
                    this.bpm = payload
                    break
                case 'UPDATE_GRID':
                    this.grid[payload.instrument][payload.step] = payload.value
                    break
            }
        }
    }

    process(inputs, outputs) {
        const output = outputs[0]
        const channel = output[0]

        if (!this.isPlaying || !channel) return true

        const samplesPerStep = (sampleRate * 60) / this.bpm / 4

        for (let i = 0; i < channel.length; i++) {
            if (this.sampleCount <= 0) {
                this.triggerStep(this.currentStep)
                this.port.postMessage({ type: 'TICK', step: this.currentStep })

                this.sampleCount = samplesPerStep
                this.currentStep = (this.currentStep + 1) % this.totalSteps
            }

            let mixedSample = 0
            const clickDuration = 0.04 * sampleRate // 40ms duration

            for (let j = this.activeVoices.length - 1; j >= 0; j--) {
                const voice = this.activeVoices[j]
                const progress = voice.elapsed / clickDuration
                const t = voice.elapsed / sampleRate

                // Apply pitch drop for the kick to make it sound "tighter"
                let currentFreq = voice.freq

                // Waveform generation
                const signal = Math.sign(Math.sin(2 * Math.PI * currentFreq * t))
                const envelope = 1 - progress

                mixedSample += signal * envelope * voice.gain
                voice.elapsed++

                if (voice.elapsed >= clickDuration) {
                    this.activeVoices.splice(j, 1)
                }
            }

            // Soft clipping (tanh) prevents harsh digital distortion if multiple sounds peak
            channel[i] = Math.tanh(mixedSample)
            this.sampleCount--
        }

        return true
    }

    triggerStep(step) {
        for (const instrument in this.grid) {
            if (this.grid[instrument][step] === 1) {
                const config = this.instrumentConfig[instrument]
                this.activeVoices.push({
                    freq: config.freq,
                    gain: config.gain,
                    elapsed: 0,
                })
            }
        }
    }
}

registerProcessor('beat-processor', BeatProcessor)
