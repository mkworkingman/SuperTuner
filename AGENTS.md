<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

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
