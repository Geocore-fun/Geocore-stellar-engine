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

1. Prefer **Cross Layout PNG** for Unity skyboxes at your desired resolution (2048–4096 recommended)
2. Import the PNG into Unity and set **Texture Shape** to **Cube**
3. Set **Mapping** to **Auto** or **6 Frames Layout (Cubic Environment)**
4. Set **Convolution Type** to **None**, enable **Fixup Edge Seams** if available, and test first with compression disabled
5. Create a new **Material** with shader **Skybox/Cubemap** and assign the imported cubemap
6. Go to **Window → Rendering → Lighting**, and set the skybox material in the **Environment** tab

#### Individual Face Import

Use **Individual PNGs (ZIP)** only when a six-texture workflow is required. Unzip the files into your Unity project, create a **Material** with shader **Skybox/6 Sided**, then assign each face texture to the corresponding slot:

- Front (+Z): `front.png`
- Back (−Z): `back.png`
- Left (−X): `left.png`
- Right (+X): `right.png`
- Up (+Y): `top.png`
- Down (−Y): `bottom.png`

> **Important**: Exported cubemap faces intentionally preserve WebGL cubemap row orientation for Unity. Do not vertically flip the PNGs in an image editor; doing so breaks the +Y/-Y joins and creates visible seams in Milky Way and nebula layers.

> **Tip**: The cross layout produces a 4:3 aspect image (4×face width, 3×face height). The preferred Unity path is importing that single image as a cubemap texture rather than assigning six independent 2D textures.

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
