---
name: audio-worklet
description: Web Audio and AudioWorklet rules for this project - one AudioContext and one shared AudioWorkletNode reused by every tool, suspend/resume instead of close, how a tool takes over and reconfigures the shared node, port messaging, worklet processors in public/worklets. Use before writing or debugging any AudioContext, AudioWorkletNode, src/store/store.ts, or worklet processor code.
---

# AudioWorklet

## One context, one worklet node, shared by every tool

The tab has exactly **one** `AudioContext` and exactly **one**
`AudioWorkletNode`. Both are created once, the first time any tool needs
audio, and live until the page is reloaded. Every tool - beat machine,
metronome, tuner, and whatever comes next - **reuses that same node**.

- `new AudioContext()` appears only in `src/store/store.ts`.
- `new AudioWorkletNode()` appears only in `src/store/store.ts`, and runs once.
- No tool builds a node of its own - not a second one "for this tool", not one
  for a different processor. A tool that needs new DSP adds a mode to the shared
  processor (see [One processor, many tools](#one-processor-many-tools)).

The store owns the context and the node (`ctx`, `workletNode`, `status`,
`isRunning`). Tools get the node from the store and talk to it over its port.
Switching tools costs a few messages, not a graph rebuild.

## Suspend and resume - never close, never rebuild

`close()` is terminal. A closed context cannot be reopened, and the worklet node
dies with it. So the node's whole life is a cycle between two states:

- Nothing playing (stopped, idle, leaving a page): `await ctx.suspend()`
- A tool starts playing: `await ctx.resume()`

Never:

- call `ctx.close()`
- disconnect the node from `ctx.destination`, or set `workletNode` to `null`
- reset `status` to `'idle'` on unmount - the next mount would run init again
  and build a second context and node. `status` stays `'success'` for the life
  of the tab.

**Suspend is tab-wide.** There is one context, so the store refuses to suspend
while `isRunning` is true. Stop first, then suspend.

**Autoplay policy.** A context created outside a user gesture starts
`suspended`, and `resume()` only succeeds from a gesture (click, keydown)
handler. Creating the context on mount is fine; `resume()` belongs in the
Start click path (`runAudio`).

A full browser reload destroys everything. That is the only time init runs a
second time.

## Initialisation runs once per tab

`initAudio` is safe to call on every mount. It constructs only what is missing
and short-circuits once `status === 'success'`:

```ts
ctx ??= new AudioContext()               // store it now, before any await
if (!moduleLoaded) await ctx.audioWorklet.addModule(url)
workletNode ??= new AudioWorkletNode(ctx, processorName)
workletNode.connect(ctx.destination)     // once, right after construction
```

- **Save `ctx` into the store as soon as it exists**, before `await addModule()`.
  If it is only saved on success, a failed `addModule` leaves the context
  orphaned and the retry creates a second one.
- **Concurrent callers share one in-flight init.** Keep the pending promise and
  return it. Returning early on `status === 'pending'` lets the second caller
  carry on with `workletNode === null`.
- `addModule()` registers per context, and the context is never replaced, so
  the module is loaded once per tab.
- The module URL and processor name come from `WORKLET_MODULE_URLS` in
  `src/consts/worklets.ts`. There is one shared processor, so every tool
  initialises with the same entry.

## A tool takes over the node on mount

The node belongs to whichever tool is on screen, but its processor still holds
the **previous** tool's state - grid, length, steps per beat, bpm, mode. The
metronome's four-beat grid is still in there when the beat machine mounts.

**Entering a tool:**

1. `initAudio()` - a no-op after the first time.
2. Add the tool's listener: `port.addEventListener('message', onMessage)`, then
   `port.start()`.
3. Send the tool's **full** config - mode, grid, length, steps per beat, bpm -
   every time. Never assume the processor still has this tool's state. "Re-send
   only what changed" is wrong for a shared node.

**While mounted:** incremental messages (`UPDATE_GRID`, `SET_BPM`), `START`
after `runAudio()` has resumed the context, `STOP` on stop.

**Leaving a tool:**

1. Post `STOP`.
2. `stopAudio()`, then `suspendAudio()`.
3. Remove the tool's listener.
4. Input tools only: disconnect the source and stop the `MediaStream` tracks
   (see [Input tools](#input-tools)).

Leave the context, the node, its destination connection, and `status` exactly
as they are.

## Port messaging

- **`addEventListener` / `removeEventListener`, never `port.onmessage =`.** The
  port serves the store and each tool in turn. `onmessage` is one slot: a
  tool's handler stays live after it unmounts, until the next tool overwrites
  it, and clearing it clears someone else's.
- `addEventListener` does not start the port - call `port.start()`. Messages
  posted before it are queued, not lost.
- Messages posted before the processor exists are queued too. Config sent right
  after construction lands before any later `START`, so no handshake is needed.
- **Don't drive config from `READY`.** The processor constructor runs once per
  tab, so only the first tool ever receives it. Send config on mount instead.

## Engine messages belong to the store

`{ type: 'AUTO_SUSPEND' }` - the processor saying it has been idle - is handled
by the **store**, not by tools. The store adds its listener once, when it
creates the node, so it works whichever tool is mounted, and while none is. It
suspends only when `isRunning` is false.

On the processor side:

- Post `AUTO_SUSPEND` **once** per idle period, not on every render quantum.
- Reset the idle clock on `START`. `currentTime` stops advancing while the
  context is suspended, so a stale `lastActiveTime` makes the first quanta
  after `resume()` look idle and re-suspends the tab before `START` arrives.

## One processor, many tools

The shared processor (currently `public/worklets/beatProcessor.js`) serves every
tool. The beat machine and the metronome are both step sequencers - the
metronome is a grid with `stepsPerBeat: 1` and `accent`/`beep` rows - so they
speak the same messages.

A tool that needs different DSP adds a **mode** to this processor, selected by
a message. It does not get a second processor file or a second node. The
tuner's pitch analysis (`pitchProcessor.js`) moves into the shared processor as
a mode.

Every config or mode-switch message must fully overwrite what the previous tool
left behind: grid, length, steps per beat, step position, sample counter, active
voices.

### Input tools

The tuner feeds the microphone **into** the shared node:

```ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: { ... } })
const source = ctx.createMediaStreamSource(stream)
source.connect(workletNode)
```

- The node stays connected to `ctx.destination`, so in an input mode the
  processor must write **silence** to its outputs. Copying input to output
  plays the mic through the speakers and feeds back.
- On leave: `source.disconnect()` and `stream.getTracks().forEach((t) => t.stop())`.
  Stopping the tracks is required or the browser keeps showing the mic
  indicator. This is the one teardown allowed - the node itself stays.

## What the store owns

The store owns the engine: `ctx`, `workletNode`, `status`, `isRunning`, the
init/resume/suspend actions, and the `AUTO_SUSPEND` listener.

It does **not** own anything tool-specific:

- tool payload types - `INIT_GRID`, `SET_BPM`, `UPDATE_GRID`, grid shapes
- `port.postMessage` of tool messages - the hook that speaks the protocol posts
- tool listeners, tool config, or a tool's `MediaStream` and source node

If a change to `store.ts` only makes sense for one tool, it belongs in that
tool's hook.

## Worklet processor files

Files in `public/worklets/` are served raw, not bundled: plain JS only, no
TypeScript, no `import`, no `@/` aliases.

`process()` runs on the audio thread once per 128-sample quantum - roughly 375
times a second at 48kHz. Never `console.log` in it, never allocate per sample,
hoist anything constant out of the sample loop, and always `return true`.

**Validate every payload.** An exception in the processor fires
`processorerror` and kills the node for good. Every tool shares that node, so
one `UPDATE_GRID` for an unknown instrument breaks audio for the whole tab until
reload. The store listens for `processorerror` and sets `status: 'failure'`;
the fix is the processor bug, not a rebuilt node.
