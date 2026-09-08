---
name: zustand
description: Zustand store conventions for this project - export custom hooks not the raw store, atomic selectors and useShallow, the single `actions` object and its single hook, actions modelled as events. Use before writing or changing src/store/*, any hook that reads a store, or any component that subscribes to state.
---

# Zustand

This project is on **zustand v5**. Two v5 facts drive most of the rules below:

- Selectors run through `useSyncExternalStore`. A selector that returns a fresh
  object/array on every call does not merely re-render too often - it can loop
  forever.
- `create` no longer takes an equality function as a second argument. Use
  `useShallow` from `zustand/shallow`, or `createWithEqualityFn` from
  `zustand/traditional`.

## Export hooks, not the store

The raw store hook stays module-private. Only purpose-named hooks leave
`src/store/`.

```ts
// src/store/store.ts
const useAudioEngineStore = create<StoreState>()(...)   // not exported

export const useWorkletNode = () => useAudioEngineStore((s) => s.workletNode)
export const useAudioStatus = () => useAudioEngineStore((s) => s.status)
export const useAudioActions = () => useAudioEngineStore((s) => s.actions)
```

Components and feature hooks import `useWorkletNode()`, never a selector
literal. Selectors spread across the app weld every consumer to the store's
internal shape; renaming a field then means touching every call site instead
of one hook body.

The single hard rule inside this one: **never call a store hook with no
selector.** `useAudioEngineStore()` subscribes to the entire store and
re-renders the component on every `set` anywhere in it.

Don't take this to the point of ceremony. One hook per thing a consumer
actually asks for - not one hook per field for fields nothing reads.

## Atomic selectors: the *return value* is what must be stable

The selector function does not need referential stability. Zustand re-runs it
on every render and compares the **result** with `Object.is`. An inline arrow
is correct; wrapping a selector in `useCallback` buys nothing (and this project
sets `reactCompiler: true`, so hand-written memo hooks need a reason).

What breaks is a selector that builds a new value each call:

```ts
// WRONG - new object identity every render, never Object.is-equal
const { ctx, status } = useAudioEngineStore((s) => ({ ctx: s.ctx, status: s.status }))

// WRONG - new array every render
const urls = useAudioEngineStore((s) => [...s.loadedModules])
```

Three fixes, in order of preference:

```ts
// 1. Atomic picks - one subscription per primitive/reference. Default choice.
const ctx = useAudioEngineStore((s) => s.ctx)
const status = useAudioEngineStore((s) => s.status)

// 2. useShallow, when the values genuinely travel together
import { useShallow } from 'zustand/shallow'
const { ctx, status } = useAudioEngineStore(
    useShallow((s) => ({ ctx: s.ctx, status: s.status })),
)

// 3. Store the derived value, if computing it is expensive
```

`useShallow` is shallow only. It does not save a selector that maps over a
collection into fresh objects.

Derived data is computed in the hook or the component, not stored - unless the
computation is expensive, in which case it becomes real state updated by an
action.

## One `actions` object, one actions hook

State and actions are separated. All actions live in a single nested `actions`
object, exposed through exactly one hook, destructured at the call site:

```ts
const { initAudio, runAudio, stopAudio } = useAudioActions()
```

This works because of a property that must be actively protected: **`actions`
is constructed once and never replaced by `set`.** So `(s) => s.actions` is an
atomic pick whose identity never changes - destructuring it costs zero extra
renders, needs no `useShallow`, and the functions are safe to list in
`useEffect` deps. `src/hooks/useBeatMachine_2.ts` already relies on this.

What breaks that guarantee - do none of these:

- `set(next, true)` (replace mode) anywhere. It drops `actions` entirely.
- Rebuilding or spreading `actions` inside an action.
- A "reset" action that restores a whole initial-state object. Reset the state
  keys explicitly and leave `actions` untouched.
- `persist` without `partialize` excluding `actions`. Functions do not survive
  a round trip through JSON.

A component that only dispatches should subscribe to nothing else - pulling
`actions` alone means it never re-renders on state changes.

Note this is a convention, not a zustand mandate: the official docs colocate
actions at the top level, and even document a no-store-actions style. This
project uses the nested `actions` object. Stay consistent with it.

## Actions are events, not setters

An action names something that happened and owns the logic for it. Components
say what occurred; the store decides what that means.

```ts
// WRONG - the component owns the transition, and renders 3 times
const onStart = () => {
    setStatus('success')
    setIsRunning(true)
    setStartedAt(Date.now())
}

// RIGHT - one event, one atomic transition, guards live in the store
async runAudio() {
    const { ctx, status } = get()
    if (status !== 'success') return
    if (ctx?.state === 'suspended') await ctx.resume()
    set({ isRunning: true })
}
```

Guards, ordering, and side effects (including async and Web Audio calls -
zustand actions are not reducers, side effects are allowed) belong in the
action. If a component needs to read state to decide *whether* to act, that
decision belongs in the action instead.

The boundary: a plain setter is still correct for plain state. A controlled
input's `setText` is not a Flux crime. The rule targets components that fire
several `set` calls in a row to express one thing.

## Read without subscribing

In event handlers, effects, and callbacks - anywhere outside render - read
current state with `getState()` instead of subscribing to it:

```ts
const { status } = useAudioEngineStore.getState()
```

Subscribing to a value only to read it inside a click handler makes the
component re-render for a value it never displays. Prefer moving the read into
the action entirely (see above).

## Keep the store generic

`src/store/store.ts` is the shared audio engine and must not learn about any
one tool. No worklet URLs, processor names, message types, or graph topology in
it. See the `audio-worklet` skill for the full rule - it governs what may enter
this store at all, and this skill governs how what's there is consumed.
