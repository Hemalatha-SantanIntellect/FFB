# FusionBoard

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MapLibre](https://img.shields.io/badge/MapLibre-GL-4264fb?logo=maplibre&logoColor=white)](https://maplibre.org/)

GIS-style operations dashboard: fleet KPIs, MapLibre map, asset health, threat feed, and security posture. Uses mock data in `src/data/mockData.ts`.

## Prerequisites

- [Node.js](https://nodejs.org/) **20** or newer (LTS recommended)
- npm (ships with Node)

## Run locally

```bash
cd FusionBoard
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Other commands

- `npm run build` — typecheck and production build to `dist/`
- `npm run preview` — serve the built app
- `npm run lint` — ESLint
- `npm run dev:force` — dev server with `vite --force` (clears optimize cache)

No API keys or `.env` are required; basemap tiles load from public CDN URLs.
