// One processor for every tool. A tool picks its DSP with a mode:
//   'sequencer' - beat machine / metronome: renders clicks from a step grid
//   'pitch'     - tuner: buffers mic input and posts 100ms chunks for analysis
//
// Messages in:
//   { type: 'SET_MODE', payload: 'sequencer' | 'pitch' }   resets all state
//   { type: 'INIT_GRID', payload: { grid, gridLength, stepsPerBeat } }  (enters 'sequencer')
//   { type: 'UPDATE_GRID', payload: { instrument, step, value } }
//   { type: 'UPDATE_SPB', payload: number }
//   { type: 'SET_BPM', payload: number }
//   { type: 'START' } / { type: 'STOP' }                    both modes
//
// Messages out:
//   { type: 'READY' }                        once per tab
//   { type: 'TICK', step }                   sequencer
//   { type: 'PITCH_CHUNK', payload: Float32Array }  pitch (buffer is transferred)
//   { type: 'AUTO_SUSPEND' }                 once per idle period

const IDLE_SUSPEND_SECONDS = 5
const CLICK_DURATION = Math.round(0.04 * sampleRate) // 40ms
const PITCH_CHUNK_SIZE = Math.round(sampleRate * 0.1) // 100ms

const INSTRUMENT_CONFIG = {
    kick: { freq: 60, gain: 0.2 },
    snare: { freq: 220, gain: 0.1 },
    hats: { freq: 1760, gain: 0.1 },
    crash: { freq: 3520, gain: 0.1 },
    beep: { freq: 440, gain: 0.1 },
    accent: { freq: 880, gain: 0.1 },
}

const isPositiveNumber = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0
const isStepIndex = (n, length) => Number.isInteger(n) && n >= 0 && n < length

class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super()
        this.pitchBuffer = new Float32Array(PITCH_CHUNK_SIZE)
        this.bpm = 120
        this.enterMode('sequencer')

        this.port.onmessage = (e) => this.handleMessage(e.data)
        this.port.postMessage({ type: 'READY' })
    }

    // Wipes everything the previous tool left behind. bpm survives: every
    // tool re-sends it with its config anyway.
    enterMode(mode) {
        this.mode = mode
        this.isPlaying = false
        this.lastActiveTime = null
        this.idleReported = false

        // sequencer
        this.grid = {}
        this.totalSteps = 0
        this.stepsPerBeat = 1
        this.currentStep = 0
        this.sampleCount = 0
        this.activeVoices = []

        // pitch
        this.pitchBufferFill = 0
    }

    handleMessage(data) {
        if (!data || typeof data !== 'object') return
        const { type, payload } = data

        switch (type) {
            case 'SET_MODE':
                if (payload === 'sequencer' || payload === 'pitch') this.enterMode(payload)
                break

            case 'START':
                this.isPlaying = true
                this.idleReported = false
                break

            case 'STOP':
                this.isPlaying = false
                this.currentStep = 0
                this.sampleCount = 0
                this.activeVoices = []
                this.pitchBufferFill = 0
                this.lastActiveTime = currentTime
                this.idleReported = false
                break

            case 'SET_BPM':
                if (isPositiveNumber(payload)) this.bpm = payload
                break

            case 'INIT_GRID': {
                if (!payload || typeof payload.grid !== 'object' || payload.grid === null) break
                const { grid, gridLength, stepsPerBeat } = payload
                if (!Number.isInteger(gridLength) || gridLength <= 0) break
                if (!Number.isInteger(stepsPerBeat) || stepsPerBeat <= 0) break

                const cleanGrid = {}
                for (const instrument in grid) {
                    if (INSTRUMENT_CONFIG[instrument] && Array.isArray(grid[instrument])) {
                        cleanGrid[instrument] = grid[instrument].slice(0, gridLength)
                    }
                }

                this.enterMode('sequencer')
                this.grid = cleanGrid
                this.totalSteps = gridLength
                this.stepsPerBeat = stepsPerBeat
                break
            }

            case 'UPDATE_GRID': {
                if (!payload) break
                const { instrument, step, value } = payload
                if (!INSTRUMENT_CONFIG[instrument] || !isStepIndex(step, this.totalSteps)) break
                ;(this.grid[instrument] ??= [])[step] = value
                break
            }

            case 'UPDATE_SPB':
                if (Number.isInteger(payload) && payload > 0) this.stepsPerBeat = payload
                break
        }
    }

    process(inputs, outputs) {
        if (!this.isPlaying) {
            this.checkIdle()
            return true
        }

        if (this.mode === 'pitch') {
            // Outputs stay zero-filled: the node is wired to the speakers, and
            // echoing the mic back would feed back.
            this.processPitch(inputs[0]?.[0])
        } else {
            this.processSequencer(outputs[0]?.[0])
        }

        return true
    }

    checkIdle() {
        if (this.idleReported || this.lastActiveTime === null) return
        if (currentTime - this.lastActiveTime >= IDLE_SUSPEND_SECONDS) {
            this.idleReported = true
            this.port.postMessage({ type: 'AUTO_SUSPEND' })
        }
    }

    processPitch(input) {
        if (!input) return

        let offset = 0
        while (offset < input.length) {
            const take = Math.min(PITCH_CHUNK_SIZE - this.pitchBufferFill, input.length - offset)
            this.pitchBuffer.set(input.subarray(offset, offset + take), this.pitchBufferFill)
            this.pitchBufferFill += take
            offset += take

            if (this.pitchBufferFill === PITCH_CHUNK_SIZE) {
                const chunk = this.pitchBuffer.slice()
                this.port.postMessage({ type: 'PITCH_CHUNK', payload: chunk }, [chunk.buffer])
                this.pitchBufferFill = 0
            }
        }
    }

    processSequencer(channel) {
        if (!channel || !this.totalSteps) return

        const samplesPerStep = (sampleRate * 60) / this.bpm / this.stepsPerBeat

        for (let i = 0; i < channel.length; i++) {
            if (this.sampleCount <= 0) {
                this.triggerStep(this.currentStep)
                this.port.postMessage({ type: 'TICK', step: this.currentStep })

                this.sampleCount += samplesPerStep
                this.currentStep = (this.currentStep + 1) % this.totalSteps
            }

            let mixedSample = 0

            for (let j = this.activeVoices.length - 1; j >= 0; j--) {
                const voice = this.activeVoices[j]
                const t = voice.elapsed / sampleRate
                const signal = Math.sign(Math.sin(2 * Math.PI * voice.freq * t))
                const envelope = 1 - voice.elapsed / CLICK_DURATION

                mixedSample += signal * envelope * voice.gain
                voice.elapsed++

                if (voice.elapsed >= CLICK_DURATION) {
                    this.activeVoices.splice(j, 1)
                }
            }

            channel[i] = Math.tanh(mixedSample)
            this.sampleCount--
        }
    }

    triggerStep(step) {
        for (const instrument in this.grid) {
            if (this.grid[instrument][step] === 1) {
                const { freq, gain } = INSTRUMENT_CONFIG[instrument]
                this.activeVoices.push({ freq, gain, elapsed: 0 })
            }
        }
    }
}

registerProcessor('audio-processor', AudioProcessor)
