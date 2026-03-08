# SkyboxGenerator — Tech Stack

---

## Stack Summary

| Layer            | Technology                 | Version Target    |
| ---------------- | -------------------------- | ----------------- |
| Language         | TypeScript                 | 5.x (strict mode) |
| UI Framework     | React                      | 18.x              |
| Build Tool       | Vite                       | 5.x               |
| Desktop Shell    | Tauri                      | 2.x               |
| Rendering API    | WebGL2                     | —                 |
| State Management | Zustand                    | 4.x               |
| Styling          | CSS Modules + Tailwind CSS | 3.x               |
| Math Library     | gl-matrix                  | 4.x (ESM)         |
| Linting          | ESLint                     | 9.x (flat config) |
| Formatting       | Prettier                   | 3.x               |
| Testing          | Vitest                     | 1.x               |
| Package Manager  | pnpm                       | 9.x               |

---

## Detailed Rationale

### TypeScript (Strict)

- **Why**: This project has complex, deeply nested parameter objects (dozens of sliders, vectors, colors). Strict TypeScript catches mismatches at compile time, provides autocomplete for shader uniform names, and self-documents the parameter schema.
- **Config**: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **GLSL typing**: Custom type declarations for `.glsl?raw` imports.

### React 18

- **Why**: Selected for ecosystem breadth. The UI is parameter-heavy (50+ controls across multiple panels), and React's component model handles this well. Abundant component libraries for sliders, color pickers, graphs.
- **Key libraries**:
  - `react-colorful` — Lightweight color picker (3KB)
  - `@radix-ui/react-*` — Accessible headless UI primitives (tabs, dialogs, sliders, toggles)
  - `react-hot-toast` — Notifications for export completion, errors
  - `recharts` or `lightweight-charts` — Histogram / distribution graphs

### Vite 5

- **Why**: Fast HMR for rapid iteration on shader code and UI. Native ESM, first-class TypeScript support, and excellent Tauri integration via `@tauri-apps/cli`.
- **Key plugins**:
  - `vite-plugin-glsl` — Import `.glsl` files with `#include` support for shader composition
  - `@vitejs/plugin-react` — React Fast Refresh
- **GLSL import pattern**:
  ```typescript
  import vertexSrc from "./shaders/star.vert?raw";
  import fragmentSrc from "./shaders/star.frag?raw";
  ```

### Tauri 2

- **Why chosen over Electron**:
  - ~5MB bundle vs ~150MB (Electron ships Chromium)
  - Native performance, lower memory footprint
  - Rust backend enables fast file I/O for export operations
  - Uses system webview (Edge WebView2 on Windows, WebKitGTK on Linux, WebKit on macOS)
  - First-class TypeScript API via `@tauri-apps/api`
- **Browser fallback**: The app also runs standalone in any modern browser. Tauri-specific features (file dialogs, native save) gracefully degrade to browser equivalents (`<a download>`, `showSaveFilePicker`).
- **Rust backend responsibilities**:
  - File system operations (save exported cubemaps)
  - Native file dialogs (save location picker)
  - CSV file reading for large star catalog (optional optimization — can also use `fetch` in browser)

### WebGL2

- **Why not WebGPU**: WebGPU has limited webview support (Tauri on Windows uses Edge WebView2 which supports it, but Linux/macOS webviews may not). WebGL2 is universally supported and sufficient for this use case.
- **Why not Three.js**: The rendering is specialized (cubemap face rendering with custom shaders). A full 3D engine adds unnecessary abstraction and bundle size. Direct WebGL2 gives us full control over the pipeline.
- **Key WebGL2 features used**:
  - `gl.texImage2D` with sized internal formats for precision control
  - Multiple render targets (MRT) for deferred post-processing (future)
  - `gl.readPixels` with `PIXEL_PACK_BUFFER` for async readback during export
  - Transform feedback (potential optimization for star position computation)
  - Non-power-of-two textures for flexible resolution support
  - 32-bit float textures (`EXT_color_buffer_float`) for HDR intermediate buffers

### gl-matrix 4.x

- **Why**: Standard WebGL math library. Version 4.x is ESM-native and tree-shakeable.
- **Usage**: `mat4` (view/projection matrices), `vec3` (positions, directions), `quat` (rotations).
- **Note**: Prefer functional style (`mat4.lookAt(out, eye, center, up)`) over OOP wrappers.

### Zustand 4

- **Why**: Minimal boilerplate for a state-heavy app with 50+ parameters. Perfect for the "many sliders" pattern.
- **Pattern**: Single store with sliced concerns per layer:
  ```typescript
  const useStore = create<SkyboxState>()(
    persist(
      (set, get) => ({
        sun: defaultSunParams,
        updateSun: (p) => set({ sun: { ...get().sun, ...p } }),
        // ...
      }),
      { name: "skybox-state" },
    ),
  );
  ```
- **Persistence**: `zustand/middleware/persist` with `localStorage` for session persistence.

### Tailwind CSS + CSS Modules

- **Tailwind**: Utility-first for layout, spacing, typography. Dark theme by default (space tool).
- **CSS Modules**: For component-specific styles that need scoping (e.g., custom slider tracks, viewport chrome).
- **Design tokens**: Custom Tailwind config for consistent dark-theme palette.

### pnpm

- **Why**: Strict dependency resolution, disk-efficient, faster installs than npm/yarn.
- **Workspace**: Not needed (single package), but pnpm's strictness prevents phantom dependencies.

---

## Development Tooling

### Shader Development

| Tool                          | Purpose                                                |
| ----------------------------- | ------------------------------------------------------ |
| `vite-plugin-glsl`            | Import GLSL with `#include` support + HMR              |
| GLSL Lint (VS Code extension) | Syntax highlighting + error checking for `.glsl` files |
| Shader printf debugging       | Custom debug fragment output (encode values as colors) |

### Code Quality

| Tool                   | Config                                                                   |
| ---------------------- | ------------------------------------------------------------------------ |
| ESLint 9 (flat config) | `@typescript-eslint/recommended-type-checked`, `react-hooks/recommended` |
| Prettier 3             | Single quotes, trailing commas, 100-char line width, 2-space indent      |
| Vitest                 | Unit tests for math utilities, color conversion, coordinate transforms   |

### VS Code Configuration

Recommended extensions:

- `dbaeumer.vscode-eslint`
- `esbenp.prettier-vscode`
- `slevesque.shader` (GLSL support)
- `tauri-apps.tauri-vscode`
- `bradlc.vscode-tailwindcss`

---

## Dependency Budget

Target: Keep production bundle under **500KB** (gzipped, excluding star catalog data).

| Dependency                 | Approx Size (gzip) |
| -------------------------- | ------------------ |
| React + React-DOM          | ~45KB              |
| Zustand                    | ~2KB               |
| gl-matrix                  | ~8KB               |
| Tailwind (purged)          | ~10KB              |
| react-colorful             | ~3KB               |
| Radix UI primitives        | ~15KB              |
| Application code + shaders | ~50KB              |
| **Total (excl. data)**     | **~133KB**         |

Star catalog data (`hygdata_v41.csv`) is ~6MB raw, ~1.5MB gzipped. Will be lazy-loaded on demand.

---

## Build & Deploy

### Development

```bash
pnpm dev              # Vite dev server (browser)
pnpm tauri dev        # Tauri dev mode (desktop window)
```

### Production

```bash
pnpm build            # Vite production build
pnpm tauri build      # Tauri desktop installer (.msi / .dmg / .AppImage)
```

### CI (Future)

- GitHub Actions for lint, type-check, test, build
- Automated Tauri installers for Windows/macOS/Linux
