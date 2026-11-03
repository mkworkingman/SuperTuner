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

describe('effect dependencies: [actions, workletNode]', () => {
    it('re-runs when the node appears: nothing on the first render, then listener and config', async () => {
        renderHook(() => useBeatMachine())
        // initAudio is async: the first render runs with workletNode === null.
        expect(fakeAudio.nodes).toHaveLength(0)

        await waitFor(() => expect(node().port.listeners.size).toBe(2))
        expect(node().port.posted).toEqual(expect.arrayContaining(FULL_CONFIG))
    })

    it('does not re-run on a plain re-render: no STOP, no config resend, same listener', async () => {
        const { rerender } = await mount()
        await settle()
        node().port.posted.length = 0
        const addCalls = node().port.addEventListener.mock.calls.length

        rerender()
        rerender()
        await settle()

        expect(node().port.posted).toEqual([])
        expect(node().port.addEventListener.mock.calls.length).toBe(addCalls)
        expect(node().port.listeners.size).toBe(2)
    })

    it('does not stop playback when the hook re-renders while playing', async () => {
        const { result, rerender } = await mount()
        await act(() => result.current.startAudio())
        ctx().suspend.mockClear()
        node().port.posted.length = 0

        rerender()
        await settle()

        expect(node().port.types()).not.toContain('STOP')
        expect(ctx().suspend).not.toHaveBeenCalled()
        expect(ctx().state).toBe('running')
    })

    it('keeps the same actions object across renders and state changes', async () => {
        const { useAudioActions } = await import('@/store/store')
        const { result, rerender } = renderHook(() => useAudioActions())
        const first = result.current

        await act(() => first.initAudio())
        await act(() => first.runAudio())
        act(() => first.stopAudio())
        rerender()

        expect(result.current).toBe(first)
    })
})

describe('StrictMode (dev): mount, cleanup, mount', () => {
    it('ends with one context, one node, the hook listening and the config sent last', async () => {
        renderHook(() => useBeatMachine(), { reactStrictMode: true })
        await waitFor(() => expect(node().port.listeners.size).toBe(2))
        await settle()

        expect(fakeAudio.contexts).toHaveLength(1)
        expect(fakeAudio.nodes).toHaveLength(1)

        const types = node().port.types()
        expect(types.lastIndexOf('INIT_GRID')).toBeGreaterThan(types.lastIndexOf('STOP'))
        expect(types.lastIndexOf('SET_BPM')).toBeGreaterThan(types.lastIndexOf('STOP'))
    })

    it('still plays after the double effect, and still tears down on unmount', async () => {
        const { result, unmount } = renderHook(() => useBeatMachine(), { reactStrictMode: true })
        await waitFor(() => expect(node().port.listeners.size).toBe(2))
        await settle()

        await act(() => result.current.startAudio())
        expect(ctx().state).toBe('running')

        node().port.posted.length = 0
        unmount()
        await settle()

        expect(node().port.types()).toContain('STOP')
        expect(ctx().state).toBe('suspended')
        expect(node().port.listeners.size).toBe(1)
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
