# SkyboxGenerator — Current Status

**Last Updated:** 2026-03-08 — Milestone 1 Complete  
**Status:** ✅ M1 Complete (all phases) | Next: M2 — Real Star Data & Constellations

---

## Completed Steps

### Phase 1.1 — Project Scaffolding ✅

- [x] **1.1.1** Vite + React 19 + TypeScript 5.9 project initialized
- [x] **1.1.2** Dependencies installed:
  - Runtime: `gl-matrix`, `zustand`, `react-colorful`, `fflate`, `react-hot-toast`
  - Dev: `tailwindcss @tailwindcss/vite`, `prettier`, `@radix-ui/*`, `vitest`
- [x] **1.1.3** Prettier configured (`.prettierrc`, `.prettierignore`, format scripts)
- [x] **1.1.4** Tailwind CSS v4 configured (Vite plugin, CSS-first `@theme` tokens in `index.css`)
- [x] **1.1.5** GLSL import pipeline (`?raw` imports, TypeScript declarations in `vite-env.d.ts`)
- [x] **1.1.6** Folder structure created (renderer, layers, shaders, state, ui, export, utils, types)
- [x] **1.1.7** Scaffold boilerplate replaced with project skeleton
- [x] **1.1.8** TypeScript compiles with zero errors
- [x] **1.1.9** Dev server runs successfully (`pnpm dev` → http://localhost:5173/)
- [x] **1.1.10** Path alias `@/` configured in Vite + tsconfig
- [ ] **1.1.11** Tauri 2 initialization (deferred — desktop packaging not yet needed)

### Phase 1.2 — WebGL2 Render Engine ✅

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

### Phase 1.3–1.6 — Core Layers, RNG, Viewport, UI ✅

- [x] **1.3** All 4 render layers integrated (Background, PointStar, Nebula, Sun)
- [x] **1.4** `SeededRNG` (Mulberry32 PRNG), `color.ts` (hex↔RGB, sRGB↔linear), `cubemap.ts`
- [x] **1.5** Skybox preview shader, Viewport canvas, orbit camera, debounced rendering (30ms)
- [x] **1.6** Zustand store with `persist` + `subscribeWithSelector`, all UI panels:
  - AppLayout (3-panel: toolbar + sidebar + viewport)
  - Toolbar (seed, resolution, about button)
  - StarFieldPanel, NebulaPanel, SunPanel, BackgroundPanel, ExportPanel
  - Reusable: SliderControl, ToggleControl, ColorPickerControl, PanelSection

### Phase 1.7 — Export System ✅

- [x] **1.7.1** `exporter.ts` — PNG face rendering + pixel readback
- [x] **1.7.2** Individual PNGs (right, left, top, bottom, front, back) in ZIP
- [x] **1.7.3** Cross layout PNG (4×3 grid)
- [x] **1.7.4** ExportPanel with format selector, resolution, progress overlay
- [x] **1.7.5** Browser download via `<a download>` + blob URL

### Phase 1.8 — Presets ✅

- [x] **1.8.1** 5 built-in presets (Deep Space, Milky Way, Sunset Nebula, Blue Giant, Void)
- [x] **1.8.2** PresetPanel with load/save/delete UI
- [x] **1.8.3** Custom preset save/load (JSON serialization to localStorage)
- [x] **1.8.4** Import/export preset files (.json)

### Phase 1.9 — Testing & Polish ✅

- [x] **1.9.1** Unit tests: 34 tests passing (RNG determinism/distribution, color conversion roundtrips, perf monitor)
- [x] **1.9.2** Unity cubemap face mapping documented in README (6-sided + cross layout import steps)
- [x] **1.9.3** Performance monitoring: `PerfMonitor` utility + PerfOverlay HUD (press P), integrated into render loop
- [x] **1.9.4** Edge case hardening:
  - ErrorBoundary component wraps entire app
  - Session persistence via Zustand `persist` middleware (auto-save/restore to localStorage)
  - Debounced rendering (30ms) for rapid slider movement
  - Keyboard shortcuts (R=randomize, F=reset camera, 1-5=presets, P=perf overlay)
- [x] **1.9.5** README.md with setup instructions, usage guide, Unity import workflow, project structure

### UI Polish (bonus)

- [x] Glassmorphism dark theme with backdrop-filter panels (`.glass-panel`, `.glass-toolbar`, `.glass-card`, `.glass-popover`)
- [x] iOS-style controls (toggle switches, range sliders, frosted glass color picker popovers)
- [x] About modal with links (renders at App root to avoid stacking context issues)
- [x] SF Pro font stack

### Build Verification

- [x] TypeScript: zero errors
- [x] Vitest: 34 tests passing (3 test suites)
- [x] Production build: 94 modules, 275KB JS (88KB gzip), 25KB CSS (5.5KB gzip)

---

## Current File Structure

```
SkyboxGenerator/
├── docs/                          # Planning documents (7 docs)
├── src/
│   ├── export/
│   │   ├── exporter.ts            # PNG individual + cross layout export
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts # R, F, P, 1-5 shortcuts
│   │   └── index.ts
│   ├── layers/
│   │   ├── BackgroundLayer.ts     # Solid color background
│   │   ├── NebulaLayer.ts         # 4D noise nebula clouds
│   │   ├── PointStarLayer.ts      # GPU point-sprite stars
│   │   ├── RenderLayer.ts         # Layer interface
│   │   ├── SunLayer.ts            # Sun with corona + glow
│   │   └── index.ts
│   ├── presets/
│   │   └── presets.ts             # 5 built-in + custom preset system
│   ├── renderer/
│   │   ├── CubemapFBO.ts          # Cubemap framebuffer object
│   │   ├── FullscreenQuad.ts      # Fullscreen quad geometry
│   │   ├── Renderer.ts            # WebGL2 context manager
│   │   ├── SkyboxPipeline.ts      # Pipeline orchestrator
│   │   └── index.ts
│   ├── shaders/
│   │   ├── background.frag.glsl
│   │   ├── fullscreen.vert.glsl
│   │   ├── nebula.frag.glsl
│   │   ├── point-stars.frag.glsl
│   │   ├── point-stars.vert.glsl
│   │   ├── skybox-preview.frag.glsl
│   │   └── sun.frag.glsl
│   ├── state/
│   │   ├── appStore.ts            # Zustand store (persist + subscribeWithSelector)
│   │   └── index.ts
│   ├── types/
│   │   ├── common.ts              # Shared types
│   │   └── index.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── AboutModal.tsx     # Glassmorphism about popup
│   │   │   ├── ColorPickerControl.tsx
│   │   │   ├── ErrorBoundary.tsx  # React error boundary
│   │   │   ├── PanelSection.tsx   # Collapsible glass card
│   │   │   ├── PerfOverlay.tsx    # FPS/timing HUD
│   │   │   ├── SliderControl.tsx  # Smart auto-formatting slider
│   │   │   ├── ToggleControl.tsx  # iOS UISwitch toggle
│   │   │   ├── Toolbar.tsx        # Header bar
│   │   │   ├── Viewport.tsx       # WebGL canvas + orbit controls
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   └── AppLayout.tsx      # 3-panel layout
│   │   └── panels/
│   │       ├── BackgroundPanel.tsx
│   │       ├── ExportPanel.tsx
│   │       ├── NebulaPanel.tsx
│   │       ├── PresetPanel.tsx
│   │       ├── StarFieldPanel.tsx
│   │       ├── SunPanel.tsx
│   │       └── index.ts
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── color.test.ts      # 20 color conversion tests
│   │   │   ├── perfMonitor.test.ts # 6 perf monitor tests
│   │   │   └── rng.test.ts        # 8 RNG determinism tests
│   │   ├── color.ts               # Color conversions
│   │   ├── cubemap.ts             # Cubemap math
│   │   ├── perfMonitor.ts         # Render timing utility
│   │   ├── rng.ts                 # Seeded PRNG (Mulberry32)
│   │   └── index.ts
│   ├── App.tsx                    # Root component with pipeline integration
│   ├── index.css                  # Tailwind + glassmorphism theme
│   ├── main.tsx                   # React entry point
│   └── vite-env.d.ts             # GLSL type declarations
├── README.md                      # Full project documentation
├── package.json
├── vite.config.ts                 # Vite + Vitest config
└── tsconfig.json
```

---

## GLSL Shaders

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

**Milestone 2 — Real Star Data & Constellations**

- Phase 2.1: HYG star catalog data pipeline (CSV parsing, RA/Dec→Cartesian, B-V→RGB)
- Phase 2.2: Catalog star rendering layer (real star positions, magnitude-based sizing)
- Phase 2.3: Constellation overlay (stick figures, labels, IAU boundaries)
