# Geocore Stellar Engine

A GPU-accelerated procedural skybox engine for low-earth orbit simulation. Generate photorealistic space backgrounds — complete with the Milky Way, 100K+ catalog stars, 88 IAU constellations, volumetric nebulae, sun with god rays and lens flare — then export as cubemap PNGs or HDR for Unity and other game engines.

Built for [Geocore](https://geocore.fun) — a 3D modern educational geography game, using a camera perspective from low-earth orbit.

[![Deployed App](https://img.shields.io/badge/Deployed_Webpage-Geocore_Stellar_Engine-blue?style=flat-square)](https://geocore-stellar-engine.vercel.app/)

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![React](https://img.shields.io/badge/React-19-blue)
![WebGL2](https://img.shields.io/badge/WebGL2-GLSL%20300%20es-darkgreen)

## Links

[![Website](https://img.shields.io/badge/Developer_Website-Anahat_Mudgal-blue?style=flat-square)](https://anahatmudgal.com)
[![GitHub](https://img.shields.io/badge/GitHub-AnahatM-181717?style=flat-square&logo=github)](https://github.com/anahatm)
[![Geocore](https://img.shields.io/badge/Geocore_Website-geocore.fun-darkblue?style=flat-square)](https://geocore.fun)
[![Geocore Technologies](https://img.shields.io/badge/Org-Geocore--Technologies-purple?style=flat-square&logo=github)](https://github.com/Geocore-fun)
[![Project Page](https://img.shields.io/badge/Project-Geocore%20Stellar%20Engine-purple?style=flat-square)](https://www.anahatmudgal.com/development/geocore-stellar-engine)

## Screenshots

| ![Screenshot 1](public/images/GeocoreStellarEngine_Screenshot-01.png) | ![Screenshot 2](public/images/GeocoreStellarEngine_Screenshot-02.png) | ![Screenshot 3](public/images/GeocoreStellarEngine_Screenshot-03.png) |
| :-------------------------------------------------------------------: | :-------------------------------------------------------------------: | :-------------------------------------------------------------------: |

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

## Author

[Anahat Mudgal](https://anahatmudgal.com) · [GitHub](https://github.com/anahatm) · [Geocore Technologies](https://github.com/Geocore-fun)
