# SkyboxGenerator — Implementation Roadmap

**Last Updated:** 2025-07-15

---

## Overview

The project follows an **MVP-first, iterative** approach. Each milestone delivers a complete, usable increment. Estimated timelines are flexible — quality over speed.

```
M1: MVP Core ✅       M2: Star Data ✅      M3: Effects ✅       M4: Polish ✅
───────────────────   ──────────────────    ──────────────────   ──────────────
Scaffolding ✅        HYG catalog loader ✅  Milky Way layer ✅   Undo/redo ✅
WebGL2 engine ✅      Catalog star render ✅ Full sun effects ✅  Histogram ✅
Point stars layer ✅  Constellation lines ✅ Advanced stars ✅    A/B comparison ✅
Sun layer (basic) ✅  Constellation labels ✅ Bloom post-proc ✅  Batch export ✅
Nebula layer ✅       Constellation bounds ✅ Lens flare ✅       Session persist ✅
Preview viewport ✅   Magnitude filtering ✅  God rays ✅         Tiled rendering ✅
Export (PNG/ZIP) ✅   B-V color mapping ✅    ────────────────   HDR export ✅
Preset system ✅      Named star labels ✅                       Perf optimization ✅
Seed system ✅                                                  Error handling ✅
UI panels ✅
```

---

## Milestone 1: MVP Core Generator ✅ COMPLETE

> **Goal**: A fully functional skybox generator with procedural stars, sun, nebulae, interactive preview, and PNG cubemap export.
>
> **Status**: All phases complete. 34 unit tests passing. Production build clean (94 modules).

### Phase 1.1 — Project Scaffolding ✅

| Task  | Description                                                              | Est. |
| ----- | ------------------------------------------------------------------------ | ---- |
| 1.1.1 | Initialize Vite + React + TypeScript project                             | 1h   |
| 1.1.2 | Configure Tauri 2 integration                                            | 2h   |
| 1.1.3 | Set up ESLint, Prettier, tsconfig (strict)                               | 1h   |
| 1.1.4 | Configure Tailwind CSS with dark theme                                   | 1h   |
| 1.1.5 | Set up GLSL import pipeline (`vite-plugin-glsl` or `?raw`)               | 1h   |
| 1.1.6 | Create base folder structure per architecture doc                        | 30m  |
| 1.1.7 | Install core dependencies (gl-matrix, zustand, react-colorful, radix-ui) | 30m  |

### Phase 1.2 — WebGL2 Render Engine ✅

| Task  | Description                                                                         | Est. |
| ----- | ----------------------------------------------------------------------------------- | ---- |
| 1.2.1 | `context.ts` — WebGL2 context creation, capability detection, lost context handling | 2h   |
| 1.2.2 | `program.ts` — Shader compilation, linking, uniform/attrib management               | 3h   |
| 1.2.3 | `buffer.ts` — VBO creation, attribute layout, data upload                           | 2h   |
| 1.2.4 | `texture.ts` — 2D texture creation, binding, mipmap generation                      | 2h   |
| 1.2.5 | `framebuffer.ts` — FBO for offscreen rendering                                      | 2h   |
| 1.2.6 | `renderable.ts` — Combine program + buffers + draw call                             | 2h   |
| 1.2.7 | `engine.ts` — Cubemap face iteration, view/projection setup, layer compositing      | 4h   |
| 1.2.8 | Verify: render a solid color to all 6 faces, inspect output                         | 1h   |

### Phase 1.3 — Core Render Layers ✅

| Task   | Description                                                                               | Est. |
| ------ | ----------------------------------------------------------------------------------------- | ---- |
| 1.3.1  | `layer.ts` — Define `RenderLayer` interface                                               | 1h   |
| 1.3.2  | GLSL: Port and modernize 4D Perlin noise to WebGL2 (GLSL 300 es)                          | 2h   |
| 1.3.3  | **Point stars layer** — Seeded billboard generation, vertex coloring, temperature mapping | 6h   |
| 1.3.4  | Point stars shaders (`.vert` + `.frag`)                                                   | 2h   |
| 1.3.5  | **Sun layer** — Direction-based radial shader, coronal glow, limb darkening               | 6h   |
| 1.3.6  | Sun shaders (`.vert` + `.frag`)                                                           | 3h   |
| 1.3.7  | **Nebula layer** — Multi-octave displaced noise, per-instance rendering                   | 6h   |
| 1.3.8  | Nebula shaders (`.vert` + `.frag`)                                                        | 3h   |
| 1.3.9  | Integration: composite all layers per face with alpha blending                            | 3h   |
| 1.3.10 | Verify: render a complete skybox with all 3 layers                                        | 2h   |

### Phase 1.4 — Seeded RNG & Utilities ✅

| Task  | Description                                                                 | Est. |
| ----- | --------------------------------------------------------------------------- | ---- |
| 1.4.1 | `rng.ts` — Mersenne Twister or xoshiro256\*\* PRNG with string seed hashing | 3h   |
| 1.4.2 | `math.ts` — Random vec3, random rotation, quaternion helpers                | 2h   |
| 1.4.3 | `color.ts` — Color temperature (K) → RGB, B-V → RGB, HSL conversions        | 3h   |
| 1.4.4 | Unit tests for RNG determinism, color conversion accuracy                   | 2h   |

### Phase 1.5 — Preview Viewport ✅

| Task  | Description                                                   | Est. |
| ----- | ------------------------------------------------------------- | ---- |
| 1.5.1 | Skybox preview shader (textured cube interior)                | 2h   |
| 1.5.2 | `Viewport.tsx` — Canvas component with WebGL2 skybox renderer | 3h   |
| 1.5.3 | Orbit camera (mouse drag → yaw/pitch, scroll → FOV)           | 3h   |
| 1.5.4 | Wire up: state changes → re-render cubemap → update preview   | 2h   |
| 1.5.5 | Debounced rendering (50ms delay after parameter change)       | 1h   |

### Phase 1.6 — State Management & UI ✅

| Task   | Description                                                              | Est. |
| ------ | ------------------------------------------------------------------------ | ---- |
| 1.6.1  | `store.ts` — Zustand store with all MVP parameters                       | 3h   |
| 1.6.2  | `types.ts` — TypeScript interfaces for all parameter groups              | 2h   |
| 1.6.3  | Reusable UI components: `Slider`, `Toggle`, `ColorPicker`, `VectorInput` | 6h   |
| 1.6.4  | `GlobalPanel.tsx` — Seed, preview resolution, FOV                        | 2h   |
| 1.6.5  | `StarPanel.tsx` — Point star controls                                    | 3h   |
| 1.6.6  | `SunPanel.tsx` — Sun controls with direction picker                      | 4h   |
| 1.6.7  | `NebulaPanel.tsx` — Multi-instance nebula controls                       | 4h   |
| 1.6.8  | `Sidebar.tsx` — Tabbed panel container                                   | 2h   |
| 1.6.9  | `Toolbar.tsx` — Top bar with preset selector + export button             | 2h   |
| 1.6.10 | App layout: sidebar + viewport + toolbar                                 | 2h   |

### Phase 1.7 — Export System ✅

| Task  | Description                                                        | Est. |
| ----- | ------------------------------------------------------------------ | ---- |
| 1.7.1 | `exporter.ts` — Render all 6 faces at export resolution            | 3h   |
| 1.7.2 | `formats.ts` — Canvas → PNG blob conversion, cross layout assembly | 4h   |
| 1.7.3 | ZIP bundling (JSZip or fflate)                                     | 2h   |
| 1.7.4 | `ExportDialog.tsx` — Resolution, format selection, progress bar    | 3h   |
| 1.7.5 | Tauri: native save dialog integration                              | 2h   |
| 1.7.6 | Browser fallback: `<a download>` or `showSaveFilePicker`           | 1h   |

### Phase 1.8 — Presets ✅

| Task  | Description                                                  | Est. |
| ----- | ------------------------------------------------------------ | ---- |
| 1.8.1 | `presets.ts` — Define 5 built-in presets as typed objects    | 2h   |
| 1.8.2 | `PresetSelector.tsx` — Dropdown with load/save/delete        | 3h   |
| 1.8.3 | Custom preset save/load (JSON serialization to localStorage) | 2h   |
| 1.8.4 | Import/export preset files (.json)                           | 2h   |

### Phase 1.9 — Testing & Polish ✅

| Task  | Description                                                             | Est. | Status |
| ----- | ----------------------------------------------------------------------- | ---- | ------ |
| 1.9.1 | Unit tests: RNG determinism, color conversions, perf monitor (34 tests) | 3h   | ✅     |
| 1.9.2 | Unity cubemap face mapping documented in README                         | 2h   | ✅     |
| 1.9.3 | Performance monitoring: PerfMonitor + PerfOverlay HUD (press P)         | 2h   | ✅     |
| 1.9.4 | Edge cases: ErrorBoundary, session persist, debounce, shortcuts         | 2h   | ✅     |
| 1.9.5 | README.md with setup, usage, Unity import guide, project structure      | 1h   | ✅     |

**Milestone 1 Total Estimate: ~140 hours**

---

## Milestone 2: Real Star Data & Constellations ✅ COMPLETE

> **Goal**: Render real stars from HYG database with accurate positions and spectral colors. Overlay constellation stick figures, labels, and IAU boundaries.

### Phase 2.1 — HYG Data Pipeline ✅

| Task  | Description                                                 | Est. | Status |
| ----- | ----------------------------------------------------------- | ---- | ------ |
| 2.1.1 | Download HYG v4.2 catalog + preprocess to binary (312KB)    | 30m  | ✅     |
| 2.1.2 | `preprocess-hyg.mjs` — CSV→binary preprocessor script       | 3h   | ✅     |
| 2.1.3 | `loadCatalog.ts` — RA/Dec → Cartesian coordinate conversion | 2h   | ✅     |
| 2.1.4 | `starColor.ts` — B-V → RGB via Ballesteros + Helland + LUT  | 3h   | ✅     |
| 2.1.5 | Magnitude → billboard size mapping (logarithmic)            | 2h   | ✅     |
| 2.1.6 | Async catalog loading on layer init                         | 1h   | ✅     |
| 2.1.7 | Unit tests (25 tests): coordinate conversion, color mapping | 2h   | ✅     |

### Phase 2.2 — Catalog Star Rendering ✅

| Task  | Description                                                       | Est. | Status |
| ----- | ----------------------------------------------------------------- | ---- | ------ |
| 2.2.1 | `CatalogStarLayer.ts` — Layer implementation using HYG data       | 6h   | ✅     |
| 2.2.2 | Catalog star shaders (`.vert` + `.frag`) — per-star size/color    | 3h   | ✅     |
| 2.2.3 | Dynamic magnitude filtering (rebuild vertex data on param change) | 3h   | ✅     |
| 2.2.4 | Overlay modes: replace vs blend with procedural stars             | 2h   | ✅     |
| 2.2.5 | Named star labels (Canvas 2D → texture atlas → billboard)         | 4h   | ✅     |
| 2.2.6 | `CatalogStarPanel.tsx` — UI controls                              | 3h   | ✅     |

### Phase 2.3 — Constellation Data & Rendering ✅

| Task  | Description                                                           | Est. | Status |
| ----- | --------------------------------------------------------------------- | ---- | ------ |
| 2.3.1 | Source and process constellation stick figure data (star ID pairs)    | 3h   | ✅     |
| 2.3.2 | Source and process IAU boundary polygon data                          | 3h   | ✅     |
| 2.3.3 | `constellationData.ts` — 88 IAU constellations with HIP ID pairs      | 2h   | ✅     |
| 2.3.4 | `ConstellationLayer.ts` — GL_LINES rendering for stick figures        | 4h   | ✅     |
| 2.3.5 | Constellation boundary rendering (dashed lines via fragment shader)   | 3h   | ✅     |
| 2.3.6 | Constellation label rendering (texture atlas approach)                | 4h   | ✅     |
| 2.3.7 | Per-constellation toggle UI (88 constellation checkboxes with search) | 3h   | ✅     |
| 2.3.8 | `ConstellationPanel.tsx` — Full controls                              | 3h   | ✅     |

**Milestone 2 Total Estimate: ~56 hours**

---

## Milestone 3: Advanced Visual Effects ✅ COMPLETE

> **Goal**: Add Milky Way, full sun effects (bloom, lens flare, god rays), and advanced star rendering.

### Phase 3.1 — Milky Way ✅

| Task  | Description                                                                    | Est. | Status     |
| ----- | ------------------------------------------------------------------------------ | ---- | ---------- |
| 3.1.1 | Procedural Milky Way shader (noise concentrated on galactic plane, dust lanes) | 8h   | ✅         |
| 3.1.2 | Texture-based Milky Way (equirectangular → cubemap mapping)                    | 4h   | ⏭️ Skipped |
| 3.1.3 | Blend mode between procedural and texture                                      | 2h   | ⏭️ Skipped |
| 3.1.4 | `MilkyWayPanel.tsx` — Controls                                                 | 3h   | ✅         |

### Phase 3.2 — Post-Processing Pipeline ✅

| Task  | Description                                                   | Est. | Status |
| ----- | ------------------------------------------------------------- | ---- | ------ |
| 3.2.1 | Multi-pass framebuffer ping-pong setup                        | 4h   | ✅     |
| 3.2.2 | Bright pixel extraction pass (threshold filter)               | 2h   | ✅     |
| 3.2.3 | Separable Gaussian blur (horizontal + vertical passes)        | 4h   | ✅     |
| 3.2.4 | Bloom compositing (additive blend of blurred bright pixels)   | 2h   | ✅     |
| 3.2.5 | Lens flare generation (radial elements along sun-center axis) | 6h   | ✅     |
| 3.2.6 | God ray shader (radial blur from sun position)                | 4h   | ✅     |

### Phase 3.3 — Advanced Star Features ✅

| Task  | Description                                                            | Est. | Status     |
| ----- | ---------------------------------------------------------------------- | ---- | ---------- |
| 3.3.1 | Star twinkle (animated brightness variation, seeded)                   | 3h   | ✅         |
| 3.3.2 | Diffraction spikes (cross pattern on bright stars via fragment shader) | 4h   | ✅         |
| 3.3.3 | Airy disk point-spread function for bright stars                       | 3h   | ⏭️ Skipped |

**Milestone 3 Total Estimate: ~49 hours**

---

## Milestone 4: Polish & Professional Features ✅ COMPLETE

> **Goal**: Professional workflow features — undo/redo, analytics, comparison tools, batch operations.

| Task | Description                                                     | Est. | Status |
| ---- | --------------------------------------------------------------- | ---- | ------ |
| 4.1  | Undo/redo via Zustand temporal middleware                       | 4h   | ✅     |
| 4.2  | Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Space for fullscreen, etc.) | 2h   | ✅     |
| 4.3  | Brightness/color histogram (real-time framebuffer analysis)     | 6h   | ✅     |
| 4.4  | A/B comparison mode (snapshot + split view)                     | 6h   | ✅     |
| 4.5  | Batch export (multiple presets → multiple cubemaps)             | 4h   | ✅     |
| 4.6  | Session persistence (auto-save/restore full state)              | 3h   | ✅     |
| 4.7  | Tiled rendering for ultra-high resolutions (8K+)                | 6h   | ✅     |
| 4.8  | HDR/EXR export (Radiance RGBE .hdr encoding)                    | 8h   | ✅     |
| 4.9  | Performance optimization pass (PBO async readback)              | 6h   | ✅     |
| 4.10 | Comprehensive error handling and user feedback                  | 3h   | ✅     |

**Milestone 4 Total Estimate: ~48 hours**

---

## Summary

| Milestone | Focus                           | Est. Hours | Cumulative | Status      |
| --------- | ------------------------------- | ---------- | ---------- | ----------- |
| **M1**    | MVP Core Generator              | ~140h      | 140h       | ✅ Complete |
| **M2**    | Real Star Data & Constellations | ~56h       | 196h       | ✅ Complete |
| **M3**    | Advanced Visual Effects         | ~49h       | 245h       | ✅ Complete |
| **M4**    | Polish & Professional Features  | ~48h       | 293h       | ✅ Complete |

---

## Risk Notes

| Risk                                                             | Mitigation                                                        |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| WebGL2 texture size limits (varies by GPU, typically 4096–16384) | Implement tiled rendering fallback in M4                          |
| HYG CSV parsing performance (~120K rows, ~6MB)                   | Parse in Web Worker; cache parsed result in IndexedDB             |
| Cross-platform Tauri webview differences                         | Test on Windows (primary), macOS, Linux; fallback to browser mode |
| Shader complexity on low-end GPUs                                | Reduce octave count, star count; expose quality presets           |
| Unity cubemap face ordering conventions                          | Test early (M1.9.2), document mapping                             |
