# Geocore Stellar Engine — Project Index

> A professional-grade, GPU-accelerated procedural skybox engine for low-earth orbit simulation and Unity game development.
> Designed for creating photorealistic low-Earth-orbit space backgrounds with fine-grained control over every visual element.

---

## Purpose

Geocore Stellar Engine is a desktop + browser tool that produces high-quality cubemap skyboxes representing deep space as seen from low Earth orbit. The primary use case is a geography trivia game in Unity with a 3D Earth at center — the skybox wraps around the Earth providing a realistic space backdrop (similar to how Google Earth renders its outer-space environment).

The tool offers unprecedented control over every visual parameter: star fields, sun, nebulae, constellations, the Milky Way, and more — exposed through sliders, color pickers, graphs, and presets. The final output is exported as a Unity-ready cubemap in multiple formats.

---

## Documentation Index

| Document                           | Description                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| [index.md](index.md)               | This file — project overview, folder structure, data sources |
| [architecture.md](architecture.md) | System architecture, module breakdown, data flow             |
| [tech-stack.md](tech-stack.md)     | Tech stack decisions, tooling, and rationale                 |
| [features.md](features.md)         | Feature specifications — MVP and future phases               |
| [roadmap.md](roadmap.md)           | Implementation roadmap with milestones and phases            |
| [ui-design.md](ui-design.md)       | UI/UX design plan, layout, control panels                    |
| [code-style.md](code-style.md)     | Code style guide, conventions, architecture rules            |

---

## Project Folder Structure (Planned)

```
GeoCoreStellarEngine/
├── docs/                          # Planning & reference documentation
│   ├── index.md                   # This file
│   ├── architecture.md
│   ├── tech-stack.md
│   ├── features.md
│   ├── roadmap.md
│   ├── ui-design.md
│   └── code-style.md
│
├── src/                           # Application source code
│   ├── main.tsx                   # Tauri + React entry point
│   ├── App.tsx                    # Root React component
│   │
│   ├── renderer/                  # WebGL2 rendering engine
│   │   ├── engine.ts              # Core render engine (cubemap face iteration)
│   │   ├── context.ts             # WebGL2 context management
│   │   ├── program.ts             # Shader program compilation & uniform management
│   │   ├── buffer.ts              # GPU buffer abstractions (VBO, attribs)
│   │   ├── texture.ts             # Texture creation, binding, mipmaps
│   │   ├── framebuffer.ts         # Framebuffer / render target management
│   │   ├── renderable.ts          # Renderable geometry (quad, box, point cloud)
│   │   └── types.ts               # Shared renderer type definitions
│   │
│   ├── layers/                    # Render layers (each visual element)
│   │   ├── layer.ts               # Base layer interface
│   │   ├── point-stars.ts         # Procedural background star field
│   │   ├── catalog-stars.ts       # HYG database star rendering
│   │   ├── constellations.ts      # Constellation lines, labels, boundaries
│   │   ├── sun.ts                 # Sun with corona, limb darkening, god rays
│   │   ├── nebula.ts              # Procedural nebula (noise-based)
│   │   ├── milky-way.ts           # Milky Way (procedural + texture hybrid)
│   │   └── lens-effects.ts        # Lens flare, bloom post-processing
│   │
│   ├── shaders/                   # GLSL shader source files
│   │   ├── common/
│   │   │   ├── noise4d.glsl       # Classic 4D Perlin noise
│   │   │   ├── math.glsl          # Common math utilities
│   │   │   └── color.glsl         # Color space conversion helpers
│   │   ├── point-stars.vert
│   │   ├── point-stars.frag
│   │   ├── catalog-stars.vert
│   │   ├── catalog-stars.frag
│   │   ├── constellations.vert
│   │   ├── constellations.frag
│   │   ├── sun.vert
│   │   ├── sun.frag
│   │   ├── nebula.vert
│   │   ├── nebula.frag
│   │   ├── milky-way.vert
│   │   ├── milky-way.frag
│   │   ├── skybox-preview.vert
│   │   ├── skybox-preview.frag
│   │   ├── bloom.frag
│   │   └── lens-flare.frag
│   │
│   ├── data/                      # Static data files
│   │   ├── hyg-stars.ts           # HYG star catalog loader / parser
│   │   ├── constellations.ts      # Constellation line/boundary data
│   │   └── presets.ts             # Built-in preset definitions
│   │
│   ├── ui/                        # React UI components
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx   # Main parameter control panel
│   │   │   ├── Slider.tsx         # Reusable slider with value display
│   │   │   ├── ColorPicker.tsx    # Color picker with hex/RGB input
│   │   │   ├── Toggle.tsx         # Toggle switch component
│   │   │   ├── VectorInput.tsx    # 3D vector input (x, y, z)
│   │   │   ├── PresetSelector.tsx # Preset load/save UI
│   │   │   ├── ExportDialog.tsx   # Export settings & progress
│   │   │   ├── Histogram.tsx      # Brightness / color distribution graph
│   │   │   └── DirectionPicker.tsx# 3D direction picker for sun/star positions
│   │   ├── panels/
│   │   │   ├── StarPanel.tsx      # Star field controls
│   │   │   ├── SunPanel.tsx       # Sun controls
│   │   │   ├── NebulaPanel.tsx    # Nebula controls
│   │   │   ├── MilkyWayPanel.tsx  # Milky Way controls
│   │   │   ├── ConstellationPanel.tsx
│   │   │   ├── ExportPanel.tsx    # Export settings
│   │   │   └── GlobalPanel.tsx    # Global settings (seed, resolution)
│   │   └── layout/
│   │       ├── Sidebar.tsx        # Left sidebar with tabbed panels
│   │       ├── Viewport.tsx       # 3D preview viewport wrapper
│   │       └── Toolbar.tsx        # Top toolbar (presets, undo, export)
│   │
│   ├── state/                     # Application state management
│   │   ├── store.ts               # Zustand store definition
│   │   ├── actions.ts             # State mutation actions
│   │   ├── presets.ts             # Preset load/save logic
│   │   └── types.ts               # State type definitions
│   │
│   ├── export/                    # Cubemap export pipeline
│   │   ├── exporter.ts            # Export orchestrator
│   │   ├── formats.ts             # Format converters (PNG, EXR, cross layout)
│   │   └── unity-cubemap.ts       # Unity-specific cubemap assembly
│   │
│   └── utils/                     # Shared utilities
│       ├── math.ts                # Math helpers (vec3, quaternion, etc.)
│       ├── color.ts               # Color conversion (HSL, temperature → RGB)
│       ├── rng.ts                 # Seeded random number generator
│       └── constants.ts           # Global constants
│
├── src-tauri/                     # Tauri (Rust) backend
│   ├── src/
│   │   └── main.rs                # Tauri entry point, file system commands
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── public/                        # Static assets
│   ├── data/
│   │   ├── hygdata_v41.csv        # HYG star database (downloaded)
│   │   └── constellations.json    # Constellation line data
│   └── textures/
│       └── milkyway.jpg           # Optional Milky Way texture
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

---

## External Data Sources

### HYG Stellar Database

- **Repository**: https://github.com/astronexus/HYG-Database
- **File**: `hygdata_v41.csv` (~120,000 stars)
- **Fields used**: `id`, `hip`, `proper`, `ra` (right ascension), `dec` (declination), `mag` (apparent magnitude), `ci` (color index / B-V), `spect` (spectral class), `con` (constellation)
- **Purpose**: Render real star positions with accurate brightness and spectral colors
- **Processing**: Parsed at build time or loaded at runtime, filtered by magnitude threshold, converted from equatorial coordinates (RA/Dec) to 3D Cartesian for cubemap rendering

### IAU Constellation Data

- **Source**: IAU official constellation boundary & line data
- **Fields used**: Star pairs defining constellation stick figures, boundary polygons
- **Purpose**: Overlay constellation lines, labels, and boundaries on the star field
- **Format**: JSON processed from standard astronomical catalogs

### Milky Way Textures (Optional)

- **Source**: NASA/ESA public domain panoramic imagery, or procedurally generated
- **Purpose**: Provide a high-fidelity Milky Way band as an alternative to procedural generation
- **Format**: High-res equirectangular or cubemap-face textures

---

## Key Terminology

| Term                     | Definition                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| **Cubemap**              | 6 square textures (front, back, left, right, top, bottom) forming a cube that surrounds the camera |
| **Skybox**               | A cubemap used as a background environment in a 3D scene                                           |
| **HYG**                  | A combined star catalog merging Hipparcos, Yale, and Gliese data                                   |
| **Apparent magnitude**   | Brightness of a star as seen from Earth (lower = brighter; Sun ≈ −26.7, faintest naked-eye ≈ 6.5)  |
| **Color index (B-V)**    | Difference between blue and visual magnitudes — maps to star color temperature                     |
| **Right Ascension (RA)** | Celestial longitude (0–24 hours)                                                                   |
| **Declination (Dec)**    | Celestial latitude (−90° to +90°)                                                                  |
| **Spectral class**       | Star classification (O, B, A, F, G, K, M) — from hottest/blue to coolest/red                       |
| **Corona**               | The sun's outer atmosphere, visible as a glow around the solar disk                                |
| **Limb darkening**       | The effect where the edge of the sun appears darker than its center                                |
| **God rays**             | Volumetric light beams radiating from a bright light source                                        |

---

## Quick Reference: Confirmed Decisions

| Area             | Decision                              |
| ---------------- | ------------------------------------- |
| Language         | TypeScript (strict mode)              |
| UI Framework     | React + Vite                          |
| Desktop Shell    | Tauri                                 |
| Rendering API    | WebGL2                                |
| Color Space      | sRGB                                  |
| State Management | Zustand                               |
| Star Data        | HYG Database v4.1                     |
| Export Formats   | 6-face PNG, cross layout PNG, HDR/EXR |
| Scope Strategy   | MVP first, then iterate               |
