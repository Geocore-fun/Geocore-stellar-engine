# SkyboxGenerator — UI/UX Design Plan

---

## Layout Overview

The application uses a **three-zone layout**: toolbar (top), sidebar (left), and viewport (center). Dark theme throughout — appropriate for a space visualization tool.

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar                                                     │
│  [Preset ▼] [Seed: abc123] [🎲] [Undo] [Redo] [⬇ Export]   │
├──────────────┬──────────────────────────────────────────────┤
│  Sidebar     │                                              │
│              │                                              │
│ ┌──────────┐ │                                              │
│ │ Tabs:    │ │                                              │
│ │ ☆ Stars  │ │          3D Preview Viewport                 │
│ │ ☀ Sun    │ │                                              │
│ │ ☁ Nebula │ │        (orbit camera, mouse drag)            │
│ │ 🌌 MW   │ │                                              │
│ │ ⚙ Global │ │                                              │
│ │ 📤Export │ │                                              │
│ └──────────┘ │                                              │
│              │                                              │
│ ┌──────────┐ │                                              │
│ │ Active   │ │                                              │
│ │ Panel    │ │                                              │
│ │ Controls │ │                                              │
│ │          │ │                                              │
│ │ [slider] │ │                                              │
│ │ [toggle] │ │                                              │
│ │ [color]  │ │                                              │
│ │ [...]    │ │                                              │
│ └──────────┘ │                                              │
│              │                                              │
│  Preset Info │                                              │
│  [Load][Save]│                                              │
├──────────────┴──────────────────────────────────────────────┤
│  Status bar: Resolution: 1024 | Stars: 100K | FPS: 60      │
└─────────────────────────────────────────────────────────────┘
```

---

## Zone Details

### Toolbar (Top Bar)

Fixed height (~48px). Contains:

| Element           | Type        | Description                     |
| ----------------- | ----------- | ------------------------------- |
| Preset Selector   | Dropdown    | Load built-in or custom presets |
| Seed Display      | Text input  | Current seed, editable          |
| Randomize Seed    | Button (🎲) | Generate random seed            |
| Undo / Redo       | Buttons     | Parameter undo/redo (M4)        |
| Export            | Button      | Opens export dialog             |
| Fullscreen Toggle | Button      | Hide sidebar, maximize viewport |

### Sidebar (Left Panel)

Fixed width (~320px, resizable). Contains:

1. **Tab bar** — Icon + label tabs to switch between parameter panels
2. **Active panel** — Scrollable panel of controls for the selected tab
3. **Footer** — Preset quick-save, status indicators

#### Tab Structure

| Tab            | Icon | Panel Contents                              |
| -------------- | ---- | ------------------------------------------- |
| Stars          | ☆    | Point star params, catalog star params (M2) |
| Sun            | ☀    | Sun position, color, corona, effects        |
| Nebula         | ☁    | Nebula instances, per-instance controls     |
| Milky Way      | 🌌   | MW mode, intensity, orientation (M3)        |
| Constellations | ✦    | Lines, labels, boundaries, filter (M2)      |
| Global         | ⚙    | Seed, preview resolution, FOV, animation    |
| Export         | 📤   | Resolution, format, output options          |

### Viewport (Center)

Fills remaining space. Contains:

- **3D WebGL2 canvas** rendering the cubemap skybox preview
- **Overlay**: FPS counter, resolution indicator (subtle, toggleable)
- **Interaction**:
  - Left mouse drag → orbit (yaw/pitch)
  - Scroll wheel → zoom (FOV change)
  - Middle mouse → pan (optional)
  - Spacebar → toggle sidebar visibility
  - Double-click → reset camera

### Status Bar (Bottom)

Thin bar (~24px) showing:

- Current render resolution
- Active star count
- Preview FPS
- Export progress (when exporting)

---

## Control Components

### Slider

The primary control component. Used for ~70% of parameters.

```
┌──────────────────────────────────────┐
│ Star Density                         │
│ ├────────────●───────────────────┤   │
│ 10,000              100,000  500,000 │
│                    ┌──────┐          │
│          Value:    │87,432│          │
│                    └──────┘          │
└──────────────────────────────────────┘
```

**Features:**

- Label at top
- Draggable track with thumb
- Min/max indicators
- Editable numeric value (click to type exact value)
- Optional: step snapping, logarithmic scale
- Tooltip with parameter description on hover

### Color Picker

Used for sun color, nebula color, star tint, etc.

```
┌──────────────────────────────────────┐
│ Sun Color                            │
│ ┌────┐  #FFF5E0                      │
│ │████│  ┌──────────────────────────┐ │
│ └────┘  │    Saturation/Value      │ │
│         │    picker square         │ │
│         └──────────────────────────┘ │
│         ├──── Hue bar ─────────────┤ │
│         ├──── Alpha bar (opt) ─────┤ │
│  R [255] G [245] B [224]             │
│  Temperature: 5778K                  │
└──────────────────────────────────────┘
```

**Features:**

- Color swatch preview
- HSV picker (square + hue strip)
- Hex input
- RGB numeric inputs
- Optional: color temperature input (for sun/stars)
- Optional: alpha channel

### Toggle Switch

On/off for feature enable/disable.

```
┌──────────────────────────────────────┐
│ Point Stars          ┌────┐         │
│                      │ ON │ ●       │
│                      └────┘         │
└──────────────────────────────────────┘
```

### Vector Input

3D direction/position input (for sun direction, nebula offset).

```
┌──────────────────────────────────────┐
│ Sun Direction                        │
│ Azimuth  ├──────●────────────────┤   │
│          45°                         │
│ Elevation├────●──────────────────┤   │
│          30°                         │
│          ┌──────┐                    │
│          │  ◉   │ ← Interactive      │
│          │   ·  │   sphere picker    │
│          └──────┘                    │
└──────────────────────────────────────┘
```

**Features:**

- Azimuth + elevation sliders (spherical coordinates)
- Interactive 3D sphere picker (click to set direction)
- Numeric inputs for precise values

### Direction Picker (3D Sphere Widget)

Small interactive sphere for picking directions (sun position, star placement).

- Renders a small sphere with a dot showing current direction
- Click/drag on sphere to change direction
- Shows azimuth/elevation readout
- Used alongside sliders for quick visual positioning

### Multi-Instance Panel (Nebulae)

For features that support multiple instances:

```
┌──────────────────────────────────────┐
│ Nebulae  [+ Add] [− Remove]         │
│ ┌────────────────────────────────┐   │
│ │ Nebula 1              [▼ ▲ ✕] │   │
│ │ Color: ████  Scale: 0.5       │   │
│ │ Intensity ├──●──────────────┤  │   │
│ │ Falloff   ├────────●────────┤  │   │
│ │ ...                            │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ Nebula 2 (collapsed)   [▼ ✕]  │   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

**Features:**

- Add/remove instances
- Collapsible per-instance panels
- Reorder (drag or up/down buttons)
- Per-instance enable/disable

---

## Export Dialog

Modal dialog triggered by Export button.

```
┌─────────────────────────────────────────────┐
│  Export Skybox                        [✕]    │
│─────────────────────────────────────────────│
│                                              │
│  Resolution:  [ 1024 ▼ ]                    │
│               256 | 512 | 1024 | 2048       │
│               4096 | 8192                    │
│                                              │
│  Formats:                                    │
│  ☑ 6 Individual Face PNGs                   │
│  ☑ Cross Layout PNG                         │
│  ☐ HDR/EXR (requires M4)                   │
│                                              │
│  Output:                                     │
│  ◉ Download as ZIP                          │
│  ○ Save to folder (desktop only)            │
│                                              │
│  Filename prefix: [ skybox_ ]               │
│                                              │
│  ┌──────────────────────────────────┐       │
│  │  Preview of cross layout        │       │
│  │  (thumbnail)                     │       │
│  └──────────────────────────────────┘       │
│                                              │
│  Estimated size: ~24 MB                     │
│                                              │
│  [ Cancel ]                [ Export ]        │
│                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░ 0%              │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Color Scheme

Dark theme optimized for space visualization (high contrast UI on dark background).

| Token            | Hex       | Usage                              |
| ---------------- | --------- | ---------------------------------- |
| `bg-primary`     | `#0D1117` | Main background                    |
| `bg-secondary`   | `#161B22` | Sidebar, panels                    |
| `bg-tertiary`    | `#21262D` | Input backgrounds, hover           |
| `border`         | `#30363D` | Panel borders, dividers            |
| `text-primary`   | `#E6EDF3` | Primary text                       |
| `text-secondary` | `#8B949E` | Labels, descriptions               |
| `text-muted`     | `#484F58` | Disabled text                      |
| `accent`         | `#58A6FF` | Active tabs, focused inputs, links |
| `accent-hover`   | `#79C0FF` | Accent hover state                 |
| `success`        | `#3FB950` | Success states, export complete    |
| `warning`        | `#D29922` | Warnings                           |
| `danger`         | `#F85149` | Errors, delete actions             |
| `slider-track`   | `#30363D` | Slider track background            |
| `slider-fill`    | `#58A6FF` | Slider filled portion              |
| `slider-thumb`   | `#E6EDF3` | Slider thumb                       |

---

## Responsive Behavior

| Viewport Width     | Layout Adaptation                                            |
| ------------------ | ------------------------------------------------------------ |
| > 1200px           | Full layout (sidebar + viewport)                             |
| 800–1200px         | Narrower sidebar (280px), smaller controls                   |
| < 800px            | Sidebar overlays viewport (toggle button), or stacked layout |
| Fullscreen (Space) | Sidebar hidden, toolbar hidden, viewport fills screen        |

---

## Keyboard Shortcuts

| Key                       | Action                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `Space`                   | Toggle sidebar + toolbar visibility                         |
| `Ctrl+Z`                  | Undo (M4)                                                   |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo (M4)                                                   |
| `Ctrl+S`                  | Quick-save current preset                                   |
| `Ctrl+E`                  | Open export dialog                                          |
| `R`                       | Randomize seed                                              |
| `F`                       | Reset camera to front view                                  |
| `1–6`                     | Snap camera to face (front, back, left, right, top, bottom) |
| `Escape`                  | Close modal / exit fullscreen                               |

---

## Accessibility Notes

- All controls keyboard-navigable (tab order)
- Slider values editable via keyboard (arrow keys for increment)
- Color picker includes hex input for precise entry
- Sufficient contrast ratios (WCAG AA minimum for text)
- Focus indicators on all interactive elements
- Screen reader labels on icon-only buttons (aria-label)
