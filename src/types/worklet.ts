import { BeatGrid } from './beatMachine'

/**
 * Message protocol for `beat-processor` (public/worklets/beatProcessor.js),
 * shared by the metronome and the beat machine. Keep this in sync with the
 * `switch (type)` in the worklet.
 */

// main thread -> worklet
export type BeatProcessorMessage =
    | {
          type: 'INIT_GRID'
          payload: { grid: BeatGrid; gridLength: number; stepsPerBeat: number }
      }
    | {
          type: 'UPDATE_GRID'
          payload: { instrument: string; step: number; value: number }
      }
    | { type: 'SET_BPM'; payload: number }
    | { type: 'UPDATE_SPB'; payload: number }
    | { type: 'START' }
    | { type: 'STOP' }

// worklet -> main thread
export type BeatProcessorEvent = { type: 'TICK'; step: number }

/**
 * `pitch-processor` (public/worklets/pitchProcessor.js) posts a transferred
 * Float32Array chunk of mic samples. There are no main -> worklet messages.
 */
export type PitchProcessorEvent = Float32Array
