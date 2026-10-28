import { vi } from 'vitest'

// Just enough of Web Audio for src/store/store.ts: one context, one node, a port
// that records what was posted and lets a test play the processor's side.

export type PostedMessage = { type: string; payload?: unknown }

export class FakePort {
    posted: PostedMessage[] = []
    listeners = new Set<(e: { data: unknown }) => void>()
    private started = false

    postMessage = vi.fn((msg: PostedMessage) => {
        this.posted.push(msg)
    })

    addEventListener = vi.fn((type: string, fn: (e: { data: unknown }) => void) => {
        if (type === 'message') this.listeners.add(fn)
    })

    removeEventListener = vi.fn((type: string, fn: (e: { data: unknown }) => void) => {
        if (type === 'message') this.listeners.delete(fn)
    })

    // Like the real processor: READY is posted from its constructor, once per
    // tab, and delivered to whoever is listening when the port starts.
    start = vi.fn(() => {
        if (this.started) return
        this.started = true
        setTimeout(() => this.emit({ type: 'READY' }), 0)
    })

    emit(data: unknown) {
        for (const fn of [...this.listeners]) fn({ data })
    }

    types() {
        return this.posted.map((m) => m.type)
    }
}

export class FakeAudioContext {
    state: AudioContextState = 'suspended'
    destination = {}
    audioWorklet = { addModule: vi.fn(async () => {}) }

    suspend = vi.fn(async () => {
        this.state = 'suspended'
    })

    resume = vi.fn(async () => {
        this.state = 'running'
    })

    constructor() {
        fakeAudio.contexts.push(this)
    }
}

export class FakeAudioWorkletNode {
    port = new FakePort()
    connect = vi.fn()
    addEventListener = vi.fn()

    constructor() {
        fakeAudio.nodes.push(this)
    }
}

export const fakeAudio = {
    contexts: [] as FakeAudioContext[],
    nodes: [] as FakeAudioWorkletNode[],
}

export function installFakeAudio() {
    fakeAudio.contexts.length = 0
    fakeAudio.nodes.length = 0
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode)
    return fakeAudio
}
