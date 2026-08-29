# Cover Letter Dossier Studio: Architectural Specification & System Manual

## System Overview

Cover Letter Dossier Studio is a high-density, client-rendered web application designed to author, customize, and compile production-grade executive cover letters and technical dossiers. It targets senior technical leadership roles (Technical Art Directors, Principal TDs, Lead Rendering Engineers) where typical single-column resume formats fail to communicate pipeline scale, runtime frametime budgets, and procedural system architectures.

```
                          ┌────────────────────────┐
                          │   App.tsx Root State   │
                          │ (LocalStorage v16 Persist)
                          └───────────┬────────────┘
                                      │
        ┌─────────────────────────────┼────────────────────────────┐
        ▼                             ▼                            ▼
┌──────────────┐             ┌──────────────────┐        ┌──────────────────┐
│ Toolbar.tsx  │             │   Main Artboard  │        │ Modals & Engines │
│  - Presets   │             │   #dossier-sheet │        │  - AiBridgeModal │
│  - Themes    │             └────────┬─────────┘        │  - PdfExportModal│
│  - Typo / UI │                      │                  └────────┬─────────┘
└──────────────┘                      ▼                           │
              ┌────────────────────────────────────────┐          │
              │ Editable Sections                      │          │
              │  - Masthead (Applicant & Target Card)  │          │
              │  - RecipientLedger (Requisition Data)  │          │
              │  - StatementSection (Prose Content)    │          │
              │  - TelemetrySection (3 Metric Cards)   │          │
              │  - TaxonomySection (Tri-Column Matrix) │          │
              │  - SignoffFooter (SVG QR + Valediction)│          │
              └────────────────────────────────────────┘          │
                                      │                           │
                                      ▼                           ▼
                        ┌───────────────────────────────────────────┐
                        │        pdfExport.ts Engine                │
                        │ 1. DOM Clone & OKLCH/RGB Sanitization     │
                        │ 2. html2canvas High-DPI Raster Pass       │
                        │ 3. TreeWalker Range Text-Bounding Extract │
                        │ 4. jsPDF Vector Link & ATS Text Overlay   │
                        │ 5. Monolithic Folio or Sliced A4/Letter   │
                        └───────────────────────────────────────────┘
```

The system operates entirely client-side, persisting data to `localStorage`, rendering rich typography (Serif/Editorial vs. Modern/Sans), offering in-place Markdown editing, zero-API-key LLM harmonization workflows, and compiling documents into dual-layer, ATS-searchable, vector-linked PDFs.

---

## Directory Structure

```
├── .env.example              # Default environment configurations (PORT)
├── .gitignore                # Git exclusions
├── index.html                # Entry HTML, webfont preconnects (Google Fonts)
├── metadata.json             # Application metadata manifest
├── package.json              # Dependencies and run scripts
├── README.md                 # Brief local quickstart guide
├── server.ts                 # Express production server & Vite development middleware
├── tsconfig.json             # TypeScript compiler configuration (bundler resolution, noEmit)
├── vite.config.ts            # Vite configuration with Tailwind CSS v4 & React plugin
└── src/
    ├── App.tsx               # Root orchestration component, global shortcuts, layout bindings
    ├── constants.ts          # Default mock dataset (DEFAULT_DATA)
    ├── index.css             # Tailwind v4 import, custom theme layers, print media rules
    ├── main.tsx              # React 19 root bootstrap
    ├── types.ts              # Core TypeScript data contracts, interfaces, and union types
    ├── components/
    │   ├── AiBridgeModal.tsx     # LLM prompt generator, JSON parser, and snapshot history
    │   ├── DossierQrCode.tsx     # Procedural SVG vector QR generator
    │   ├── EditableText.tsx      # In-place contentEditable element with Markdown toolbar
    │   ├── Masthead.tsx          # Dossier header: applicant metadata, target card capsule
    │   ├── PdfExportModal.tsx    # Print preview artboard, dimension calculator, export studio
    │   ├── RecipientLedger.tsx   # Requisition tabular metadata block
    │   ├── SignoffFooter.tsx     # Signoff block, signature, footer stamp, interactive QR
    │   ├── StatementSection.tsx  # Letter narrative paragraphs with dynamic add/remove
    │   ├── TaxonomySection.tsx   # Tri-column architectural competency matrix
    │   ├── TelemetrySection.tsx  # Verified performance metrics (draw calls, bakes, VRAM)
    │   └── Toolbar.tsx           # Primary command ribbon: presets, themes, palettes, print
    └── utils/
        ├── markdown.ts       # Regex Markdown parser, XSS sanitizer, plain-text formatter
        └── pdfExport.ts      # Dual-layer hybrid raster/vector PDF compilation engine
```

---

## Technical Stack & Runtime Dependencies

| Domain                   | Technology   | Version    | Purpose                                                             |
| :----------------------- | :----------- | :--------- | :------------------------------------------------------------------ |
| **Framework**            | React        | `^19.0.1`  | Concurrent UI rendering and state management                        |
| **Language**             | TypeScript   | `^7.0.2`   | Static typing and structural contract enforcement                   |
| **Bundler / Dev Server** | Vite         | `^8.3.0`   | Development server, HMR, production module bundling                 |
| **Application Server**   | Express      | `^4.21.2`  | Development Vite middleware host and production static file server  |
| **Styling**              | Tailwind CSS | `^4.3.3`   | Modern engine styling using `@tailwindcss/vite`                     |
| **Icons**                | Lucide React | `^0.546.0` | Production vector UI iconography                                    |
| **PDF Generation**       | jsPDF        | `^4.2.1`   | Native PDF layout, metadata, link annotations, invisible text layer |
| **DOM Rasterization**    | html2canvas  | `^1.4.1`   | Pixel-accurate DOM tree rendering to canvas                         |
| **QR Engine**            | qrcode       | `^1.5.4`   | Deterministic matrix generation for dynamic SVG QR rendering        |

---

## Canonical Data Schema (`src/types.ts`)

The document state is modeled under the `DossierData` interface. Modifying, serializing, or restoring dossier configurations must strictly conform to this schema:

```typescript
export type TypographyStyle = "editorial" | "modern";
export type ThemePalette = "" | "theme-amber" | "theme-cobalt" | "theme-emerald" | "theme-slate";
export type ViewPreset = "editorial" | "technical" | "executive";

export type ExportDocumentFormat = "digital-folio" | "a4" | "letter";
export type ExportPaginationMode = "continuous" | "multi-page" | "fit-single";
export type ExportQuality = "standard" | "high" | "ultra";
export type ExportThemeMode = "current" | "force-light";

export interface VisibilitySettings {
  headerKicker: boolean;
  targetCard: boolean;
  availabilityBadge: boolean;
  recipientBlock: boolean;
  metrics: boolean;
  taxonomy: boolean;
  signoffMeta: boolean;
  footerStamp: boolean;
}

export interface ApplicantInfo {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  artstation: string;
  website: string;
  dossierKicker?: string;
  qrUrl?: string;
}

export interface TargetInfo {
  recipientTitle: string;
  studio: string;
  role: string;
  department: string;
  date: string;
  location: string;
  availability: string;
  cardHeaderLabel?: string;
  cardBadgeLabel?: string;
  statusLabel?: string;
  dateLabel?: string;
  attentionLabel?: string;
  departmentLabel?: string;
  locationLabel?: string;
  studioLabel?: string;
}

export interface LetterParagraph {
  content: string;
}

export interface LetterInfo {
  salutation: string;
  paragraphs: LetterParagraph[];
  sectionNumber?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export interface MetricItem {
  kicker: string;
  val: string;
  label: string;
  narrative: string;
  contextTag: string;
}

export interface TaxonomyItem {
  name: string;
  detail: string;
}

export interface TaxonomyCategory {
  title: string;
  categoryTag: string;
  items: TaxonomyItem[];
}

export interface SignoffInfo {
  valediction: string;
  name: string;
  roleTitle: string;
}

export interface SectionHeaderMeta {
  sectionNumber: string;
  title: string;
  subtitle: string;
}

export interface SignoffMeta {
  recordBadge: string;
  portfolioLabel: string;
  directChannelLabel: string;
  footerSpecNote: string;
  footerPageNote: string;
}

export interface DossierData {
  visibility: VisibilitySettings;
  typographyStyle: TypographyStyle;
  themePalette?: ThemePalette;
  applicant: ApplicantInfo;
  target: TargetInfo;
  letter: LetterInfo;
  metricsHeader?: SectionHeaderMeta;
  metrics: MetricItem[];
  taxonomyHeader?: SectionHeaderMeta;
  taxonomy: TaxonomyCategory[];
  signoff: SignoffInfo;
  signoffMeta?: SignoffMeta;
}
```

---

## Core Subsystems & Operational Mechanics

### 1. In-Place WYSIWYG Editing Engine (`EditableText.tsx` & `markdown.ts`)

The application replaces heavy rich-text frameworks with a lightweight inline `contentEditable` abstraction:

- **Dual Mode Operation:**
  - **Presentation Mode (`isEditing: false`):** Renders standard semantic tags (`<span>`, `<div>`, `<h1>`, `<p>`, `<a>`). When `allowMarkdown: true`, the raw string passes through `parseMarkdown(value)` via `dangerouslySetInnerHTML`.
  - **Edit Mode (`isEditing: true`):** Mounts a raw `contentEditable` element, strips HTML tags to expose underlying Markdown characters, and displays a floating context toolbar for bold (`**`), italic (`*`), inline code (`` ` ``), and hyperlinks (`[label](url)`).
- **Safe HTML & Markdown Sanitization:** `src/utils/markdown.ts` performs HTML character escaping prior to token replacement to prevent arbitrary XSS execution. Unsafe URL protocols (`javascript:`, `data:`, `vbscript:`) are rejected.
- **Keyboard Handling:**
  - `Cmd/Ctrl + B`: Toggles `**bold**`.
  - `Cmd/Ctrl + I`: Toggles `*italic*`.
  - `Cmd/Ctrl + K`: Opens inline link insertion modal.
  - `Cmd/Ctrl + E` / `Cmd/Ctrl + \``: Toggles inline code formatting.
  - `Escape`: Aborts editing and preserves current value.
  - `Enter`: Blurs single-line elements; permits new lines on block containers.

### 2. Dual-Layer Hybrid PDF Export Pipeline (`pdfExport.ts` & `PdfExportModal.tsx`)

Generating client-side PDFs from dynamic DOM elements frequently suffers from font mismatches, layout breakage, missing hyperlink tags, and unselectable raster text. Cover Letter Dossier Studio implements a multi-stage compilation engine:

```
[DOM: #dossier-sheet]
         │
         ▼
[1. Deep Clone & Computed Style Freezing]
   ├── Strip .no-print & #a4-page-guideline
   ├── Freeze computed layout values (boxSizing, margins, padding, flex, grid)
   └── toSafeRgb(): Convert OKLCH, OKLAB, color-mix() into standard sRGB
         │
         ▼
[2. Geometry & Content Metric Pass]
   ├── Set canonical width: 896px
   └── Measure exact content bottom (tight pixel bounding box)
         │
         ▼
[3. Dual Extraction Passes]
   ├── TreeWalker: Collect every text node word + getBoundingClientRect()
   └── Link Scanner: Collect all <a href> bounding boxes
         │
         ▼
[4. html2canvas Rasterization Pass]
   └── High-DPI Canvas render (Scale: 1.5x standard, 2.0x high, 2.8x ultra)
         │
         ▼
[5. jsPDF Compilation Pass]
   ├── Layer A: Render High-DPI Canvas as compressed JPEG background
   ├── Layer B: Inject invisible selectable text at exact word coordinates
   │            pdf.text(word, x, y, { renderingMode: "invisible" })
   └── Layer C: Inject native clickable PDF web annotations
                pdf.link(x, y, w, h, { url })
         │
         ▼
[Generated .pdf Document]
```

#### Color Sanitization Routine (`toSafeRgb`)

`html2canvas` fails when encountering modern CSS Color Module Level 4 notations (`oklch()`, `oklab()`, `color-mix()`). `toSafeRgb()` leverages an in-memory 1×1 HTML canvas rendering context to normalize modern color declarations into standard `rgba()` or hexadecimal values before rasterization:

```typescript
function toSafeRgb(colorStr: string): string {
  // Direct pass-through for existing valid hex/rgb
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(colorStr)) return colorStr;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/i.test(colorStr)) return colorStr;

  // Use canvas context to resolve variable/modern color values
  if (!conversionCanvas) {
    conversionCanvas = document.createElement("canvas");
    conversionCanvas.width = 1;
    conversionCanvas.height = 1;
    conversionCtx = conversionCanvas.getContext("2d", { willReadFrequently: true });
  }
  try {
    if (conversionCtx) {
      conversionCtx.fillStyle = "#000000";
      conversionCtx.fillStyle = colorStr;
      const computed = conversionCtx.fillStyle;
      if (computed && computed !== "#000000") return computed;
    }
  } catch {
    /* Fallback handling */
  }

  return colorStr.includes("oklab") || colorStr.includes("oklch") ? "rgba(0,0,0,0)" : colorStr;
}
```

#### Export Formats & Pagination

- **Digital Folio (`digital-folio`):** The primary output format. Bypasses standard page boundaries entirely by setting custom PDF page dimensions: `[210mm, calculatedHeightMm]`. Creates a single continuous, non-breaking document matching exact content bounds.
- **Standard Paper (`a4` / `letter`):**
  - `fit-single`: Calculates proportional scale factor `Math.min(1, paperHeight / contentHeight)` and downscales the document to guarantee single-sheet output.
  - `multi-page`: Calculates page split seams across the canvas image buffer, creates successive pages via `pdf.addPage()`, slices corresponding canvas data, and correctly offsets OCR text and link coordinates per page.

### 3. Procedural Vector QR Generator (`DossierQrCode.tsx`)

Rather than rendering pixelated bitmaps, `DossierQrCode` generates responsive inline SVGs:

- Encodes destination URL (`applicant.qrUrl` or `applicant.website`) with error correction level `M` using `qrcode`.
- Separates the 7×7 Finder Patterns (top-left, top-right, bottom-left) from standard payload modules.
- Finders are drawn using crisp vector boundaries with nested rounded rectangles.
- Data modules are rendered as rounded sub-rectangles (`rx={0.28}`) matching active accent color styles (`var(--accent-base)`).

### 4. Zero-API LLM Bridge (`AiBridgeModal.tsx`)

The application integrates with external LLMs (Claude 3.7 / 3.5 Sonnet, OpenAI o3 / GPT-4o, Google Gemini, DeepSeek) through an air-gapped schema sync:

- **Outbound Prompt Generation:** Automatically aggregates current document data into a specialized system prompt. Users select one of three scopes:
  1.  _Full Application:_ Requisition + Statement + Metrics + Taxonomy.
  2.  _Statement Only:_ Targets salutation and 3 narrative paragraphs.
  3.  _Metrics & Skills:_ Targets quantitative benchmarks and tri-column taxonomy.
- **Inbound Sanitization & Merging:**
  - Extracts JSON blocks wrapped in ` ```json ... ``` ` or raw text matching `/{.*}/s`.
  - Executes recursive property merging via `deepMerge(dossierData, parsedPayload)` without overwriting critical candidate contact information unless explicitly provided.
- **Automatic Snapshot Archiving:**
  - Saves immutable state snapshots into `localStorage` under `studio_dossier_history_v1` (max 25 entries) before applying updates.
  - Permits instant 1-click rollback or complete configuration export/import via standalone `.json` files.

---

## State Management & Persistence Contracts

State synchronization follows a unidirectional pattern rooted in `App.tsx`:

```
                       ┌─────────────────────────┐
                       │  localStorage Registry  │
                       └────────────┬────────────┘
                                    │ Hydrate on Mount
                                    ▼
                       ┌─────────────────────────┐
                       │    App.tsx Root State   │
                       └────────────┬────────────┘
         ┌──────────────────────────┼─────────────────────────┐
         ▼                          ▼                         ▼
   data: DossierData      isDark: boolean          themePalette: ThemePalette
   (v16 Storage Key)      (v16 Storage Key)        (v16 Storage Key)
         │                          │                         │
         ▼                          ▼                         ▼
updateData(callback)       document.documentElement  document.documentElement
                           classList.toggle('dark')  classList.add(themePalette)
```

### LocalStorage Schema Registry

| Storage Key                    | Type                       | Default Value                   | Description                                     |
| :----------------------------- | :------------------------- | :------------------------------ | :---------------------------------------------- |
| `studio_dossier_data_v16`      | `string` (JSON)            | `DEFAULT_DATA` (`constants.ts`) | Master dossier document schema.                 |
| `studio_dossier_dark_v16`      | `string` ("true"\|"false") | System `prefers-color-scheme`   | Global UI theme mode.                           |
| `studio_dossier_palette_v16`   | `string`                   | `""` (Terracotta)               | Active accent color token (`theme-*`).          |
| `studio_dossier_show_a4_guide` | `string` ("true"\|"false") | `"false"`                       | Visual A4 cutline reference visibility.         |
| `studio_dossier_history_v1`    | `string` (JSON)            | `[]`                            | List of up to 25 historical rollback snapshots. |

---

## Typography & Color Palettes

### Typography Systems

Configured through root classes dynamically injected into `#dossier-sheet`:

- **`dossier-editorial`:**
  - Body / Prose: _Cormorant Garamond_ / _Playfair Display_ (Serif).
  - Leading: `1.82`. Font size: `18px - 19px`.
  - Tone: Executive, literary, high-end production monograph.
- **`dossier-modern`:**
  - Body / Prose: _Plus Jakarta Sans_ (Geometric Sans).
  - Leading: `1.72`. Font size: `15px - 15.5px`.
  - Tone: High-velocity software engineering, systems infrastructure.
- **Monospace Engine (Shared):**
  - _JetBrains Mono_ applied to section indices (`01.`, `02.`), context tags, telemetry numbers, and date fields.

### Palette Token Engine

CSS Variables declared in `src/index.css` define theme colors across light and dark modes:

```css
:root {
  --bg-app: #f4f3ee;
  --bg-sheet: #ffffff;
  --bg-subtle: #f7f6f1;
  --bg-muted: #eceae2;
  --border-sheet: #e2ded4;
  --text-main: #181614;
  --text-body: #2e2b27;
  --text-muted: #666158;
  --text-faint: #969085;
  --accent-base: #c2410c;
  --accent-light: #ea580c;
  --accent-soft: rgba(194, 65, 12, 0.08);
  --accent-border: rgba(194, 65, 12, 0.25);
}

.dark {
  --bg-app: #0b0a09;
  --bg-sheet: #131211;
  --bg-subtle: #1a1918;
  --bg-muted: #242220;
  --border-sheet: #282522;
  --text-main: #f5f4ef;
  --text-body: #d5d1c8;
  --text-muted: #9c978e;
  --text-faint: #68635c;
  --accent-base: #f97316;
  --accent-light: #fb923c;
  --accent-soft: rgba(249, 115, 22, 0.12);
  --accent-border: rgba(249, 115, 22, 0.3);
}
```

#### Accent Theme Matrix

| Theme Identifier | Visual Tone    | Light `--accent-base` | Dark `--accent-base` | Typical Target Industry               |
| :--------------- | :------------- | :-------------------- | :------------------- | :------------------------------------ |
| `""` (Default)   | Terracotta     | `#c2410c`             | `#f97316`            | Game Studios, Creative Tech, VFX      |
| `theme-amber`    | Warm Brass     | `#b45309`             | `#f59e0b`            | Architecture, Traditional Engineering |
| `theme-cobalt`   | Precision Blue | `#2563eb`             | `#60a5fa`            | Engine Systems, Simulation, Robotics  |
| `theme-emerald`  | Systems Green  | `#059669`             | `#34d399`            | Infrastructure, Graphics R&D, Tools   |
| `theme-slate`    | Monochrome     | `#334155`             | `#94a3b8`            | Executive Leadership, Academic R&D    |

---

## Development, Build, & Deployment Workflow

### Prerequisites

- Node.js runtime (`v20.x` or higher) or Bun (`v1.x` or higher)
- NPM, Yarn, PNPM, or Bun package manager

### Installation

```bash
# Clone the repository and install dependencies
bun install
# or: npm install
```

### Local Development

```bash
# Launches Express backend hosting Vite development HMR pipeline
bun run dev
# or: npm run dev
```

The development server boots by default on `http://localhost:3000`.

### Production Build & Execution

```bash
# Type check and build static production assets
bun run build
# or: npm run build

# Start production Express server serving dist/
bun run start
# or: npm run start
```

### Environment Configuration (`.env`)

```ini
# Port binding for server.ts (Defaults to 3000)
PORT=3000
# Disable HMR when running in restricted sandboxed containers
DISABLE_HMR=false
```

---

## Keyboard Control Matrix

| Key Combination       | Scope               | Action                                                                       |
| :-------------------- | :------------------ | :--------------------------------------------------------------------------- |
| `Cmd/Ctrl + P` or `P` | Global              | Toggles between Interactive Edit Mode and Preview Mode                       |
| `Cmd/Ctrl + Enter`    | Global              | Toggles between Interactive Edit Mode and Preview Mode                       |
| `Escape`              | Global              | Dismisses open modals (`AiBridgeModal`, `PdfExportModal`), cancels Edit Mode |
| `Cmd/Ctrl + Enter`    | `PdfExportModal`    | Immediately compiles and triggers PDF download                               |
| `Cmd/Ctrl + B`        | Active Text Element | Toggles Markdown bold tags (`**...**`)                                       |
| `Cmd/Ctrl + I`        | Active Text Element | Toggles Markdown italic tags (`*...*`)                                       |
| `Cmd/Ctrl + K`        | Active Text Element | Opens inline link insertion dialog                                           |
| `Cmd/Ctrl + \``       | Active Text Element | Toggles Markdown inline code tags (`` `...` ``)                              |

---

## Agent Integration & Extension Playbook

This section provides implementation patterns for engineers or AI agents extending this repository.

### Recipe 1: Adding a New Document Section

To register a new dossier section (e.g., `PatentsSection`):

1.  **Define the Schema in `src/types.ts`:**
    ```typescript
    export interface PatentItem {
      id: string;
      title: string;
      grantNumber: string;
      year: string;
    }
    // Add to DossierData
    export interface DossierData {
      // ...
      visibility: VisibilitySettings & { patents?: boolean };
      patents?: PatentItem[];
    }
    ```
2.  **Define Defaults in `src/constants.ts`:**
    ```typescript
    export const DEFAULT_DATA: DossierData = {
      // ...
      visibility: {
        // ...
        patents: true,
      },
      patents: [
        {
          id: "US-001",
          title: "Real-time SIMD Geometry Culling",
          grantNumber: "US9876543B2",
          year: "2025",
        },
      ],
    };
    ```
3.  **Build Component `src/components/PatentsSection.tsx`:**
    Use `EditableText` for in-place text handling and include `.no-print` action buttons wrapped in group hovers for insertion and removal.
4.  **Mount Component in `src/App.tsx`:**
    Add to `#dossier-sheet`, binding updates to `updateData`:
    ```tsx
    {
      data.visibility.patents && (
        <PatentsSection
          patents={data.patents || []}
          disabled={isPreviewMode}
          onUpdate={(newPatents) => updateData((prev) => ({ ...prev, patents: newPatents }))}
        />
      );
    }
    ```
5.  **Expose in Section Visibility Dropdown (`src/components/Toolbar.tsx`):**
    Add a checkbox toggle targeting `visibility.patents`.

### Recipe 2: Modifying PDF Export DPI and Scaling Defaults

Adjust raster parameters in `src/utils/pdfExport.ts`:

```typescript
const scaleMap: Record<string, number> = {
  standard: 1.5, // 150 DPI payload optimized
  high: 2.0, // 220 DPI crisp retina standard
  ultra: 3.2, // Upgraded from 2.8 to 3.2 for publication-grade 300+ DPI
};
```

To adjust margins for physical A4 printing, update `src/index.css`:

```css
@page {
  size: A4 portrait;
  margin: 10mm 12mm 10mm 12mm; /* Calibrated bounding box */
}
```

### Recipe 3: Integrating a Live LLM API Call

To replace manual clipboard pasting with direct API generation inside `src/components/AiBridgeModal.tsx`:

```typescript
const requestDirectLlmStream = async (prompt: string, apiKey: string) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const result = await response.json();
  const rawText = result.content[0].text;
  const parsed = extractAndParseJson(rawText);
  executeApply(parsed);
};
```

---

## Critical Invariants & Anti-Patterns

1.  **Do Not Mutate `#dossier-sheet` Width Away From 896px During PDF Generation:**
    `pdfExport.ts` relies on the canonical 896px width to maintain consistent coordinate mapping when converting pixels to millimeters (`pxToMm = 210 / 896`). Changing the clone width will misalign OCR selectable text layers and vector link annotations.
2.  **Never Use Unsanitized Modern Color Functions Directly on Export Nodes:**
    Any dynamic runtime color assigned via style properties must be processed through `toSafeRgb()`. Unsanitized `oklch()`, `oklab()`, or `color-mix()` declarations will break canvas rasterization in `html2canvas`.
3.  **Always Strip Elements Marked `.no-print` and `[data-pdf-remove]` in Export Passes:**
    Guideline indicators, floating buttons, delete icons, and the Markdown toolbar must remain flagged with `.no-print` to guarantee exclusion from final exported documents and print output.
4.  **Maintain ContentEditable Invariants:**
    Always keep `suppressContentEditableWarning={true}` on components wrapping content-editable blocks to prevent React reconciliation warnings when users make direct DOM edits. Ensure edits write back cleanly through `onChange` during `onBlur` events.
