# Skybox Generator

A professional procedural cubemap skybox generator built for game development. Generate stunning space backgrounds with customizable stars, nebulae, and sun effects, then export as cubemap PNGs for Unity and other game engines.

Built for [Geocore](https://geocore.fun) — a 3D geography game.

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)
![WebGL2](https://img.shields.io/badge/WebGL2-GLSL%20300%20es-green)

---

## Features

- **Procedural Generation** — Seeded PRNG ensures reproducible skyboxes for any given seed
- **4 Render Layers** — Background, point stars (100K+), nebula (4D noise FBM), sun (corona + glow)
- **Real-time Preview** — Orbit camera with yaw/pitch/FOV controls in a live cubemap preview
- **Cubemap Export** — Individual face PNGs (ZIP) or cross-layout composite PNG
- **Preset System** — 5 built-in presets + save/load/import/export custom presets (JSON)
- **Session Persistence** — Auto-saves all parameters to localStorage; restores on reload
- **Keyboard Shortcuts** — R (randomize), F (reset camera), P (perf overlay), 1–5 (load presets)
- **Performance Monitoring** — FPS/frame time/cubemap render time overlay (press P)
- **Glassmorphism UI** — Frosted glass dark theme with backdrop-blur panels
- **Error Boundary** — Graceful crash recovery with a reset button

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
git clone https://github.com/anahtam/SkyboxGenerator.git
cd SkyboxGenerator

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

| Action          | Input                    |
| --------------- | ------------------------ |
| Orbit camera    | Click + drag             |
| Zoom (FOV)      | Scroll wheel             |
| Randomize seed  | Press **R** or 🎲 button |
| Reset camera    | Press **F**              |
| Load preset 1–5 | Press **1**–**5**        |
| Toggle perf HUD | Press **P**              |
| Close modal     | Press **Escape**         |

### Sidebar Panels

- **Presets** — Quick-load built-in presets or manage custom presets
- **Background** — Background fill color
- **Star Field** — Star count, brightness range, size range, color variation
- **Nebula** — 3-color gradient, density, falloff, scale, octaves, FBM parameters
- **Sun** — Color, size, corona, glow, limb darkening, XYZ direction
- **Export** — Choose format (individual PNGs or cross-layout), resolution, and export

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
├── export/            # PNG/ZIP export pipeline
├── hooks/             # React hooks (keyboard shortcuts)
├── layers/            # WebGL render layers
│   ├── BackgroundLayer.ts
│   ├── PointStarLayer.ts
│   ├── NebulaLayer.ts
│   └── SunLayer.ts
├── presets/            # Built-in & custom preset system
├── renderer/          # WebGL2 core engine
│   ├── Renderer.ts       # Context manager, shader compilation
│   ├── CubemapFBO.ts     # Cubemap framebuffer
│   ├── FullscreenQuad.ts # Fullscreen geometry
│   └── SkyboxPipeline.ts # Pipeline orchestrator
├── shaders/           # GLSL 300 es shaders
├── state/             # Zustand store (persisted)
├── types/             # TypeScript interfaces
├── ui/
│   ├── components/    # Reusable UI (Toolbar, Viewport, controls)
│   ├── layout/        # AppLayout
│   └── panels/        # Parameter panels
├── utils/             # RNG, color conversion, cubemap math, perf monitor
├── App.tsx            # Root component
└── index.css          # Tailwind theme + glassmorphism styles
```

## GLSL Shaders

| Shader                     | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| `fullscreen.vert.glsl`     | Clip-space quad → ray direction via inverse VP        |
| `background.frag.glsl`     | Solid color fill                                      |
| `point-stars.vert.glsl`    | Per-vertex star position/size/color from VBO          |
| `point-stars.frag.glsl`    | Soft circular point sprites with brightness falloff   |
| `nebula.frag.glsl`         | 4D simplex noise FBM, 3-color gradient                |
| `sun.frag.glsl`            | Disk + smoothstep corona + power-law atmospheric glow |
| `skybox-preview.frag.glsl` | Cubemap texture sampling for viewport preview         |

## Built-in Presets

1. **Deep Space** — Dark void with sparse faint stars
2. **Milky Way** — Dense starfield with colorful nebula
3. **Sunset Nebula** — Warm orange/pink nebula with bright sun
4. **Blue Giant** — Cool blue nebula with intense blue-white sun
5. **Void** — Near-black minimalist space

## Keyboard Shortcuts

| Key       | Action                     |
| --------- | -------------------------- |
| `R`       | Randomize seed             |
| `F`       | Reset camera to default    |
| `P`       | Toggle performance overlay |
| `1` – `5` | Load built-in preset 1–5   |
| `Escape`  | Close modal/popover        |

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

[Anahat Mudgal](https://anahatmudgal.com) • [GitHub](https://github.com/anahtam)
