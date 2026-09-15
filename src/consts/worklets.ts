import { WorkletUrlMap } from '@/types'

export const WORKLET_MODULE_URLS: WorkletUrlMap = {
    beat: ['/worklets/beatProcessor.js', 'beat-processor'],
    pitch: ['/worklets/pitchProcessor.js', 'pitch-processor'],
}
