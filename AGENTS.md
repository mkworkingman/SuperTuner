<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

This version has breaking changes, so heed deprecation notices in those docs.
`typedRoutes: true` is on: every `href` must be a typed `Route`.

# Super Tuner

Browser music tools — tuner, metronome, beat machine, note/interval/chord
ear training — built on Next.js 16, React 19, Zustand 5 and Web Audio.
Deployed to Vercel.

## Scope: work only on the beat machine rewrite

The app is being rewritten onto the shared audio engine. Only these files are
current — work in them, and copy patterns only from them:

- `src/hooks/useBeatMachine_2.ts` — the reference tool hook
- `src/app/(tools)/beat2/` — its page (not linked in the nav yet)
- `src/store/store.ts` — the shared audio engine
- `public/worklets/beatProcessor.js`, `src/consts/worklets.ts`, `src/types/`

Everything else tool-related is outdated: `useBeatMachine`, `useMetronome`,
`useMetronome_2`, `useTuner`, `src/lib/audioContext*.ts`, `src/wasm/`,
`BeatMachineGrid`, and the `beat`, `metronome`, `tuner` and `guess` routes.
Don't copy their patterns, don't extend them, and don't edit or delete them
unless asked. A `_2` suffix alone doesn't mean current — `useMetronome_2` is
outdated.

The outdated hooks still load `beatProcessor.js`, so changing its port
messages breaks the old `beat` and `metronome` routes too.

## Layout

- `src/app/(tools)/<tool>/page.tsx` — one route per tool; nav entries live in
  `src/consts/route_config.ts`
- `src/hooks/` — one hook per tool, owning that tool's audio graph
- `src/components/ui/`, `src/components/layout/` — shared UI
- `public/worklets/` — AudioWorklet processors; `public/sounds/` — samples

## Checks

There are no tests. Before finishing, run `npm run ts` and `npm run lint`,
plus `npm run lint:scss` if you touched SCSS. Formatting follows `.prettierrc`.

## React

`node_modules/react` ships no docs, so for React itself use Context7: call
`mcp__context7__query-docs` with libraryId `/react/react/v19.2.7`.

Do this before touching React 19 surface — `use`, Suspense, transitions,
`useOptimistic`, `useActionState`, ref-as-prop — and anything the React
Compiler affects: this project sets `reactCompiler: true`, so check before
hand-writing `useMemo`/`useCallback`.

Skip it for stable basics (`useState`, props, JSX) and for trivial edits.

## Web Audio

Before touching any `AudioContext`, `AudioWorkletNode`, or `public/worklets/*`
code, invoke the `audio-worklet` skill. The lifecycle and threading rules are
non-obvious — don't work from memory.

Files in `public/worklets/` are served raw, not bundled: plain JS only, no
TypeScript, no `import`, no `@/` aliases.

`src/store/store.ts` is the shared audio engine: one AudioContext plus one
worklet node per tool, keyed by source id. **It must stay generic and must NOT
be coupled to a single hook** like `useBeatMachine_2` - no worklet URLs,
processor names, tool message types, or graph topology in it. Adding a tool
means writing a `NodeSpec` and a hook, not editing the store. The skill has
the full rule.

## Zustand

Before writing or changing anything in `src/store/`, any hook that reads a
store, or any component that subscribes to state, invoke the `zustand` skill.
Selector rules changed in v5 and the `actions` object has invariants that are
easy to break silently.
