# Geocore Stellar Engine — Code Style Guide

---

## Core Principles

1. **Concise** — No unnecessary verbosity. Prefer clear, compact code over overly explicit patterns.
2. **Clean** — Consistent formatting, no dead code, no commented-out blocks in committed code.
3. **DRY** — Extract shared logic into utilities. Never duplicate shader setup, coordinate conversion, or color math.
4. **Well-documented** — Every exported function, interface, and non-obvious algorithm gets a JSDoc comment. Shaders get inline comments for math.
5. **Modular** — Small, focused files. One concern per module. No file should exceed ~300 lines; refactor if approaching this.
6. **Optimal** — Choose the right data structure. Avoid unnecessary allocations in render loops. Profile before optimizing.

---

## TypeScript Conventions

### General

```typescript
// YES — concise, typed, clear
const toCartesian = (ra: number, dec: number): Vec3 => {
  const raRad = (ra * 15 * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  return [Math.cos(decRad) * Math.cos(raRad), Math.sin(decRad), Math.cos(decRad) * Math.sin(raRad)];
};

// NO — overly verbose, unnecessary intermediate variables
function convertRightAscensionAndDeclinationToCartesianCoordinates(
  rightAscension: number,
  declination: number,
): { x: number; y: number; z: number } {
  const rightAscensionInDegrees = rightAscension * 15;
  const rightAscensionInRadians = rightAscensionInDegrees * (Math.PI / 180);
  // ... etc
}
```

### Naming

| Entity             | Convention                                       | Example                              |
| ------------------ | ------------------------------------------------ | ------------------------------------ |
| Files              | `kebab-case.ts`                                  | `point-stars.ts`, `catalog-stars.ts` |
| React components   | `PascalCase.tsx`                                 | `StarPanel.tsx`, `ColorPicker.tsx`   |
| Interfaces / Types | `PascalCase`                                     | `SunParams`, `RenderLayer`           |
| Functions          | `camelCase`                                      | `renderFace`, `loadStarCatalog`      |
| Constants          | `UPPER_SNAKE_CASE`                               | `MAX_STARS`, `DEFAULT_FOV`           |
| CSS classes        | `kebab-case` (CSS Modules) or Tailwind utilities | `.slider-track`, `bg-secondary`      |
| Shader uniforms    | `uPascalCase`                                    | `uViewMatrix`, `uSunPosition`        |
| Shader attributes  | `aPascalCase`                                    | `aPosition`, `aColor`                |
| Shader varyings    | `vPascalCase`                                    | `vWorldPos`, `vTexCoord`             |

### Types & Interfaces

```typescript
// Prefer interfaces for object shapes (extendable)
interface SunParams {
  enabled: boolean;
  azimuth: number;
  elevation: number;
  color: [number, number, number];
  diskSize: number;
  coronaIntensity: number;
  coronaFalloff: number;
  limbDarkening: number;
  godRayIntensity: number;
  godRayCount: number;
}

// Use type for unions, primitives, tuples
type Vec3 = [number, number, number];
type RenderMode = 'procedural' | 'texture' | 'blend';
type CubemapFace = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';
```

### Imports

```typescript
// Order: external → internal → types → styles
import { create } from 'zustand';
import { mat4, vec3 } from 'gl-matrix';

import { ShaderProgram } from '../renderer/program';
import { createBuffer } from '../renderer/buffer';

import type { RenderLayer, LayerParams } from './layer';

import styles from './StarPanel.module.css';
```

### Exports

```typescript
// Prefer named exports (tree-shakeable, explicit)
export const MAX_STARS = 500_000;
export function buildStarGeometry(count: number, seed: string): Float32Array { ... }

// Default exports ONLY for React components
export default function StarPanel() { ... }
```

### Error Handling

```typescript
// WebGL operations that can fail: throw descriptive errors
const program = gl.createProgram();
if (!program) {
  throw new Error('Failed to create WebGL program');
}

// User-facing errors: show toast notification, don't crash
try {
  await exportCubemap(params);
} catch (err) {
  toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
}
```

---

## React Conventions

### Component Structure

```typescript
// 1. Imports
// 2. Types (component-specific)
// 3. Component (function declaration, default export)
// 4. Helper functions (if component-specific)

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export default function Slider({ label, value, min, max, step = 1, onChange }: SliderProps) {
  // Hooks first
  const [localValue, setLocalValue] = useState(value);

  // Effects
  useEffect(() => setLocalValue(value), [value]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalValue(v);
    onChange(v);
  };

  // Render
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-secondary">{label}</label>
      <input type="range" min={min} max={max} step={step} value={localValue} onChange={handleChange} />
    </div>
  );
}
```

### State Management Rules

```typescript
// Access store with selectors (prevents unnecessary re-renders)
// YES
const sunColor = useStore((s) => s.sun.color);
const updateSun = useStore((s) => s.updateSun);

// NO — subscribes to entire store, re-renders on any change
const store = useStore();
```

### Component Size Limits

- **Max ~150 lines** per component file (including imports, types)
- Extract complex logic into custom hooks (`useOrbitCamera`, `useDebounce`)
- Extract sub-sections into child components if a panel exceeds 100 lines of JSX

---

## GLSL Conventions

### File Organization

```glsl
// 1. Version declaration
#version 300 es
precision highp float;

// 2. Uniforms (grouped by purpose)
// -- Transform
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

// -- Material
uniform vec3 uColor;
uniform float uIntensity;

// 3. Inputs (vertex) or Varyings (fragment)
in vec3 aPosition;
out vec3 vWorldPos;

// 4. Includes (noise, utilities)
// Injected via string concatenation at compile time

// 5. Helper functions

// 6. main()
void main() {
  // ...
}
```

### Naming in Shaders

| Prefix | Meaning                | Example                       |
| ------ | ---------------------- | ----------------------------- |
| `u`    | Uniform                | `uViewMatrix`, `uSunPosition` |
| `a`    | Attribute / input      | `aPosition`, `aColor`         |
| `v`    | Varying / interpolated | `vWorldPos`, `vNormal`        |
| (none) | Local variable         | `brightness`, `falloff`       |

### Comments in Shaders

```glsl
// Compute angular distance from fragment to sun direction
float d = 1.0 - clamp(dot(posNorm, sunDir), 0.0, 1.0);

// Exponential falloff for corona glow
// Higher uFalloff = tighter corona
float corona = exp(-(d - uDiskSize) * uFalloff);
```

---

## File Size & Module Guidelines

| Type                    | Max Lines | Action if Exceeded                      |
| ----------------------- | --------- | --------------------------------------- |
| TypeScript module       | 300       | Split into sub-modules                  |
| React component         | 150       | Extract hooks / child components        |
| GLSL shader (vert/frag) | 150       | Extract functions to include files      |
| Type definitions file   | 200       | Split by domain (star-types, sun-types) |
| Test file               | 300       | Split by test group                     |

### When to Create a New Module

- When a function serves a different concern than its current file
- When a file exceeds the line limit
- When two modules share logic that should be a utility
- When a React component has complex hooks (extract to `use*.ts`)

---

## Testing Conventions

### What to Test

| Always Test                                            | Skip Testing                          |
| ------------------------------------------------------ | ------------------------------------- |
| Math utilities (coordinate conversion, color mapping)  | React component rendering (manual QA) |
| RNG determinism (same seed → same output)              | Shader output (visual inspection)     |
| Data parsing (CSV parser, JSON loader)                 | WebGL context operations              |
| Export format correctness (valid PNG dimensions)       | UI layout                             |
| State management (store actions produce correct state) | —                                     |

### Test Naming

```typescript
describe('toCartesian', () => {
  it('converts RA=0, Dec=0 to (1, 0, 0)', () => { ... });
  it('converts RA=6h, Dec=0 to (0, 0, 1)', () => { ... });
  it('converts Dec=90 to (0, 1, 0)', () => { ... });
});
```

---

## Git Conventions

### Commit Messages

Format: `type(scope): description`

| Type       | Usage                                   |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `refactor` | Code restructuring (no behavior change) |
| `style`    | Formatting, whitespace                  |
| `docs`     | Documentation only                      |
| `test`     | Test additions/changes                  |
| `chore`    | Build config, dependency updates        |
| `perf`     | Performance improvements                |
| `shader`   | GLSL shader changes                     |

Examples:

```
feat(stars): add color temperature slider for point stars
fix(export): correct cross layout face placement
refactor(renderer): extract framebuffer management to module
shader(sun): add limb darkening to sun fragment shader
```

### Branch Strategy

- `main` — stable, releasable
- `dev` — integration branch
- `feat/*` — feature branches (`feat/hyg-stars`, `feat/constellation-lines`)
- `fix/*` — bugfix branches

---

## Documentation Standards

### JSDoc for All Exports

```typescript
/**
 * Convert B-V color index to RGB using Planckian locus approximation.
 *
 * @param bv - B-V color index (typically -0.4 to 2.0)
 * @returns RGB tuple normalized to [0, 1]
 *
 * @see http://www.vendian.org/mncharity/dir3/starcolor/
 */
export function bvToRgb(bv: number): Vec3 { ... }
```

### Interface Documentation

```typescript
/** Parameters controlling the procedural point star field. */
interface PointStarParams {
  /** Whether the point star layer is visible. */
  enabled: boolean;

  /** Number of stars to generate (10,000 – 500,000). */
  density: number;

  /** Power curve for brightness distribution. Higher = more dim stars. */
  brightnessCurve: number;

  // ...
}
```

### No Orphan Comments

Every comment must be directly above the code it describes. No "section divider" comments. Use module boundaries instead.

```typescript
// YES
/** Maximum number of nebula instances. */
const MAX_NEBULAE = 8;

// NO
// ============================
// NEBULA CONSTANTS
// ============================
const MAX_NEBULAE = 8;
```
