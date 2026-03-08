# SkyboxGenerator — Current Status

**Last Updated:** Phase 1.2 — WebGL2 Render Engine  
**Status:** ✅ Phase 1.1 + 1.2 Complete (except Tauri init)

---

## Completed Steps

### Phase 1.1 — Project Scaffolding

- [x] **1.1.1** Vite + React 19 + TypeScript 5.9 project initialized
- [x] **1.1.2** Dependencies installed:
  - Runtime: `gl-matrix`, `zustand`, `react-colorful`, `fflate`, `react-hot-toast`
  - Dev: `tailwindcss @tailwindcss/vite`, `prettier`, `@radix-ui/*` (tabs, dialog, slider, switch, select, tooltip), `vitest`
- [x] **1.1.3** Prettier configured (`.prettierrc`, `.prettierignore`, format scripts)
- [x] **1.1.4** Tailwind CSS v4 configured (Vite plugin, CSS-first `@theme` tokens in `index.css`)
- [x] **1.1.5** GLSL import pipeline (`?raw` imports, TypeScript declarations in `vite-env.d.ts`)
- [x] **1.1.6** Folder structure created (renderer, layers, shaders, state, ui, export, utils, types)
- [x] **1.1.7** Scaffold boilerplate replaced with project skeleton
- [x] **1.1.8** TypeScript compiles with zero errors
- [x] **1.1.9** Dev server runs successfully (`pnpm dev` → http://localhost:5173/)
- [x] **1.1.10** Path alias `@/` configured in Vite + tsconfig
- [ ] **1.1.11** Tauri 2 initialization (deferred — requires `cargo tauri init`)

### Phase 1.2 — WebGL2 Render Engine

- [x] **1.2.1** `Renderer` class — WebGL2 context manager with shader compilation, program linking
- [x] **1.2.2** `CubemapFBO` — Cubemap framebuffer, per-face binding, pixel readback
- [x] **1.2.3** `FullscreenQuad` — VAO-based fullscreen triangle strip
- [x] **1.2.4** `RenderLayer` interface — `init()`, `render()`, `updateParams()`, `dispose()`
- [x] **1.2.5** `BackgroundLayer` — Solid color background (order 0)
- [x] **1.2.6** `PointStarLayer` — 100K seeded stars as GL_POINTS with spectral colors (order 10)
- [x] **1.2.7** `NebulaLayer` — 4D Perlin noise FBM, 3-color gradient, configurable octaves (order 20)
- [x] **1.2.8** `SunLayer` — Disk + corona + atmospheric glow with limb darkening (order 30)
- [x] **1.2.9** `SkyboxPipeline` — Orchestrates all layers, renders 6 cubemap faces, provides preview
- [x] **1.2.10** Orbit camera — Mouse drag for yaw/pitch, scroll for FOV zoom
- [x] **1.2.11** Zustand state store — All layer parameters with real-time sync to GPU
- [x] **1.2.12** Export functionality — Individual PNGs (ZIP) + Cross layout PNG with progress

### Phase 1.3 — UI Controls

- [x] **1.3.1** `AppLayout` — Three-panel layout (toolbar + sidebar + viewport)
- [x] **1.3.2** `Toolbar` — Seed control, resolution selector, export button
- [x] **1.3.3** `StarFieldPanel` — Count, brightness, size, color variation sliders
- [x] **1.3.4** `NebulaPanel` — 3 color pickers, density, falloff, scale, octaves, FBM params
- [x] **1.3.5** `SunPanel` — Color, size, corona, glow, limb darkening, XYZ position
- [x] **1.3.6** `ExportPanel` — Format selector, resolution, export button with progress

### Build Verification

- [x] TypeScript: zero errors
- [x] Production build: succeeds (245KB JS gzipped 78KB, 14KB CSS gzipped 3.5KB)

---

## Current File Structure

```
SkyboxGenerator/
├── docs/                          # Planning documents
├── public/
│   ├── data/                      # Star catalogs, constellation data (future)
│   └── textures/                  # Milky Way textures (future)
├── src/
│   ├── export/
│   │   ├── exporter.ts            # PNG individual + cross layout export
│   │   └── index.ts
│   ├── layers/
│   │   ├── BackgroundLayer.ts     # Solid color background
│   │   ├── NebulaLayer.ts         # 4D noise nebula clouds
│   │   ├── PointStarLayer.ts      # GPU point-sprite stars
│   │   ├── RenderLayer.ts         # Layer interface
│   │   ├── SunLayer.ts            # Sun with corona + glow
│   │   └── index.ts
│   ├── renderer/
│   │   ├── CubemapFBO.ts          # Cubemap framebuffer object
│   │   ├── FullscreenQuad.ts      # Fullscreen quad geometry
│   │   ├── Renderer.ts            # WebGL2 context manager
│   │   ├── SkyboxPipeline.ts      # Pipeline orchestrator
│   │   └── index.ts
│   ├── shaders/
│   │   ├── includes/              # Shared GLSL snippets (future)
│   │   ├── background.frag.glsl
│   │   ├── fullscreen.vert.glsl
│   │   ├── nebula.frag.glsl
│   │   ├── point-stars.frag.glsl
│   │   ├── point-stars.vert.glsl
│   │   ├── skybox-preview.frag.glsl
│   │   └── sun.frag.glsl
│   ├── state/
│   │   ├── appStore.ts            # Zustand store
│   │   └── index.ts
│   ├── types/
│   │   ├── common.ts              # Shared types
│   │   └── index.ts
│   ├── ui/
│   │   ├── components/            # Toolbar, Viewport, PanelSection, controls
│   │   ├── layout/                # AppLayout
│   │   └── panels/                # StarField, Nebula, Sun, Export panels
│   ├── utils/
│   │   ├── color.ts               # Color conversions
│   │   ├── cubemap.ts             # Cubemap math
│   │   ├── rng.ts                 # Seeded PRNG
│   │   └── index.ts
│   ├── App.tsx                    # Root component with pipeline integration
│   ├── index.css                  # Tailwind + dark theme tokens
│   ├── main.tsx                   # React entry point
│   └── vite-env.d.ts             # GLSL type declarations
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## GLSL Shaders Implemented

| Shader                     | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `fullscreen.vert.glsl`     | Clip-space quad → ray direction via inverse VP matrix   |
| `background.frag.glsl`     | Solid color fill                                        |
| `point-stars.vert.glsl`    | Per-vertex position/size/color from VBO, GL_POINTS      |
| `point-stars.frag.glsl`    | Soft circular point sprites with brightness falloff     |
| `nebula.frag.glsl`         | 4D simplex noise FBM, 3-color gradient, density/falloff |
| `sun.frag.glsl`            | Angular disk + smoothstep corona + power-law glow       |
| `skybox-preview.frag.glsl` | Cubemap texture sampling for viewport preview           |

---

## Next Step

**Phase 2 — Refinement & Polish**

- Test in browser and debug visual issues
- Add preset system (save/load parameter sets)
- Implement Milky Way layer (texture-based or procedural)
- Add constellation overlay layer
- Initialize Tauri 2 for desktop packaging
