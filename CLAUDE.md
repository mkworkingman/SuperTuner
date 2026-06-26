@AGENTS.md

# super-tuner

A Next.js 16 (App Router) audio toolkit: a **tuner** (mic pitch detection via WASM),
a **metronome**, and a **beat machine**. Stack: React 19 + React Compiler
(`babel-plugin-react-compiler`), Tailwind 4, Sass, GSAP.

- Routes live under `src/app/(tools)/` (route group). Path alias: `@/*` → `src/*`.
- TS is strict (`strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitReturns`,
  `noFallthroughCasesInSwitch`). Respect non-null narrowing; don't paper over with `!`.
- Verify before claiming done: `npm run ts` (typecheck), `npm run lint`, `npm run lint:scss`.

## Audio architecture — these rules are non-negotiable

**ONE shared `AudioContext` singleton for the whole app.** Never `new AudioContext()` per
component or per hook. Resume it on a user gesture; assume autoplay is blocked until then.

- The singleton helper already exists in `src/lib/audioContext.ts` (`ensureWorklet`,
  `resumeAudio`, `suspendAudio`). ⚠️ **Current debt:** `useTuner`, `useMetronome`, and
  `useBeatMachine` each `new AudioContext()` in a ref and call `audioWorklet.addModule`
  directly — they do NOT use the singleton. New audio code MUST go through
  `ensureWorklet(url)`; when you touch one of these hooks, migrate it onto the singleton
  rather than copying the per-hook pattern.
- `ensureWorklet` deduplicates `addModule` calls (`loadedModules` set) and resumes a
  suspended context. Don't add a second module loader or a second context.

**Timing-critical scheduling runs in an AudioWorklet processor, NOT the main thread.**
No `setTimeout`/`setInterval`/`requestAnimationFrame` for the metronome/beat clock.

- Worklet processors live in `public/worklets/` (`beatProcessor.js`, `pitchProcessor.js`)
  and are served as static URLs (`/worklets/beatProcessor.js`). They run in the
  `AudioWorkletGlobalScope` — plain JS, no bundler, no imports, no TS. Use `sampleRate`
  and `currentTime` globals; the worklet owns the clock.
- `beat-processor` drives both the metronome and the beat machine (same processor, two
  hooks). Main thread sends config (grid, BPM, steps); the worklet counts samples and
  emits ticks. Keep it that way — don't move scheduling back to React.

**Define the worklet message protocol explicitly.** Messages are typed; document the
shape in a shared type under `src/types/`. No ad-hoc `postMessage({stuff})`.

- ⚠️ **Current debt:** messages are currently untyped object literals on both sides and
  the protocol is only implied by `switch (type)` in `beatProcessor.js`. When you add or
  change a message, introduce/extend a shared discriminated-union type and use it on both
  the hook and (via JSDoc) the worklet. Show the type change alongside the logic change.
- `beat-processor` protocol today —
  main→worklet: `INIT_GRID {grid, gridLength, stepsPerBeat}`, `UPDATE_GRID {instrument, step, value}`,
  `SET_BPM <bpm>`, `UPDATE_SPB <stepsPerBeat>`, `START`, `STOP`.
  worklet→main: `TICK {step}`.
- `pitch-processor` posts raw `Float32Array` chunks (transferred) to the main thread;
  `useTuner` runs `detect_pitch` (WASM, `@/wasm/wasm_study`) on them. Keep the WASM init
  memoized/module-level — it must load once, not per hook instance.

**Audio engine logic lives behind a hook** (`useTuner`, `useMetronome`, `useBeatMachine`
in `src/hooks/`). Components consume the hook's returned state/actions — they never touch
`AudioContext`, `AudioWorkletNode`, ports, or `getUserMedia` directly.

- Each hook is responsible for cleanup: disconnect nodes, stop `MediaStream` tracks, and
  `STOP` the worklet on unmount/deactivate. Handle tab-visibility (suspend in background,
  resume/restart on return) — see the existing `visibilitychange` effects.

## Working style

- Don't guess at ambiguous requirements. Ask clarifying questions before writing code.
- State any assumption you do make explicitly, up front, so I can correct it before you build on it.

## Working conventions

- Prefer small, reviewable diffs. Show type changes alongside logic changes.
- **Flag any `AudioContext` instantiation outside the singleton** in review/output.
- Never read or write `ref.current` during render — only in effects or event handlers.
- Match existing patterns. Don't introduce a new state lib, data-fetching pattern, or
  folder convention without calling it out first.
