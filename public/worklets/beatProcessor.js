/**
 * beat-processor — owns the timing clock for the metronome and beat machine.
 * Counts samples and emits a `TICK` per step; the main thread only sends config.
 *
 * Message protocol is typed in src/types/worklet.ts
 * (BeatProcessorMessage main->worklet, BeatProcessorEvent worklet->main).
 * Keep the `switch (type)` below in sync with that union.
 */
class BeatProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.sampleCount = 0
        this.isPlaying = false
        this.bpm = 120
        this.currentStep = 0
        this.totalSteps = null
        this.stepsPerBeat = null

        this.instrumentConfig = {
            kick: { freq: 60, gain: 0.2 },
            snare: { freq: 220, gain: 0.1 },
            hats: { freq: 1760, gain: 0.1 },
            crash: { freq: 3520, gain: 0.1 },
            beep: { freq: 440, gain: 0.1 },
            accent: { freq: 880, gain: 0.1 },
        }

        this.grid = {}

        this.activeVoices = []

        this.port.onmessage = (e) => {
            const { type, payload } = e.data
            switch (type) {
                case 'START':
                    this.isPlaying = true
                    console.log('START')
                    break
                case 'STOP':
                    this.isPlaying = false
                    this.sampleCount = 0
                    this.currentStep = 0
                    this.activeVoices = []
                    console.log('STOP')
                    break
                case 'SET_BPM':
                    this.bpm = payload
                    console.log('SET_BPM')
                    break
                case 'UPDATE_GRID':
                    this.grid[payload.instrument][payload.step] = payload.value
                    console.log('UPDATE_GRID')
                    break
                case 'UPDATE_SPB':
                    this.stepsPerBeat = payload
                    console.log('UPDATE_SPB')
                    break
                case 'INIT_GRID':
                    this.grid = payload.grid
                    this.totalSteps = payload.gridLength
                    this.stepsPerBeat = payload.stepsPerBeat
                    console.log('INIT_GRID')
                    break
            }
        }
    }

    process(inputs, outputs) {
        const output = outputs[0]
        const channel = output[0]

        if (!this.isPlaying || !channel) return true

        const samplesPerStep = (sampleRate * 60) / this.bpm / this.stepsPerBeat

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

                let currentFreq = voice.freq

                const signal = Math.sign(Math.sin(2 * Math.PI * currentFreq * t))
                const envelope = 1 - progress

                mixedSample += signal * envelope * voice.gain
                voice.elapsed++

                if (voice.elapsed >= clickDuration) {
                    this.activeVoices.splice(j, 1)
                }
            }

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
