# Ideas / planned tools

Not implemented yet. Notes for future work — nothing here is decided.

## 1. Singing practice (sing the note, mic checks you)

A new tool where the app shows notes to sing and grades how well you hit them
with the microphone.

**Flow**

1. App shows a target note (name + pitch), optionally plays a reference tone.
2. User sings into the mic.
3. App listens, compares the detected pitch to the target, and says how close it
   is — in tune / sharp / flat, and by how many cents.
4. Next note. At the end, a short score/summary.

**Modes worth having**

- Single note — one target at a time, random or from a chosen key/range.
- Interval — play a root, ask the user to sing a 3rd/5th/octave above it.
- Melody — a short sequence of notes to sing in order, in time.
- Range finder — walk up and down until the user can't reach, record their range.

**What counts as "good"**

- Cents off the target: same buckets as the tuner (≤5 green, ≤15 yellow, else
  red) are a reasonable start.
- Must be held — a passing brush through the right pitch shouldn't count. Needs
  the pitch to stay in tolerance for N consecutive frames / ~300–500 ms.
- Octave-agnostic option: singing the right pitch class in a comfortable octave
  should be allowed, especially for low/high voices.
- Ignore frames with no clear pitch (silence, breath, consonants) instead of
  scoring them as a miss.

**Reuse**

- Pitch detection already exists: `pitch-processor` worklet +
  `detect_pitch` from `src/wasm/wasm_study`, as used in `src/hooks/useTuner.ts`.
- Note naming / cents math / A4 + note-system handling is also in `useTuner.ts`
  and `src/consts/tuner.ts` — worth pulling the shared parts out rather than
  copy-pasting into a new hook.
- A reference tone needs an oscillator, which the shared engine doesn't do yet.

**Open questions**

- Voice is noisier than an instrument — does the current detector hold up on
  vowels, vibrato, and breathy notes, or does it need smoothing/median
  filtering on top?
- How to handle vibrato: average over the window instead of instant cents?
- Scoring: percentage, streaks, stars? Keep history across sessions?
- Needs mic permission handling (see the "ask again if no mic access" TODO).

**UI sketch**

- Big target note, a moving indicator for the sung pitch (reuse the tuner's
  needle/bar idea), green when held in tolerance.
- A hold-progress ring that fills while the note is locked, then advances.
- Result screen: per-note cents error, worst/best notes.

---

## 2. Polyrhythm with visual animation

A tool for practising polyrhythms (3:2, 4:3, 5:4, 7:4, …) with a visual that
makes the relationship obvious, not just a click track.

**Core**

- Two (later: N) independent pulse layers, each with its own subdivision count,
  sound, and accent.
- One shared tempo — the cycle length is the same for every layer, they just
  divide it differently.
- Presets for the common ratios plus a free mode where each layer's count is
  set by hand.
- Per-layer mute/solo and volume, so you can practise one hand at a time.

**Visual ideas** (pick one, or make it switchable)

- Two concentric rings, one dot per layer travelling around; dots flash on hit
  and line up visibly at the downbeat.
- Two rotating circles with pegs — the moment of coincidence is the shared
  downbeat.
- Linear grid/piano-roll style: two rows of cells sharing one cycle width,
  playhead sweeps across. Closest to the existing beat machine.
- Highlight coincident hits differently — that's the part people need to feel.

**Timing**

- Animation must be driven by audio time, not by counting `requestAnimationFrame`
  frames — the drift is the whole problem this tool exists to show.
- Scheduling belongs in the worklet (`beat-processor` already does this kind of
  thing); the UI reads back positions and renders.
- Needs a cheap way to get "where are we in the cycle" each frame without
  flooding the message port — a shared position value or a low-rate tick the UI
  interpolates between.

**Extras, later**

- Tap/ramp tempo, gradual tempo increase for practice.
- Subdivision sounds per layer (reuse `public/sounds/*`).
- Ratio explanation: show the least common multiple grid, "3 against 2 = 6 slots".
- Silent/visual-only mode for practising against your own playing.

**Reuse**

- `beat-processor` worklet + `useBeatMachine` scheduling patterns.
- The shared `AudioContext` / worklet node in `src/store/store.ts` — this tool
  reconfigures it like the others, it does not create its own.
- `BeatMachineGrid.tsx` if the linear visual wins.

---

Both tools would need an entry in `src/consts/route_config.ts`, a page under
`src/app/(tools)/`, an icon in `public/images/`, and their own hook.
