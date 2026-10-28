import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { fakeAudio, installFakeAudio } from './fakeAudio'

// Integration: the real hook and the real store, with fake Web Audio underneath.
// The store keeps initPromise/moduleLoaded at module level, so every test
// imports both fresh - a new "tab".

let useBeatMachine: typeof import('@/hooks/useBeatMachine').useBeatMachine

beforeEach(async () => {
    vi.resetModules()
    installFakeAudio()
    ;({ useBeatMachine } = await import('@/hooks/useBeatMachine'))
})

afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

const node = () => fakeAudio.nodes[0]!
const ctx = () => fakeAudio.contexts[0]!

// Mounts beat2's hook and waits until it is listening: the store's listener
// plus the hook's.
async function mount() {
    const hook = renderHook(() => useBeatMachine())
    await waitFor(() => expect(node().port.listeners.size).toBe(2))
    return hook
}

// Let READY (posted by the fake on port.start) and any pending effects land.
const settle = () => act(() => new Promise((r) => setTimeout(r, 10)))

// Full sequencer config. INIT_GRID itself puts the processor in sequencer mode.
const FULL_CONFIG = [
    expect.objectContaining({
        type: 'INIT_GRID',
        payload: expect.objectContaining({ gridLength: 16, stepsPerBeat: 4 }),
    }),
    expect.objectContaining({ type: 'SET_BPM', payload: expect.any(Number) }),
]

describe('harness', () => {
    it('creates one context and one node, and the hook listens on the shared port', async () => {
        await mount()
        expect(fakeAudio.contexts).toHaveLength(1)
        expect(fakeAudio.nodes).toHaveLength(1)
    })

    it('removes the hook listener on unmount, leaving the store one', async () => {
        const { unmount } = await mount()
        unmount()
        expect(node().port.listeners.size).toBe(1)
    })
})

describe('F1: leaving beat2 stops the audio', () => {
    it('posts STOP on unmount after Start', async () => {
        const { result, unmount } = await mount()
        await act(() => result.current.startAudio())
        expect(node().port.types()).toContain('START')

        node().port.posted.length = 0
        unmount()

        expect(node().port.types()).toContain('STOP')
    })

    it('suspends the shared context on unmount after Start', async () => {
        const { result, unmount } = await mount()
        await act(() => result.current.startAudio())
        expect(ctx().state).toBe('running')

        ctx().suspend.mockClear()
        unmount()
        await settle()

        expect(ctx().suspend).toHaveBeenCalled()
        expect(ctx().state).toBe('suspended')
    })
})

describe('F2: config is sent on every mount, not driven by READY', () => {
    it('sends the full config on first mount', async () => {
        await mount()
        await settle()

        expect(node().port.posted).toEqual(expect.arrayContaining(FULL_CONFIG))
    })

    it('sends the full config again when beat2 mounts a second time', async () => {
        const first = await mount()
        await settle()
        first.unmount()

        // Same tab: the processor already exists and never posts READY again.
        node().port.posted.length = 0
        await mount()
        await settle()

        expect(node().port.posted).toEqual(expect.arrayContaining(FULL_CONFIG))
    })
})
