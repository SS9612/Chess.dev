# Chess

A browser chess game built with React, TypeScript and Vite, with a chess rules engine written from scratch.

## Development

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - type-check and build for production
- `npm run preview` - serve the production build
- `npm run lint` - run oxlint

## Architecture

The rules engine in `src/engine/` is pure TypeScript with no React imports. Both the UI and the
AI opponent depend on it, never the reverse, which keeps it testable in isolation and lets it run
inside a Web Worker unchanged.

The board uses a 0x88 representation: a 128-entry array where the square index is `rank * 16 + file`,
so off-board detection is the single test `(square & 0x88) === 0`.
