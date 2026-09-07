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
