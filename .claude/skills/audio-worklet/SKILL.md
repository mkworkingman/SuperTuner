---
name: audio-worklet
description: Web Audio and AudioWorklet rules for this project - AudioContext lifecycle, reuse across navigation, worklet processors in public/worklets, port messaging. Use before writing or debugging any AudioContext, AudioWorkletNode, or worklet processor code.
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

## One instance, reused across navigation

There is exactly **one** `AudioContext` and one `AudioWorkletNode` per browser
tab, owned by the store. Navigating between pages must never produce a second
one.

Client-side navigation does not reload the page, so the store survives it. That
makes reuse the default - but only if the code checks before constructing.

**Leaving a page:** suspend. Do not tear down. Keep `ctx`, the node, and the
loaded-module set in the store exactly as they are.

**Entering a page:** reuse whatever is already there.

```js
// Construct only what is genuinely missing.
if (!ctx) ctx = new AudioContext()
if (!loadedModules.has(url)) await ctx.audioWorklet.addModule(url)
if (!workletNode) workletNode = new AudioWorkletNode(ctx, name)

await ctx.resume()   // the only step that runs every time
```

On re-entry all three checks should short-circuit and the only work is
`resume()`. Re-running `addModule()` or re-constructing the node means the
teardown path destroyed state it should have kept.

Consequences to respect:

- **Do not reset init status on unmount.** If teardown sets status back to
  `idle`, the next mount re-runs the whole init and builds a second graph. The
  status must stay `success` so re-entry is just a resume.
- **`addModule()` registers per `AudioContext`, not globally.** Since the
  context is never replaced, the module stays registered for the tab's lifetime.
  Track it so it is loaded once.
- The processor keeps its state (grid, bpm, step position) across navigation.
  Re-send config only when it actually changed, not on every mount.
- A full browser reload does destroy everything. That is expected - rebuild from
  scratch there.
