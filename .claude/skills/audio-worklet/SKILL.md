---
name: audio-worklet
description: Web Audio and AudioWorklet rules for this project - AudioContext lifecycle, the shared audio engine store, reuse across navigation, worklet processors in public/worklets, port messaging. Use before writing or debugging any AudioContext, AudioWorkletNode, src/store/store.ts, or worklet processor code.
---

# AudioWorklet

## Never close the audio graph

The `AudioContext` and its `AudioWorkletNode` must **NOT** be closed under any
circumstances. There is no reopening a closed context: `close()` is terminal,
and every node created on it dies with it.

Suspend and resume instead:

- Idle / teardown / navigating away: `await ctx.suspend()`
- Becoming active again: `await ctx.resume()`

Never call `ctx.close()`, and never drop the node reference and rebuild it.

The one exception is a `MediaStream` from `getUserMedia`: its tracks **must** be
stopped on teardown, or the browser keeps showing the mic indicator. Stop the
tracks; leave the context and the node alone.

## One context, one node per tool

There is exactly **one** `AudioContext` per browser tab, owned by
`src/store/store.ts`. Each tool - beat machine, metronome, tuner - gets **at
most one** `AudioWorkletNode`, keyed by a stable source id. Navigating between
pages must never produce a second context, or a second node for the same id.

Client-side navigation does not reload the page, so the store survives it. That
makes reuse the default - but only if the code checks before constructing.

**Leaving a page:** stop your source, then ask for a suspend. Do not tear down.
Keep the context, the nodes, and the loaded-module set exactly as they are.

**Entering a page:** reuse whatever is already there.

```js
// Construct only what is genuinely missing.
if (!ctx) ctx = new AudioContext()
if (!loadedModules.has(url)) await ctx.audioWorklet.addModule(url)
if (!nodes[id]) nodes[id] = new AudioWorkletNode(ctx, processorName)

await ctx.resume()   // the only step that runs every time
```

`ensureNode(spec)` already performs all three checks, so call it on every mount
and let it short-circuit. Re-running `addModule()` or re-constructing a node
means the teardown path destroyed state it should have kept.

Consequences to respect:

- **Do not reset a node status on unmount.** If teardown sets status back to
  `idle`, the next mount re-runs the whole init and builds a second graph. The
  status must stay `success` so re-entry is just a resume.
- **`addModule()` registers per `AudioContext`, not globally.** Since the
  context is never replaced, the module stays registered for the tab lifetime.
  Track it so it is loaded once, keyed by URL.
- The processor keeps its state (grid, bpm, step position) across navigation.
  Re-send config only when it actually changed, not on every mount.
- **Suspend is device-wide.** Two tools share one context, so the store refuses
  to suspend while any source is still running. Always `stopSource(id)` before
  `suspendDevice()`.
- A full browser reload does destroy everything. That is expected - rebuild from
  scratch there.

## The store is generic - never couple it to one tool

**Rule: `src/store/store.ts` must work for every hook and tool - the beat
machine, the metronome, the tuner, and whatever comes next. It must NOT be
coupled to any single hook such as `useBeatMachine_2`.**

The store owns exactly two things:

1. **The device** - the `AudioContext`, the set of `running` source ids, the
   `target` state, and the serialised resume/suspend reconcile loop.
2. **Node lifetime** - loading each module once per URL, constructing one node
   per source id, and tracking that node status and error.

Everything else belongs to the tool that owns it.

**Never put in the store:**

- A specific worklet URL or processor name. They arrive through `NodeSpec`.
- A tool payload type. `INIT_GRID`, `SET_BPM`, `UPDATE_GRID`, grid shapes,
  steps-per-beat - the tuner speaks none of these.
- Any `port.postMessage` of a tool message. The store exposes the node; the
  hook that speaks the protocol posts to it.
- A hardcoded graph connection. `node.connect(ctx.destination)` is right for the
  beat machine and wrong for the tuner, which feeds a mic *into* its node and
  leaves the output dangling. Topology comes from `NodeSpec.connect`.
- Anything singular. A single `workletNode` / `isRunning` / `status` / `error`
  was the old bug: the metronome silently reused the beat machine node, and the
  tuner could never initialise at all because a global `status === 'success'`
  short-circuited it. Keep all of it keyed by source id.

**The one wire convention the store does own:** any processor may post
`{ type: 'AUTO_SUSPEND' }` to say it has gone idle. The store treats that as a
request to park the device, granted only when no source is running.

**Ordering guarantee:** `NodeSpec.onCreate` runs once, right after construction
and before the node joins the graph. Post config there - the port queues
messages until the processor exists, so config lands ahead of any later `START`
with no `READY` handshake needed. A handshake would be worse: it makes config
wait on a round trip that the first click can beat.

**Adding a tool** means writing a `NodeSpec` plus a hook, and editing nothing in
the store:

```ts
const TUNER_NODE: NodeSpec = {
    id: 'tuner',
    moduleUrl: '/worklets/pitchProcessor.js',
    processorName: 'pitch-processor',
    // Input tool: the mic feeds the node, and the output stays dangling.
    connect: async (node, ctx) => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        ctx.createMediaStreamSource(stream).connect(node)
    },
}
```

If a change to `store.ts` only makes sense for one tool, it belongs in that
tool hook instead.

## Worklet processor files

Files in `public/worklets/` are served raw, not bundled: plain JS only, no
TypeScript, no `import`, no `@/` aliases.

`process()` runs on the audio thread once per 128-sample quantum - roughly 375
times a second at 48kHz. Never `console.log` in it, never allocate per sample,
and hoist anything constant out of the sample loop.
