# SkyboxGenerator — Feature Specifications

---

## Feature Phases

Features are organized into **MVP** (Milestone 1) and **Post-MVP** phases. MVP delivers a fully functional tool; subsequent phases add depth and polish.

---

## MVP — Milestone 1: Core Generator

### F1. Procedural Point Star Field

Generates a dense background of small stars scattered across the sky sphere.

**Parameters:**

| Parameter              | Type         | Range          | Default | Description                                                       |
| ---------------------- | ------------ | -------------- | ------- | ----------------------------------------------------------------- |
| Enabled                | toggle       | —              | `true`  | Show/hide point stars                                             |
| Seed                   | string       | —              | random  | Deterministic seed for star placement                             |
| Density                | slider       | 10,000–500,000 | 100,000 | Number of stars generated                                         |
| Brightness Min         | slider       | 0.0–1.0        | 0.05    | Minimum star brightness                                           |
| Brightness Max         | slider       | 0.0–1.0        | 1.0     | Maximum star brightness                                           |
| Brightness Curve       | slider       | 0.1–10.0       | 4.0     | Power curve for brightness distribution (higher = more dim stars) |
| Size Min               | slider       | 0.01–0.2       | 0.02    | Minimum billboard size                                            |
| Size Max               | slider       | 0.02–0.5       | 0.08    | Maximum billboard size                                            |
| Color Temperature Low  | slider       | 2000–15000 K   | 3000 K  | Lowest star color temperature (reddish)                           |
| Color Temperature High | slider       | 2000–40000 K   | 12000 K | Highest star color temperature (bluish)                           |
| Tint                   | color picker | —              | white   | Global color tint applied to all point stars                      |
| Layer Count            | slider       | 1–5            | 1       | Number of independently rotated star layers (adds depth)          |

**Rendering technique**: Seeded RNG generates positions on unit sphere → billboard quads → vertex-colored by temperature → rendered with simple passthrough shader.

---

### F2. Sun

A bright sun with realistic disk, corona, limb darkening, and optional god rays.

**Parameters:**

| Parameter          | Type                | Range        | Default   | Description                                    |
| ------------------ | ------------------- | ------------ | --------- | ---------------------------------------------- |
| Enabled            | toggle              | —            | `true`    | Show/hide sun                                  |
| Position Azimuth   | slider              | 0–360°       | 45°       | Horizontal angle                               |
| Position Elevation | slider              | −90–90°      | 30°       | Vertical angle                                 |
| _(or)_ Direction   | 3D direction picker | —            | —         | Interactive 3D sphere picker for sun direction |
| Color              | color picker        | —            | `#FFF5E0` | Sun disk and corona base color                 |
| Color Temperature  | slider              | 2000–15000 K | 5778 K    | Alternative: set color by temperature          |
| Disk Size          | slider              | 0.0001–0.01  | 0.0005    | Angular size of the hard sun disk              |
| Corona Intensity   | slider              | 0.0–5.0      | 1.0       | Brightness of the corona glow                  |
| Corona Falloff     | slider              | 1.0–50.0     | 12.0      | How quickly the corona fades with distance     |
| Limb Darkening     | slider              | 0.0–1.0      | 0.6       | Darkening at the edge of the sun disk          |
| God Ray Intensity  | slider              | 0.0–2.0      | 0.0       | Strength of volumetric light streaks           |
| God Ray Count      | slider              | 4–16         | 8         | Number of ray streaks                          |
| God Ray Length     | slider              | 0.1–2.0      | 0.5       | How far rays extend                            |
| Lens Flare         | toggle              | —            | `false`   | Enable lens flare artifacts                    |

**Rendering technique**: Full-screen quad with fragment shader computing radial distance from sun direction. Core uses `smoothstep`, corona uses `pow(d, falloff)`, limb darkening via `1 - pow(1-cos(angle), exponent)`. God rays via radial blur post-processing pass.

---

### F3. Procedural Nebulae

Volumetric cloud-like nebulae generated via multi-octave 4D Perlin noise.

**Parameters (per nebula instance — multiple nebulae supported):**

| Parameter         | Type         | Range      | Default | Description                                              |
| ----------------- | ------------ | ---------- | ------- | -------------------------------------------------------- |
| Enabled           | toggle       | —          | `true`  | Show/hide nebulae                                        |
| Instance Count    | slider       | 0–8        | 1       | Number of independent nebula clouds                      |
| **Per instance:** |              |            |         |                                                          |
| Color             | color picker | —          | random  | Nebula color                                             |
| Scale             | slider       | 0.1–2.0    | 0.5     | Noise scale (larger = bigger features)                   |
| Intensity         | slider       | 0.1–2.0    | 1.0     | Overall brightness                                       |
| Falloff           | slider       | 1.0–10.0   | 4.0     | Edge sharpness (higher = more defined edges)             |
| Offset X/Y/Z      | slider       | −1000–1000 | random  | Noise space offset (changes nebula shape)                |
| Detail (Octaves)  | slider       | 2–8        | 6       | Noise detail level (more octaves = finer detail, slower) |
| Opacity           | slider       | 0.0–1.0    | 0.8     | Maximum opacity                                          |

**Rendering technique**: Full-screen box geometry. Fragment shader normalizes position, samples iterative displaced 4D Perlin noise, applies color and falloff. Each nebula is a separate draw call with additive blending.

---

### F4. Seed System

Deterministic seed-based generation for reproducible results.

**Parameters:**

| Parameter | Type       | Description                                 |
| --------- | ---------- | ------------------------------------------- |
| Seed      | text input | Arbitrary string, hashed to integer for RNG |
| Randomize | button     | Generate a new random seed                  |
| Copy Seed | button     | Copy current seed to clipboard              |

**Implementation**: Mersenne Twister PRNG seeded from hash of seed string. Different seed offsets for each layer (stars +1000, nebulae +2000, etc.) to ensure independence.

---

### F5. Preview Viewport

Real-time 3D skybox preview with orbit camera.

**Features:**

- Renders cubemap onto a skybox (6 textured quads forming a cube around the camera)
- Orbit camera controlled by mouse drag (yaw + pitch)
- Scroll wheel for FOV adjustment (10°–150°)
- Spacebar to toggle UI visibility (full-screen preview)
- Renders at low resolution (preview res), re-renders on parameter change with debounce

**Parameters:**

| Parameter          | Type           | Range         | Default |
| ------------------ | -------------- | ------------- | ------- |
| Preview Resolution | dropdown       | 128, 256, 512 | 256     |
| FOV                | slider         | 10–150°       | 80°     |
| Auto-rotate        | toggle + speed | 0–10          | off     |

---

### F6. Export System

Export the rendered cubemap in Unity-ready formats.

**Export Options:**

| Option               | Type     | Description                                                         |
| -------------------- | -------- | ------------------------------------------------------------------- |
| Resolution           | dropdown | 256, 512, 1024, 2048, 4096, 8192                                    |
| Format: 6 Faces      | toggle   | Export as 6 individual PNG files (front.png, back.png, etc.)        |
| Format: Cross Layout | toggle   | Export as single cross/T-shaped image                               |
| Format: HDR/EXR      | toggle   | Export in HDR format (future — requires float framebuffer readback) |
| Filename Prefix      | text     | Prefix for exported files                                           |
| Output: ZIP          | toggle   | Bundle all files into a ZIP                                         |
| Output: Folder       | toggle   | Save individual files to a chosen folder (Tauri desktop only)       |

**Cross Layout:**

```
        ┌──────┐
        │ Top  │
┌──────┬──────┬──────┬──────┐
│ Left │Front │Right │ Back │
└──────┴──────┴──────┴──────┘
        │Bottom│
        └──────┘
```

**Unity Import Notes:**

- Unity expects specific face naming conventions — documented in export dialog
- For cross layout, Unity can import directly as `Cubemap` texture type
- sRGB color space matches Unity's default for skybox materials

---

### F7. Preset System

Built-in and custom presets for quick starting points.

**Built-in Presets:**

| Preset          | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| Low Earth Orbit | Realistic view from ISS altitude — moderate star density, subtle Milky Way, warm sun |
| Deep Space      | Dense star field, vivid nebulae, no sun                                              |
| Minimal         | Sparse stars on black, no effects — clean background                                 |
| Vivid           | High contrast, colorful nebulae, bright stars — artistic/dramatic                    |
| Solar System    | Bright sun with corona, sparse distant stars                                         |

**Custom Presets:**

- Save current parameters as named preset (JSON)
- Load from preset list
- Delete custom presets
- Import/export preset files (for sharing)
- Stored in `localStorage` (browser) or app data directory (Tauri)

---

## Milestone 2: Real Star Data & Constellations

### F8. HYG Catalog Star Rendering

Render real stars from the HYG stellar database with accurate positions, brightness, and colors.

**Parameters:**

| Parameter             | Type         | Range                                | Default     | Description                                                                  |
| --------------------- | ------------ | ------------------------------------ | ----------- | ---------------------------------------------------------------------------- |
| Enabled               | toggle       | —                                    | `false`     | Use real star data instead of / alongside procedural                         |
| Magnitude Cutoff      | slider       | −1.0–12.0                            | 6.5         | Only show stars brighter than this (lower = brighter; 6.5 ≈ naked eye limit) |
| Brightness Multiplier | slider       | 0.1–10.0                             | 1.0         | Scale apparent brightness                                                    |
| Size Scaling          | curve editor | —                                    | logarithmic | How magnitude maps to rendered size                                          |
| Color Mode            | dropdown     | Realistic / Monochrome / Custom Tint | Realistic   | How B-V color index maps to render color                                     |
| Overlay Mode          | dropdown     | Replace / Blend                      | Replace     | Whether catalog stars replace or blend with procedural stars                 |
| Named Star Labels     | toggle       | —                                    | `false`     | Show text labels for named stars (Sirius, Betelgeuse, etc.)                  |

**Data Pipeline:**

1. Load `hygdata_v41.csv` (lazy, on first enable)
2. Parse: extract `ra`, `dec`, `mag`, `ci` (color index), `proper` (name), `con` (constellation)
3. Filter by `mag <= magnitudeCutoff`
4. Convert (RA, Dec) → (x, y, z) on unit sphere
5. Map B-V color index → RGB using Planckian locus approximation
6. Map magnitude → billboard size (logarithmic scale)
7. Build vertex buffer, upload to GPU
8. Re-filter on magnitude cutoff change (no full reload)

**B-V Color Index → RGB Mapping:**

| B-V Range     | Color        | Example Stars         |
| ------------- | ------------ | --------------------- |
| < −0.30       | Deep blue    | —                     |
| −0.30 to 0.00 | Blue-white   | Rigel, Spica          |
| 0.00 to 0.30  | White        | Sirius, Vega          |
| 0.30 to 0.60  | Yellow-white | Procyon, Canopus      |
| 0.60 to 0.80  | Yellow       | Sun, Alpha Centauri A |
| 0.80 to 1.20  | Orange       | Arcturus, Aldebaran   |
| 1.20 to 2.00  | Red          | Betelgeuse, Antares   |

---

### F9. Constellation Rendering

Overlay constellation stick figures, labels, and boundaries.

**Parameters:**

| Parameter       | Type         | Range                     | Default     | Description                       |
| --------------- | ------------ | ------------------------- | ----------- | --------------------------------- |
| Show Lines      | toggle       | —                         | `false`     | Draw constellation stick figures  |
| Line Color      | color picker | —                         | `#4488FF40` | Color + opacity of lines          |
| Line Width      | slider       | 0.5–5.0                   | 1.0         | Line thickness (px)               |
| Show Labels     | toggle       | —                         | `false`     | Display constellation names       |
| Label Color     | color picker | —                         | `#FFFFFF80` | Label text color + opacity        |
| Label Size      | slider       | 8–24                      | 12          | Label font size                   |
| Show Boundaries | toggle       | —                         | `false`     | Draw IAU constellation boundaries |
| Boundary Color  | color picker | —                         | `#FFFFFF20` | Boundary line color + opacity     |
| Boundary Style  | dropdown     | Solid / Dashed            | Dashed      | Boundary line style               |
| Filter          | multi-select | all 88 IAU constellations | all         | Toggle individual constellations  |

**Data Sources:**

- Constellation stick figures: star ID pairs defining line segments
- Labels: constellation name + centroid position
- Boundaries: polygon vertices in RA/Dec from IAU data

**Rendering:**

- Lines: `GL_LINES` with per-constellation color override potential
- Labels: Canvas 2D text rendered to texture atlas, then billboard-rendered at centroid positions
- Boundaries: `GL_LINES` with stipple pattern (simulated via fragment shader discard)

---

## Milestone 3: Advanced Visual Effects

### F10. Milky Way

The Milky Way band — both procedural and texture-based options.

**Parameters:**

| Parameter    | Type                              | Range                        | Default        | Description                                    |
| ------------ | --------------------------------- | ---------------------------- | -------------- | ---------------------------------------------- |
| Enabled      | toggle                            | —                            | `true`         | Show Milky Way                                 |
| Mode         | dropdown                          | Procedural / Texture / Blend | Procedural     | Rendering method                               |
| Intensity    | slider                            | 0.0–2.0                      | 0.4            | Overall brightness                             |
| Color Tint   | color picker                      | —                            | `#E8D5B8`      | Warm tint applied to the band                  |
| Width        | slider                            | 5–60°                        | 20°            | Angular width of the band                      |
| Detail       | slider                            | 1–10                         | 5              | Noise detail level (procedural mode)           |
| Orientation  | 2D angle (inclination + rotation) | —                            | galactic plane | Orientation of the band on sky sphere          |
| Texture      | file picker                       | —                            | built-in       | Custom Milky Way texture (texture mode)        |
| Blend Factor | slider                            | 0.0–1.0                      | 0.5            | Procedural vs texture blend ratio (blend mode) |

**Procedural Technique:**

- Multi-octave noise concentrated along a "galactic plane" great circle
- Gaussian falloff perpendicular to the plane
- Additional small-scale noise for dust lanes and granularity

**Texture Technique:**

- Equirectangular panoramic texture mapped onto the sky sphere
- Supports public-domain NASA/ESA Milky Way panoramas

---

### F11. Full Sun Effects

Advanced sun rendering beyond the MVP.

**Additional Parameters (added to F2):**

| Parameter           | Type         | Range   | Default        | Description                            |
| ------------------- | ------------ | ------- | -------------- | -------------------------------------- |
| Lens Flare Elements | slider       | 2–12    | 6              | Number of flare ghosts                 |
| Flare Color         | color picker | —       | from sun color | Flare element base color               |
| Flare Spread        | slider       | 0.1–2.0 | 1.0            | How far flare elements spread from sun |
| Bloom Threshold     | slider       | 0.5–1.0 | 0.8            | Brightness threshold for bloom         |
| Bloom Intensity     | slider       | 0.0–3.0 | 0.5            | Bloom glow intensity                   |
| Bloom Radius        | slider       | 1–20    | 5              | Bloom blur kernel radius               |

**Post-processing pipeline:**

1. Render sun to intermediate framebuffer
2. Extract bright pixels above bloom threshold
3. Apply Gaussian blur (separable, two-pass)
4. Composite bloom back onto scene
5. Add lens flare elements along sun-to-center axis

---

### F12. Advanced Star Rendering

Enhanced star rendering with more physical accuracy.

**Additional Parameters:**

| Parameter              | Type               | Range   | Default | Description                                           |
| ---------------------- | ------------------ | ------- | ------- | ----------------------------------------------------- |
| Twinkle                | toggle + intensity | 0.0–1.0 | 0.0     | Simulated scintillation (subtle brightness variation) |
| Diffraction Spikes     | toggle + count     | 4, 6, 8 | off     | Cross-shaped spikes on bright stars                   |
| Spike Intensity        | slider             | 0.0–1.0 | 0.3     | Brightness of diffraction spikes                      |
| Airy Disk              | toggle             | —       | `false` | Realistic point-spread function for bright stars      |
| Magnitude Exaggeration | slider             | 0.5–3.0 | 1.0     | Exaggerate magnitude differences (artistic control)   |

---

## Milestone 4: Polish & Professional Features

### F13. Histogram & Analytics

Real-time visualization of the rendered sky's properties.

**Displays:**

- **Brightness histogram**: Distribution of pixel brightness across the cubemap
- **Color distribution**: RGB channel histogram
- **Star magnitude distribution**: Bar chart of star counts per magnitude bin
- **Coverage stats**: Percentage of sky covered by nebulae, Milky Way, etc.

### F14. Undo/Redo System

Full parameter undo/redo stack.

- Tracks all parameter changes
- Ctrl+Z / Ctrl+Y keyboard shortcuts
- Undo history panel (optional)
- Implemented via Zustand middleware (temporal)

### F15. A/B Comparison

Split-screen or toggle-based comparison between two configurations.

- Save snapshot A, modify parameters, compare with snapshot B
- Side-by-side or overlay modes
- Useful for fine-tuning subtle differences

### F16. Batch Export

Export multiple presets in one operation.

- Select multiple presets → export all as separate cubemap sets
- Progress bar with cancel support
- Useful for generating skybox variations for different game levels

### F17. Session Persistence

Automatically save and restore the full application state.

- All parameters auto-saved to `localStorage` / Tauri app data
- Restore on next launch
- "Reset to defaults" button

---

## Feature Priority Matrix

| Feature                  | Priority | Complexity | MVP?    |
| ------------------------ | -------- | ---------- | ------- |
| F1. Point Stars          | Critical | Medium     | Yes     |
| F2. Sun (basic)          | Critical | Medium     | Yes     |
| F3. Nebulae              | High     | Medium     | Yes     |
| F4. Seed System          | Critical | Low        | Yes     |
| F5. Preview Viewport     | Critical | Medium     | Yes     |
| F6. Export System        | Critical | High       | Yes     |
| F7. Presets              | High     | Medium     | Yes     |
| F8. HYG Catalog Stars    | High     | High       | No (M2) |
| F9. Constellations       | High     | High       | No (M2) |
| F10. Milky Way           | Medium   | High       | No (M3) |
| F11. Full Sun Effects    | Medium   | High       | No (M3) |
| F12. Advanced Stars      | Low      | Medium     | No (M3) |
| F13. Histogram           | Low      | Medium     | No (M4) |
| F14. Undo/Redo           | Medium   | Low        | No (M4) |
| F15. A/B Comparison      | Low      | Medium     | No (M4) |
| F16. Batch Export        | Low      | Medium     | No (M4) |
| F17. Session Persistence | Medium   | Low        | No (M4) |

---

## Parameters Master List (Quick Reference)

Total adjustable parameters at full feature completion: **90+**

| Category        | Parameter Count          |
| --------------- | ------------------------ |
| Point Stars     | 12                       |
| Sun             | 16                       |
| Nebulae         | 9 per instance × up to 8 |
| Catalog Stars   | 7                        |
| Constellations  | 10+                      |
| Milky Way       | 10                       |
| Advanced Stars  | 5                        |
| Global / Export | 10                       |
| Post-Processing | 6                        |
