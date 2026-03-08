# Geocore Stellar Engine

A GPU-accelerated procedural skybox engine for low-earth orbit simulation. Generate photorealistic space backgrounds — complete with the Milky Way, 100K+ catalog stars, 88 IAU constellations, volumetric nebulae, sun with god rays and lens flare — then export as cubemap PNGs or HDR for Unity and other game engines.

Built for [Geocore](https://geocore.fun) — a 3D geography game simulating views from low-earth orbit.

[![Website](https://img.shields.io/badge/Website-anahatmudgal.com-blue?style=flat-square)](https://anahatmudgal.com)
[![GitHub](https://img.shields.io/badge/GitHub-anahatm-181717?style=flat-square&logo=github)](https://github.com/anahatm)
[![Geocore](https://img.shields.io/badge/Geocore-geocore.fun-green?style=flat-square)](https://geocore.fun)
[![Geocore Technologies](https://img.shields.io/badge/Org-Geocore--Technologies-orange?style=flat-square&logo=github)](https://github.com/Geocore-fun)
[![Project Page](https://img.shields.io/badge/Project-Geocore%20Stellar%20Engine-purple?style=flat-square)](https://www.anahatmudgal.com/development/geocore-stellar-engine)
[![Source Code](https://img.shields.io/badge/Repo-geocore--stellar--engine-181717?style=flat-square&logo=github)](https://github.com/Geocore-fun/geocore-stellar-engine)

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)
![WebGL2](https://img.shields.io/badge/WebGL2-GLSL%20300%20es-green)

---

## Screenshots

|                                                                       |                                                                       |                                                                       |
| :-------------------------------------------------------------------: | :-------------------------------------------------------------------: | :-------------------------------------------------------------------: |
| ![Screenshot 1](public/images/GeocoreStellarEngine_Screenshot-01.png) | ![Screenshot 2](public/images/GeocoreStellarEngine_Screenshot-02.png) | ![Screenshot 3](public/images/GeocoreStellarEngine_Screenshot-03.png) |

---

## Features

### Render Layers (10 layers)

- **Milky Way** — Physically-based galactic plane with customizable tilt, core brightness, and arm structure
- **Catalog Stars** — 119,614 real stars from the HYG v4.2 database with accurate B-V color mapping and magnitude-based sizing
- **Procedural Stars** — 100K+ seeded point sprites with adjustable count, brightness, size, and color variation
- **Nebula** — Volumetric 4D simplex noise FBM with 3-color gradient, tunable density, falloff, and octaves
- **Sun** — Directional light with disk, corona, limb darkening, and atmospheric glow
- **Constellations** — All 88 IAU constellation lines, labels, and boundary polygons
- **Named Star Labels** — Labels for prominent named stars (Sirius, Betelgeuse, Polaris, etc.)
- **Background** — Solid color fill layer

### Post-Processing Pipeline

- **God Rays** — Volumetric light scattering with radial blur + cross-face analytical glow
- **Bloom** — Multi-pass Gaussian bloom with configurable threshold, soft knee, and iterations
- **Lens Flare** — Analytical ghost elements, halo ring, anamorphic streaks, and chromatic aberration

### Export Formats

- **Individual Face PNGs (ZIP)** — 6 cubemap faces at up to 8K resolution
- **Cross Layout PNG** — Single 4:3 composite image
- **HDR (Radiance RGBE)** — High dynamic range cubemap export
- **Tiled Rendering** — GPU-friendly tile-based rendering for 8K/16K+ exports without VRAM limits
- **Batch Export** — Export all presets in one operation

### Editing & Workflow

- **Preset System** — 5 built-in presets + save/load/import/export custom presets (JSON)
- **Undo/Redo** — Full parameter history with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- **A/B Comparison** — Side-by-side before/after comparison with split slider
- **Session Persistence** — Auto-saves all parameters to localStorage; restores on reload
- **Real-time Histogram** — Live RGB histogram with async GPU readback (no stalls)
- **Performance Monitor** — FPS/frame time/render time overlay

### Graphics Engine

- **WebGL2 + GLSL 300 es** — Hardware-accelerated rendering pipeline
- **10-layer compositing** — Sorted render layers with per-layer enable/disable
- **Cubemap FBO** — Renders all 6 faces with shared framebuffer
- **Async Readback** — PBO-based pixel readback with fence sync for stall-free histogram

## Tech Stack

| Component    | Technology                                  |
| ------------ | ------------------------------------------- |
| Framework    | React 19 + TypeScript 5.9                   |
| Build        | Vite 7 (SWC)                                |
| Styling      | Tailwind CSS 4 (CSS-first tokens)           |
| State        | Zustand 5 (persist + subscribeWithSelector) |
| Rendering    | WebGL2 + GLSL 300 es                        |
| Math         | gl-matrix 3                                 |
| Color Picker | react-colorful 5                            |
| Compression  | fflate (ZIP export)                         |
| Testing      | Vitest 4                                    |

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **pnpm** (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Geocore-fun/geocore-stellar-engine.git
cd geocore-stellar-engine

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser with WebGL2 support.

### Build for Production

```bash
pnpm build
pnpm preview    # Serve the production build locally
```

### Run Tests

```bash
pnpm test       # Run vitest in watch mode
pnpm test --run # Run once
```

## Usage

### Controls

| Action          | Input                         |
| --------------- | ----------------------------- |
| Orbit camera    | Click + drag                  |
| Zoom (FOV)      | Scroll wheel                  |
| Randomize seed  | Press **R** or 🎲 button      |
| Reset camera    | Press **F**                   |
| Load preset 1–5 | Press **1**–**5**             |
| Toggle perf HUD | Press **P**                   |
| Undo / Redo     | **Ctrl+Z** / **Ctrl+Shift+Z** |
| Close modal     | Press **Escape**              |

### Sidebar Panels

- **Presets** — Quick-load built-in presets or manage custom presets
- **Background** — Background fill color
- **Star Field** — Star count, brightness range, size range, color variation
- **Catalog Stars** — Magnitude range, color mapping, star sizing
- **Nebula** — 3-color gradient, density, falloff, scale, octaves, FBM parameters
- **Milky Way** — Tilt, core intensity, arm structure, color
- **Constellations** — Line visibility, labels, boundary polygons, constellation selection
- **Sun** — Color, size, corona, glow, limb darkening, XYZ direction
- **God Rays** — Exposure, decay, density, weight
- **Bloom** — Threshold, soft knee, intensity, iterations
- **Lens Flare** — Intensity, ghost count/spacing, halo, chromatic aberration
- **Export** — Format, resolution, tiled rendering, batch export

### Exporting for Unity

Export generates cubemap face images with the following naming convention:

| File Name    | Cubemap Face    | Unity Face  |
| ------------ | --------------- | ----------- |
| `right.png`  | Positive X (+X) | Right (+X)  |
| `left.png`   | Negative X (−X) | Left (−X)   |
| `top.png`    | Positive Y (+Y) | Top (+Y)    |
| `bottom.png` | Negative Y (−Y) | Bottom (−Y) |
| `front.png`  | Positive Z (+Z) | Front (+Z)  |
| `back.png`   | Negative Z (−Z) | Back (−Z)   |

#### Unity Import Steps

1. Export as **Individual PNGs (ZIP)** at your desired resolution (1024–4096 recommended)
2. Unzip and place all 6 face images in your Unity project's `Assets/Textures/Skybox/` folder
3. In Unity, create a new **Material** with shader **Skybox/6 Sided**
4. Assign each face texture to the corresponding slot:
   - Front (+Z): `front.png`
   - Back (−Z): `back.png`
   - Left (−X): `left.png`
   - Right (+X): `right.png`
   - Up (+Y): `top.png`
   - Down (−Y): `bottom.png`
5. Go to **Window → Rendering → Lighting**, and set the skybox material in the **Environment** tab
6. Alternatively, use the **Cross Layout PNG** export and import as a single cubemap texture in Unity (set Texture Shape to Cube, Mapping to Cross Layout)

> **Tip**: For best quality, export at 2048px or 4096px. The cross layout produces a 4:3 aspect image (4×face width, 3×face height).

## Project Structure

```
src/
├── data/              # Star catalogs, constellation data, color mapping
├── export/            # PNG/ZIP/HDR export pipeline, tiled rendering
├── hooks/             # React hooks (keyboard shortcuts)
├── layers/            # WebGL render layers (10 layers)
│   ├── BackgroundLayer.ts
│   ├── PointStarLayer.ts
│   ├── CatalogStarLayer.ts
│   ├── ConstellationLayer.ts
│   ├── ConstellationBoundaryLayer.ts
│   ├── ConstellationLabelLayer.ts
│   ├── MilkyWayLayer.ts
│   ├── NamedStarLabelLayer.ts
│   ├── NebulaLayer.ts
│   └── SunLayer.ts
├── presets/            # Built-in & custom preset system
├── renderer/          # WebGL2 core engine
│   ├── Renderer.ts       # Context manager, shader compilation
│   ├── CubemapFBO.ts     # Cubemap framebuffer
│   ├── FullscreenQuad.ts # Fullscreen geometry
│   ├── SkyboxPipeline.ts # Pipeline orchestrator
│   ├── BloomPass.ts      # Multi-pass Gaussian bloom
│   ├── GodRayPass.ts     # Volumetric light scattering
│   ├── LensFlarePass.ts  # Analytical lens flare
│   └── AsyncReadback.ts  # PBO-based async pixel readback
├── shaders/           # GLSL 300 es shaders
├── state/             # Zustand store (persisted, with undo/redo)
├── types/             # TypeScript interfaces
├── ui/
│   ├── components/    # Toolbar, Viewport, controls, histogram, A/B comparison
│   ├── layout/        # AppLayout
│   └── panels/        # Parameter panels
├── utils/             # RNG, color conversion, cubemap math, perf monitor
├── App.tsx            # Root component
└── index.css          # Tailwind theme + glassmorphism styles
```

## Keyboard Shortcuts

| Key            | Action                     |
| -------------- | -------------------------- |
| `R`            | Randomize seed             |
| `F`            | Reset camera to default    |
| `P`            | Toggle performance overlay |
| `1` – `5`      | Load built-in preset 1–5   |
| `Ctrl+Z`       | Undo                       |
| `Ctrl+Shift+Z` | Redo                       |
| `Escape`       | Close modal/popover        |

## Development

### Code Style

- **TypeScript strict mode** — no implicit any, strict null checks
- **Prettier** — auto-formatting on save
- **Path aliases** — `@/` maps to `src/`
- **GLSL imports** — `?raw` suffix for shader source strings

### Adding a New Render Layer

1. Create a new class implementing `RenderLayer` in `src/layers/`
2. Write GLSL shaders in `src/shaders/`
3. Register the layer in `SkyboxPipeline` constructor
4. Add parameters to `appStore.ts`
5. Create a UI panel in `src/ui/panels/`

## License

MIT

## Author

[Anahat Mudgal](https://anahatmudgal.com) · [GitHub](https://github.com/anahatm) · [Geocore Technologies](https://github.com/Geocore-fun)
