# SkyboxGenerator — System Architecture

---

## High-Level Overview

SkyboxGenerator follows a **layered rendering pipeline** architecture. The application is structured as three primary systems:

1. **Render Engine** — WebGL2-based GPU pipeline that composites multiple visual layers onto 6 cubemap faces
2. **UI Layer** — React-based control surface that exposes every render parameter through interactive widgets
3. **Export Pipeline** — Converts rendered cubemap faces into Unity-ready formats

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tauri Desktop Shell                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                     React UI Layer                        │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │ Control  │  │  Preset  │  │  Export  │  │ Viewport │  │  │
│  │  │ Panels   │  │ Manager  │  │ Dialog   │  │ (Preview)│  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │  │
│  │       │              │              │              │        │  │
│  │  ┌────▼──────────────▼──────────────▼──────────────▼────┐  │  │
│  │  │                 Zustand State Store                   │  │  │
│  │  └────────────────────────┬─────────────────────────────┘  │  │
│  │                           │                                │  │
│  │  ┌────────────────────────▼─────────────────────────────┐  │  │
│  │  │                  Render Engine                        │  │  │
│  │  │  ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │  │              Layer Compositor                    │  │  │  │
│  │  │  │                                                 │  │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│  │  │  │
│  │  │  │  │ Point    │ │ Catalog  │ │ Constellations   ││  │  │  │
│  │  │  │  │ Stars    │ │ Stars    │ │ (lines/labels)   ││  │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────────────┘│  │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│  │  │  │
│  │  │  │  │   Sun    │ │ Nebulae  │ │    Milky Way     ││  │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────────────┘│  │  │  │
│  │  │  │  ┌──────────────────────────────────────────────┐│  │  │  │
│  │  │  │  │   Post-Processing (bloom, lens flare)       ││  │  │  │
│  │  │  │  └──────────────────────────────────────────────┘│  │  │  │
│  │  │  └─────────────────────────────────────────────────┘  │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌─────────────────────────────────────────────────┐  │  │  │
│  │  │  │              WebGL2 Core                         │  │  │  │
│  │  │  │  Programs · Buffers · Textures · Framebuffers   │  │  │  │
│  │  │  └─────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  │                           │                                │  │
│  │  ┌────────────────────────▼─────────────────────────────┐  │  │
│  │  │                Export Pipeline                       │  │  │
│  │  │  Read pixels → Format conversion → File output      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rendering Pipeline

### Cubemap Face Rendering

For each of the 6 cubemap faces, the engine:

1. Sets up a **90° perspective projection** (FOV = π/2, aspect = 1:1) to ensure seamless face tiling
2. Orients a **view matrix** using `lookAt` toward the face direction (±X, ±Y, ±Z)
3. Composites all enabled layers in order via **alpha blending** (back-to-front):
   - Background clear (black)
   - Milky Way layer
   - Nebula layer(s)
   - Point stars layer
   - Catalog stars layer
   - Constellation lines / boundaries / labels
   - Sun layer (core + corona)
   - Post-processing (bloom, lens flare)
4. Reads the framebuffer pixels for export, or displays in the preview viewport

### Face Directions

| Face   | Look Direction | Up Vector  |
| ------ | -------------- | ---------- |
| Front  | (0, 0, −1)     | (0, 1, 0)  |
| Back   | (0, 0, +1)     | (0, 1, 0)  |
| Left   | (−1, 0, 0)     | (0, 1, 0)  |
| Right  | (+1, 0, 0)     | (0, 1, 0)  |
| Top    | (0, +1, 0)     | (0, 0, +1) |
| Bottom | (0, −1, 0)     | (0, 0, −1) |

### Preview vs Export

| Aspect          | Preview Mode                              | Export Mode                                |
| --------------- | ----------------------------------------- | ------------------------------------------ |
| Resolution      | Low (256–512px per face)                  | Full (up to 8K+ per face)                  |
| Update trigger  | Reactive (on parameter change, debounced) | Manual (user clicks export)                |
| Target          | `<canvas>` element (skybox preview)       | Offscreen framebuffer → file output        |
| Post-processing | Optional (can skip for speed)             | Full quality                               |
| Tiling          | Not needed                                | May use tiled rendering for ultra-high res |

---

## Module Architecture

### Renderer Modules (`src/renderer/`)

| Module           | Responsibility                                                                        |
| ---------------- | ------------------------------------------------------------------------------------- |
| `engine.ts`      | Top-level render orchestrator. Iterates faces, composites layers, manages render loop |
| `context.ts`     | WebGL2 context creation, capability detection, extension loading                      |
| `program.ts`     | Shader program compilation, linking, uniform/attribute management                     |
| `buffer.ts`      | Vertex buffer, index buffer, attribute layout management                              |
| `texture.ts`     | Texture creation (2D, cubemap), binding, mipmap generation                            |
| `framebuffer.ts` | Render-to-texture via FBOs for offscreen rendering and post-processing                |
| `renderable.ts`  | Combines a program + buffers + draw call into a single renderable unit                |
| `types.ts`       | Shared TypeScript interfaces for all renderer types                                   |

### Layer Modules (`src/layers/`)

Each layer implements a common `RenderLayer` interface:

```typescript
interface RenderLayer {
  /** Unique identifier */
  readonly id: string;

  /** Whether this layer is currently enabled */
  enabled: boolean;

  /** Initialize GPU resources (called once) */
  initialize(gl: WebGL2RenderingContext): void;

  /** Update parameters (called when state changes) */
  updateParams(params: LayerParams): void;

  /** Render this layer for a given cubemap face */
  render(view: mat4, projection: mat4): void;

  /** Release GPU resources */
  dispose(): void;
}
```

| Layer               | Rendering Technique                                                                 | Key Parameters                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `point-stars.ts`    | Billboard quads on unit sphere, vertex-colored                                      | density, brightness range, size range, color temperature range, seed                                              |
| `catalog-stars.ts`  | HYG data → positioned billboards with spectral colors                               | magnitude cutoff, brightness multiplier, size scaling curve, B-V color mapping                                    |
| `constellations.ts` | GL_LINES for stick figures, text rendering for labels, polygon edges for boundaries | line color/width/opacity, label font/size/color, boundary color/opacity, per-constellation toggles                |
| `sun.ts`            | Full-screen quad with distance-based radial shaders                                 | position (azimuth/elevation), color, disk size, corona intensity/falloff, limb darkening, god ray intensity/count |
| `nebula.ts`         | Full-screen box with multi-octave 4D Perlin noise                                   | scale, color, intensity, falloff, offset, octave count, seed                                                      |
| `milky-way.ts`      | Procedural noise shaped along galactic plane, or texture-mapped sphere              | mode (procedural/texture), intensity, color tint, orientation, width, detail level                                |
| `lens-effects.ts`   | Post-processing pass on framebuffer                                                 | bloom threshold/intensity/radius, lens flare brightness/streak count                                              |

### Data Modules (`src/data/`)

| Module              | Responsibility                                                                        |
| ------------------- | ------------------------------------------------------------------------------------- |
| `hyg-stars.ts`      | Load and parse `hygdata_v41.csv`, convert RA/Dec to 3D positions, filter by magnitude |
| `constellations.ts` | Load constellation line pairs, boundary polygons, and metadata                        |
| `presets.ts`        | Define built-in presets (LEO Default, Deep Space, Sci-Fi, etc.)                       |

### State Management (`src/state/`)

Uses **Zustand** for lightweight, TypeScript-friendly state:

```typescript
interface SkyboxState {
  // Global
  seed: string;
  previewResolution: number;
  exportResolution: number;

  // Per-layer parameters
  pointStars: PointStarParams;
  catalogStars: CatalogStarParams;
  constellations: ConstellationParams;
  sun: SunParams;
  nebulae: NebulaParams[];
  milkyWay: MilkyWayParams;
  lensEffects: LensEffectParams;

  // Presets
  activePreset: string | null;
  customPresets: Record<string, PresetData>;

  // Actions
  updatePointStars: (params: Partial<PointStarParams>) => void;
  updateSun: (params: Partial<SunParams>) => void;
  // ... etc for each layer
  loadPreset: (name: string) => void;
  savePreset: (name: string) => void;
  randomizeSeed: () => void;
}
```

### Export Pipeline (`src/export/`)

```
Render Engine (full-res)
        │
        ▼
  ┌─────────────┐
  │  6 face      │
  │  framebuffers│
  └──────┬──────┘
         │ readPixels()
         ▼
  ┌─────────────┐      ┌──────────────┐
  │  Raw pixel   │─────▶│  6x PNG      │
  │  buffers     │      │  (per face)  │
  └──────┬──────┘      └──────────────┘
         │                     │
         ▼                     ▼
  ┌─────────────┐      ┌──────────────┐
  │  Cross       │      │  EXR/HDR     │
  │  layout      │      │  (optional)  │
  └─────────────┘      └──────────────┘
         │
         ▼
  ┌─────────────┐
  │  ZIP bundle  │
  │  (all files) │
  └─────────────┘
```

---

## Data Flow

### Parameter Change → Re-render

```
User adjusts slider
        │
        ▼
React component calls Zustand action
        │
        ▼
Zustand store updates state
        │
        ▼
React subscription triggers re-render
        │
        ▼
Engine receives new params via useEffect
        │
        ▼
Affected layer(s) update uniforms
        │
        ▼
Preview re-renders (debounced, low-res)
```

### Star Catalog Loading

```
App startup
    │
    ▼
Fetch hygdata_v41.csv (from public/data/)
    │
    ▼
Parse CSV → filter by magnitude threshold
    │
    ▼
Convert RA/Dec → (x, y, z) unit sphere positions
    │
    ▼
Map B-V color index → RGB via Planckian locus
    │
    ▼
Map apparent magnitude → point size + alpha
    │
    ▼
Build vertex buffer (position + color + size)
    │
    ▼
Upload to GPU as VBO
```

### Coordinate Conversion (RA/Dec → Cartesian)

```
x = cos(Dec) × cos(RA × 15°)
y = sin(Dec)
z = cos(Dec) × sin(RA × 15°)
```

Where RA is in hours (0–24) converted to degrees (×15), and Dec is in degrees (−90 to +90).

---

## Key Design Decisions

### Why Layered Compositing?

Each visual element (stars, sun, nebulae, etc.) is an independent render layer with its own shader program and parameters. This provides:

- **Isolation**: Each layer can be developed, tested, and toggled independently
- **Order control**: Layers composite back-to-front with alpha blending
- **Performance**: Only dirty layers need re-rendering (future optimization)
- **Extensibility**: New visual elements = new layer module, no changes to core engine

### Why Offscreen Rendering?

The cubemap faces are rendered to an **offscreen canvas/framebuffer**, not the visible viewport. The preview viewport renders a separate skybox-preview pass that samples the cubemap textures. This separation means:

- Export resolution is independent of screen resolution
- Preview can run at lower resolution for performance
- Multiple export formats can read from the same framebuffer data

### Why Zustand over Redux?

- Minimal boilerplate for a parameter-heavy application
- First-class TypeScript support with type inference
- No action creators, reducers, or middleware overhead
- Perfect for "many sliders updating state" pattern
- Built-in subscriptions for selective re-rendering

---

## Shader Architecture

### Shader Source Organization

Shaders are stored as `.glsl` files and imported via Vite's `?raw` import suffix. Vertex and fragment shaders are separate files (unlike the reference approach of splitting on a delimiter).

### Common Includes

Shared GLSL code (noise functions, color utilities) is injected via string concatenation at program creation time:

```typescript
const vertSrc = commonGLSL + starVertSrc;
const fragSrc = commonGLSL + starFragSrc;
const program = new ShaderProgram(gl, vertSrc, fragSrc);
```

### Noise Functions

4D Perlin noise (`cnoise`) is the foundation for procedural elements (nebulae, Milky Way). The 4th dimension can be used for animation or seed variation. Key properties:

- **Deterministic**: Same input → same output (essential for seeded generation)
- **Smooth**: Continuous gradients without harsh edges
- **Multi-octave**: Layered at different scales for natural detail (fractal Brownian motion)

---

## Threading & Performance Model

### Main Thread

- React UI rendering
- State management
- User input handling

### GPU (via WebGL2)

- All cubemap rendering happens on the GPU
- Fragment shaders do the heavy computation (noise, lighting)
- Vertex processing is lightweight (simple geometry)

### Performance Strategies

1. **Debounced preview updates**: Parameter changes trigger re-render after 50–100ms of inactivity
2. **Resolution scaling**: Preview at 256–512px, export at full resolution
3. **Layer caching**: Unchanged layers don't re-render (phase 2 optimization)
4. **Tiled rendering**: For ultra-high resolutions (8K+), render in tiles and stitch
5. **Web Worker** (future): Heavy data processing (CSV parsing, coordinate conversion) offloaded to workers
