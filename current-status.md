# SkyboxGenerator — Current Status

**Last Updated:** 2026-03-08 — M2 Phase 2.1 + 2.2 + 2.3 Complete + Labels & Per-Constellation UI  
**Status:** 🔄 M2 In Progress | Phase 2.1 ✅ + Phase 2.2 ✅ + Phase 2.3 ✅ | Next: Constellation boundaries

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
- [x] Vitest: 59 tests passing (5 test suites)
- [x] Production build: 100 modules, 284KB JS (90KB gzip), 27KB CSS (5.6KB gzip)

---

### Phase 2.1 — HYG Data Pipeline ✅

- [x] **2.1.1** Downloaded HYG v4.2 catalog from Codeberg (119,626 stars, 34MB CSV)
- [x] **2.1.2** `scripts/preprocess-hyg.mjs` — CSV preprocessor produces compact binary + named stars JSON
  - Binary format: 8-byte header + 20 bytes/star (rarad, decrad, mag, ci, hip as float32/uint32)
  - Output: `public/data/stars.bin` (312KB, 15,599 stars ≤ mag 7.0)
  - Output: `public/data/named-stars.json` (401 named stars)
- [x] **2.1.3** `src/data/loadCatalog.ts` — Binary catalog loader with RA/Dec → Cartesian conversion + vertex data builder
- [x] **2.1.4** `src/data/starColor.ts` — B-V → RGB via Ballesteros formula (B-V → temp → Helland RGB) + fast LUT
- [x] **2.1.5** Magnitude → billboard size mapping (logarithmic, customizable scale)
- [x] **2.1.6** Async catalog loading on layer init
- [x] **2.1.7** Unit tests: 25 new tests (14 starColor + 11 loadCatalog) — coordinate conversion, color mapping, filtering

### Phase 2.2 — Catalog Star Rendering ✅

- [x] **2.2.1** `src/layers/CatalogStarLayer.ts` — WebGL render layer using HYG data (order 15)
- [x] **2.2.2** `src/shaders/catalog-stars.vert.glsl` + `catalog-stars.frag.glsl` — per-star size/color with Airy-like glow
- [x] **2.2.3** Dynamic magnitude filtering (rebuild vertex data on magLimit/sizeScale change)
- [x] **2.2.4** Overlay modes: 'overlay' (additive blend) vs 'replace' (hides procedural stars)
- [x] **2.2.6** `src/ui/panels/CatalogStarPanel.tsx` — UI controls (magnitude limit, brightness, size scale, blend mode)
- [x] **Zustand store** — `CatalogStarParams` interface, default values, `setCatalogStars` action, session persistence

### Build Verification (Post M2.2)

- [x] TypeScript: zero errors
- [x] Vitest: 59 tests passing (5 test suites)
- [x] Production build: 100 modules, 284KB JS (90KB gzip), 27KB CSS (5.6KB gzip)

### SVG Icon Extraction ✅

- [x] Extracted 7 inline SVGs from TSX into modular `src/ui/icons/` components
- [x] Files: `InfoIcon`, `CloseIcon`, `GlobeIcon`, `GitHubIcon`, `CubeIcon`, `ExternalLinkIcon`, `ChevronRightIcon`
- [x] Shared `IconProps` interface (`size`, `className`), barrel index
- [x] Updated `Toolbar.tsx`, `AboutModal.tsx`, `PanelSection.tsx` to use icon imports

### Phase 2.3 — Constellation Data & Rendering ✅

- [x] **2.3.1** `src/data/constellationData.ts` — All 88 IAU constellations with stick figure line segments as HIP ID pairs
- [x] **2.3.4** `src/shaders/constellation-lines.vert.glsl` + `constellation-lines.frag.glsl` — GL_LINES with configurable color/opacity
- [x] **2.3.4** `src/layers/ConstellationLayer.ts` — WebGL render layer (order 16), loads catalog → builds HIP→position lookup → GL_LINES
- [x] **Zustand store** — `ConstellationParams` interface (enabled, opacity, lineColor, lineWidth), `setConstellations` action, persisted
- [x] **2.3.8** `src/ui/panels/ConstellationPanel.tsx` — UI controls (toggle, opacity slider, color picker, line width)
- [x] **Integration** — Pipeline (6 layers), App.tsx sync, panel in sidebar

### Build Verification (Post M2.3)

- [x] TypeScript: zero errors
- [x] Vitest: 59 tests passing (5 test suites)
- [x] Production build: 113 modules, 300KB JS (96KB gzip), 27KB CSS (5.7KB gzip)

---

## Current File Structure

```
SkyboxGenerator/
├── docs/                          # Planning documents (7 docs)
├── scripts/
│   ├── preprocess-hyg.mjs         # HYG CSV → binary preprocessor
│   ├── hyg_v42.csv                # Raw HYG v4.2 catalog (34MB, gitignored)
│   └── hyg_v42.csv.gz             # Compressed source (14MB)
├── public/
│   └── data/
│       ├── stars.bin              # Pre-processed binary star catalog (312KB)
│       └── named-stars.json       # 401 named stars with metadata
├── src/
│   ├── data/
│   │   ├── __tests__/
│   │   │   ├── loadCatalog.test.ts # 11 coordinate/vertex tests
│   │   │   └── starColor.test.ts   # 14 B-V→RGB conversion tests
│   │   ├── constellationData.ts   # 88 IAU constellations + HIP ID line pairs
│   │   ├── loadCatalog.ts         # Binary catalog loader + vertex builder
│   │   └── starColor.ts           # B-V → RGB (Ballesteros + Helland + LUT)
│   ├── export/
│   │   ├── exporter.ts            # PNG individual + cross layout export
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts # R, F, P, 1-5 shortcuts
│   │   └── index.ts
│   ├── layers/
│   │   ├── BackgroundLayer.ts     # Solid color background (order 0)
│   │   ├── CatalogStarLayer.ts    # Real HYG catalog stars (order 15)
│   │   ├── ConstellationLayer.ts  # Constellation stick figures (order 16)
│   │   ├── NebulaLayer.ts         # 4D noise nebula clouds (order 20)
│   │   ├── PointStarLayer.ts      # Procedural point-sprite stars (order 10)
│   │   ├── RenderLayer.ts         # Layer interface
│   │   ├── SunLayer.ts            # Sun with corona + glow (order 30)
│   │   └── index.ts
│   ├── presets/
│   │   └── presets.ts             # 5 built-in + custom preset system
│   ├── renderer/
│   │   ├── CubemapFBO.ts          # Cubemap framebuffer object
│   │   ├── FullscreenQuad.ts      # Fullscreen quad geometry
│   │   ├── Renderer.ts            # WebGL2 context manager
│   │   ├── SkyboxPipeline.ts      # Pipeline orchestrator (6 layers)
│   │   └── index.ts
│   ├── shaders/
│   │   ├── background.frag.glsl
│   │   ├── catalog-stars.frag.glsl # HYG catalog star fragment shader
│   │   ├── catalog-stars.vert.glsl # HYG catalog star vertex shader
│   │   ├── constellation-lines.frag.glsl # Constellation line fragment shader
│   │   ├── constellation-lines.vert.glsl # Constellation line vertex shader
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
│   │   ├── icons/
│   │   │   ├── ChevronRightIcon.tsx
│   │   │   ├── CloseIcon.tsx
│   │   │   ├── CubeIcon.tsx
│   │   │   ├── ExternalLinkIcon.tsx
│   │   │   ├── GitHubIcon.tsx
│   │   │   ├── GlobeIcon.tsx
│   │   │   ├── InfoIcon.tsx
│   │   │   ├── types.ts           # Shared IconProps interface
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   └── AppLayout.tsx      # 3-panel layout
│   │   └── panels/
│   │       ├── BackgroundPanel.tsx
│   │       ├── CatalogStarPanel.tsx # HYG catalog star controls
│   │       ├── ConstellationPanel.tsx # Constellation line controls
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

| Shader                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `fullscreen.vert.glsl`          | Clip-space quad → ray direction via inverse VP matrix   |
| `background.frag.glsl`          | Solid color fill                                        |
| `point-stars.vert.glsl`         | Per-vertex position/size/color from VBO, GL_POINTS      |
| `point-stars.frag.glsl`         | Soft circular point sprites with brightness falloff     |
| `catalog-stars.vert.glsl`       | HYG catalog stars — per-star position/size/color        |
| `catalog-stars.frag.glsl`       | Airy-like core + halo glow profile for catalog stars    |
| `constellation-lines.vert.glsl` | Constellation stick figure line vertices                |
| `constellation-lines.frag.glsl` | Configurable color + opacity for constellation lines    |
| `nebula.frag.glsl`              | 4D simplex noise FBM, 3-color gradient, density/falloff |
| `sun.frag.glsl`                 | Angular disk + smoothstep corona + power-law glow       |
| `skybox-preview.frag.glsl`      | Cubemap texture sampling for viewport preview           |

---

## Next Step

**Phase 2.4 — Remaining M2 Tasks**

- Task 2.3.2: IAU boundary polygon data (optional)
- Task 2.3.5: Constellation boundary rendering (dashed lines)

### Recently Completed

- ✅ Task 2.2.5: Named star labels (Canvas 2D → texture atlas → billboard)
- ✅ Task 2.3.6: Constellation label rendering (texture atlas approach)
- ✅ Task 2.3.7: Per-constellation toggle UI (88 checkboxes with search)
- ✅ FOV slider control in toolbar
- ✅ Sidebar widened to w-96
- ✅ Vite dev server port set to 5180
