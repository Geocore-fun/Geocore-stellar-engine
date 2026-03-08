# Geocore Stellar Engine — Current Status

**Last Updated:** 2025-07-15 — All Milestones Complete (M1–M4)  
**Status:** M1 ✅ | M2 ✅ | M3 ✅ | M4 ✅ — All roadmap items implemented

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
- [x] **1.6** Zustand store with `persist` + `subscribeWithSelector`, all UI panels

### Phase 1.7 — Export System ✅

- [x] **1.7.1** `exporter.ts` — PNG face rendering + pixel readback
- [x] **1.7.2** Individual PNGs (right, left, top, bottom, front, back) in ZIP
- [x] **1.7.3** Cross layout PNG (4×3 grid)
- [x] **1.7.4** ExportPanel with format selector, resolution, progress overlay
- [x] **1.7.5** Browser download via `<a download>` + blob URL

### Phase 1.8 — Presets ✅

- [x] **1.8.1** 6 built-in presets (Deep Space, Milky Way, Sunset Nebula, Blue Giant, Void, Starfield)
- [x] **1.8.2** PresetPanel with load/save/delete UI
- [x] **1.8.3** Custom preset save/load (JSON serialization to localStorage)
- [x] **1.8.4** Import/export preset files (.json)

### Phase 1.9 — Testing & Polish ✅

- [x] **1.9.1** Unit tests: 59 tests passing (5 test suites)
- [x] **1.9.2** Unity cubemap face mapping documented in README
- [x] **1.9.3** Performance monitoring: `PerfMonitor` + PerfOverlay HUD (press P)
- [x] **1.9.4** Edge case hardening (ErrorBoundary, session persist, debounce, shortcuts)
- [x] **1.9.5** README.md with setup, usage, Unity import guide, project structure

---

### Phase 2.1 — HYG Data Pipeline ✅

- [x] **2.1.1** Downloaded HYG v4.2 catalog (119,626 stars, 34MB CSV)
- [x] **2.1.2** `scripts/preprocess-hyg.mjs` — CSV→binary preprocessor (312KB binary + named stars JSON)
- [x] **2.1.3** `src/data/loadCatalog.ts` — Binary catalog loader with RA/Dec → Cartesian conversion
- [x] **2.1.4** `src/data/starColor.ts` — B-V → RGB via Ballesteros formula
- [x] **2.1.5** Magnitude → billboard size mapping (logarithmic)
- [x] **2.1.6** Async catalog loading on layer init
- [x] **2.1.7** Unit tests: 25 tests (14 starColor + 11 loadCatalog)

### Phase 2.2 — Catalog Star Rendering ✅

- [x] **2.2.1** `CatalogStarLayer.ts` — Real HYG catalog stars (order 15)
- [x] **2.2.2** Catalog star shaders — per-star size/color with Airy-like glow
- [x] **2.2.3** Dynamic magnitude filtering
- [x] **2.2.4** Overlay modes: 'overlay' vs 'replace'
- [x] **2.2.5** Named star labels (Canvas 2D → texture atlas → billboard)
- [x] **2.2.6** `CatalogStarPanel.tsx` — UI controls

### Phase 2.3 — Constellation Data & Rendering ✅

- [x] **2.3.1** 88 IAU constellations with stick figure line segments as HIP ID pairs
- [x] **2.3.2** IAU boundary polygon data
- [x] **2.3.4** `ConstellationLayer.ts` — GL_LINES rendering (order 16)
- [x] **2.3.5** Constellation boundary rendering (dashed lines)
- [x] **2.3.6** Constellation label rendering (texture atlas)
- [x] **2.3.8** `ConstellationPanel.tsx` — Full controls

---

### Phase 3.1 — Milky Way ✅

- [x] **3.1.1** Procedural Milky Way shader (galactic-plane noise FBM with core bulge + dust lanes)
- [x] **3.1.4** `MilkyWayPanel.tsx` — 16 parameters

### Phase 3.2 — Post-Processing Pipeline ✅

- [x] **3.2.1** Multi-pass framebuffer ping-pong setup
- [x] **3.2.2** Bright pixel extraction pass (threshold + soft knee)
- [x] **3.2.3** Separable Gaussian blur (9-tap, horizontal + vertical)
- [x] **3.2.4** Bloom compositing (additive blend)
- [x] **3.2.5** Lens flare generation (analytical ghosts + halo along sun-center axis)
- [x] **3.2.6** God ray shader (radial blur from screen-space sun position)

### Phase 3.3 — Advanced Star Features ✅

- [x] **3.3.1** Star twinkle (seed-based per-star brightness variation)
- [x] **3.3.2** Diffraction spikes (4-point cross pattern on bright catalog stars)

---

### Phase 4.1 — Undo/Redo ✅

- [x] `src/state/historyStore.ts` — Standalone history store with snapshot queue
- [x] Zustand `subscribeWithSelector` debounced subscription to app store changes
- [x] 50-entry undo/redo stack with cursor-based navigation

### Phase 4.2 — Keyboard Shortcuts ✅

- [x] Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
- [x] H = toggle histogram, Space integration
- [x] `useKeyboardShortcuts.ts` updated with new bindings

### Phase 4.3 — Brightness/Color Histogram ✅

- [x] `src/ui/components/HistogramOverlay.tsx` — Canvas 2D histogram overlay
- [x] Real-time 256-bin RGB histogram from cubemap face pixel data
- [x] Toggle via H key, renders in viewport corner
- [x] PBO-based async readback (1-frame latency, no GPU stalls)

### Phase 4.4 — A/B Comparison Mode ✅

- [x] `src/ui/components/ComparisonOverlay.tsx` — Snapshot + split-view comparison
- [x] Capture current view as snapshot, drag vertical split divider
- [x] Wired into App.tsx viewport with canvas dimension tracking

### Phase 4.5 — Batch Export ✅

- [x] `src/export/batchExport.ts` — Iterate all presets, apply to pipeline, render, package in ZIP
- [x] Per-preset folders in ZIP with 6 face PNGs each
- [x] Pipeline state restoration after batch via `restoreFromAppState()`
- [x] "Batch Export All Presets" button in ExportPanel

### Phase 4.6 — Session Persistence ✅

- [x] Zustand `persist` middleware (implemented since M1, auto-save to localStorage)

### Phase 4.7 — Tiled Rendering (8K+) ✅

- [x] `src/export/tiledExport.ts` — Sub-frustum projection via `mat4.frustum()`
- [x] `buildTileProjection()` — subdivides 90° cubemap frustum into NxN tiles
- [x] `computeTileGrid()` — determines optimal tile count, caps at 4096 per tile
- [x] `renderTiledCubemap()` — renders all 6 faces with tiling, stitches on CPU
- [x] `needsTiledRendering()` — checks if resolution exceeds GPU limits
- [x] 8192 and 16384 resolution options in ExportPanel (labeled "tiled")

### Phase 4.8 — HDR Export ✅

- [x] `src/export/hdrExport.ts` — Radiance HDR (.hdr) format encoder
- [x] RGBE encoding (`encodeRGBE()`) + RLE scanline compression
- [x] `pixelsToHDR()` — 8-bit RGBA → HDR with configurable exposure multiplier
- [x] `exportAsHDR()` — packages 6 face .hdr files into ZIP
- [x] "HDR Radiance (ZIP)" option in ExportPanel format selector

### Phase 4.9 — Performance Optimization ✅

- [x] `src/renderer/AsyncReadback.ts` — PBO double-buffered async pixel readback
- [x] PIXEL_PACK_BUFFER ping-pong scheme eliminates GPU stalls during histogram
- [x] 1-frame latency tradeoff for smooth real-time interaction
- [x] Integrated into SkyboxPipeline via `readFacePixelsAsync()`

### Phase 4.10 — Error Handling & User Feedback ✅

- [x] `src/utils/glErrors.ts` — GPU capability detection, context lost handling, shader error formatting
- [x] `detectGPUCapabilities()` — queries MAX_TEXTURE_SIZE, float textures, vendor/renderer, software renderer detection
- [x] `setupContextLostHandling()` — canvas event listeners for webglcontextlost/restored
- [x] `formatShaderError()` — parses shader error logs with line-level source context
- [x] `src/state/toastStore.ts` — Zustand toast notification store (auto-dismiss, type-based)
- [x] `src/ui/components/ToastOverlay.tsx` — Fixed bottom-right toast rendering
- [x] Toast notifications for: GPU warnings, context loss/restore, export success/failure, batch export

---

## Build Verification

- [x] TypeScript: zero errors
- [x] Vitest: 59 tests passing (5 test suites)
- [x] All M1–M4 roadmap items implemented

---

## Current File Structure

```
GeoCoreStellarEngine/
├── docs/                          # Planning documents (7 docs)
├── scripts/
│   ├── preprocess-hyg.mjs         # HYG CSV → binary preprocessor
│   └── hyg_v42.csv                # Raw HYG v4.2 catalog (gitignored)
├── public/
│   └── data/
│       ├── stars.bin              # Pre-processed binary star catalog (312KB)
│       └── named-stars.json       # 401 named stars with metadata
├── src/
│   ├── data/
│   │   ├── __tests__/             # 25 tests (starColor + loadCatalog)
│   │   ├── constellationData.ts   # 88 IAU constellations + HIP ID line pairs
│   │   ├── loadCatalog.ts         # Binary catalog loader + vertex builder
│   │   └── starColor.ts           # B-V → RGB (Ballesteros + Helland + LUT)
│   ├── export/
│   │   ├── batchExport.ts         # Multi-preset batch export to ZIP
│   │   ├── exporter.ts            # PNG individual + cross layout export
│   │   ├── hdrExport.ts           # Radiance HDR (.hdr) encoder
│   │   ├── tiledExport.ts         # Sub-frustum tiled rendering for 8K+
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts # R, F, P, H, 1-5, Ctrl+Z/Y shortcuts
│   │   └── index.ts
│   ├── layers/
│   │   ├── BackgroundLayer.ts     # Solid color background (order 0)
│   │   ├── CatalogStarLayer.ts    # Real HYG catalog stars (order 15)
│   │   ├── ConstellationBoundaryLayer.ts # IAU boundaries (order 15.5)
│   │   ├── ConstellationLayer.ts  # Constellation stick figures (order 16)
│   │   ├── ConstellationLabelLayer.ts # Constellation labels (order 17)
│   │   ├── MilkyWayLayer.ts       # Procedural Milky Way band (order 19)
│   │   ├── NamedStarLabelLayer.ts # Named star labels (order 14)
│   │   ├── NebulaLayer.ts         # 4D noise nebula clouds (order 20)
│   │   ├── PointStarLayer.ts      # Procedural point-sprite stars (order 10)
│   │   ├── RenderLayer.ts         # Layer interface
│   │   ├── SunLayer.ts            # Sun with corona + glow (order 30)
│   │   └── index.ts
│   ├── presets/
│   │   └── presets.ts             # 6 built-in + custom preset system
│   ├── renderer/
│   │   ├── AsyncReadback.ts       # PBO double-buffered async pixel readback
│   │   ├── BloomPass.ts           # Multi-pass bloom post-processing
│   │   ├── CubemapFBO.ts          # Cubemap framebuffer object
│   │   ├── FullscreenQuad.ts      # Fullscreen quad geometry
│   │   ├── GodRayPass.ts          # Radial blur god rays
│   │   ├── LensFlarePass.ts       # Analytical ghost + halo lens flares
│   │   ├── Renderer.ts            # WebGL2 context manager
│   │   ├── SkyboxPipeline.ts      # Pipeline orchestrator (10 layers + 3 post-proc)
│   │   └── index.ts
│   ├── shaders/
│   │   ├── background.frag.glsl
│   │   ├── bloom-blur.frag.glsl
│   │   ├── bloom-composite.frag.glsl
│   │   ├── bloom-extract.frag.glsl
│   │   ├── catalog-stars.{vert,frag}.glsl
│   │   ├── constellation-boundary.{vert,frag}.glsl
│   │   ├── constellation-lines.{vert,frag}.glsl
│   │   ├── fullscreen.vert.glsl
│   │   ├── god-rays.frag.glsl
│   │   ├── lens-flare.frag.glsl
│   │   ├── milky-way.frag.glsl
│   │   ├── nebula.frag.glsl
│   │   ├── point-stars.{vert,frag}.glsl
│   │   ├── postprocess.vert.glsl
│   │   ├── skybox-preview.frag.glsl
│   │   └── sun.frag.glsl
│   ├── state/
│   │   ├── appStore.ts            # Zustand store (persist + subscribeWithSelector)
│   │   ├── historyStore.ts        # Undo/redo history (50-entry stack)
│   │   ├── toastStore.ts          # Toast notification store
│   │   └── index.ts
│   ├── types/
│   │   ├── common.ts              # Shared types (ExportFormat, params interfaces)
│   │   └── index.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── AboutModal.tsx
│   │   │   ├── ColorPickerControl.tsx
│   │   │   ├── ComparisonOverlay.tsx  # A/B split-view comparison
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── HistogramOverlay.tsx   # Real-time RGB histogram
│   │   │   ├── PanelSection.tsx
│   │   │   ├── PerfOverlay.tsx
│   │   │   ├── SliderControl.tsx
│   │   │   ├── ToastOverlay.tsx       # Toast notifications
│   │   │   ├── ToggleControl.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Viewport.tsx
│   │   │   └── index.ts
│   │   ├── icons/                 # 7 SVG icon components
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   └── panels/
│   │       ├── BackgroundPanel.tsx
│   │       ├── BloomPanel.tsx
│   │       ├── CatalogStarPanel.tsx
│   │       ├── ConstellationPanel.tsx
│   │       ├── ExportPanel.tsx
│   │       ├── GodRayPanel.tsx
│   │       ├── LensFlarePanel.tsx
│   │       ├── MilkyWayPanel.tsx
│   │       ├── NebulaPanel.tsx
│   │       ├── PresetPanel.tsx
│   │       ├── StarFieldPanel.tsx
│   │       ├── SunPanel.tsx
│   │       └── index.ts
│   ├── utils/
│   │   ├── __tests__/             # 34 tests (color, rng, perfMonitor)
│   │   ├── color.ts
│   │   ├── cubemap.ts
│   │   ├── glErrors.ts            # GPU caps, context lost, shader errors
│   │   ├── perfMonitor.ts
│   │   ├── rng.ts
│   │   └── index.ts
│   ├── App.tsx                    # Root component with full pipeline integration
│   ├── index.css                  # Tailwind + glassmorphism theme
│   ├── main.tsx                   # React entry point
│   └── vite-env.d.ts             # GLSL type declarations
├── README.md
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## GLSL Shaders

| Shader                             | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `fullscreen.vert.glsl`             | Clip-space quad → ray direction via inverse VP matrix    |
| `postprocess.vert.glsl`            | Clip-space quad → UV coords for post-processing passes   |
| `background.frag.glsl`             | Solid color fill                                         |
| `point-stars.vert.glsl`            | Per-vertex position/size/color from VBO, GL_POINTS       |
| `point-stars.frag.glsl`            | Soft circular point sprites with brightness falloff      |
| `catalog-stars.vert.glsl`          | HYG stars — position/size/color, seed-based twinkle hash |
| `catalog-stars.frag.glsl`          | Airy glow + diffraction spikes (4-point cross pattern)   |
| `constellation-lines.vert.glsl`    | Constellation stick figure line vertices                 |
| `constellation-lines.frag.glsl`    | Configurable color + opacity for constellation lines     |
| `constellation-boundary.vert.glsl` | IAU boundary line vertices with cumulative arc distance  |
| `constellation-boundary.frag.glsl` | Dashed line rendering via fract(distance/dashLength)     |
| `milky-way.frag.glsl`              | Galactic-plane noise FBM + core bulge, 2-color gradient  |
| `nebula.frag.glsl`                 | 4D simplex noise FBM, 3-color gradient, density/falloff  |
| `sun.frag.glsl`                    | Angular disk + smoothstep corona + power-law glow        |
| `bloom-extract.frag.glsl`          | Bright pixel extraction with soft threshold knee         |
| `bloom-blur.frag.glsl`             | 9-tap separable Gaussian blur (H + V)                    |
| `bloom-composite.frag.glsl`        | Additive scene + bloom compositing                       |
| `god-rays.frag.glsl`               | Radial blur from screen-space sun position               |
| `lens-flare.frag.glsl`             | Analytical ghost + halo lens flare overlay               |
| `skybox-preview.frag.glsl`         | Cubemap texture sampling for viewport preview            |
