# Cover Letter Dossier Studio: Architectural Specification & System Manual

## 1. System Overview

Cover Letter Dossier Studio is a client-rendered web application designed to author, calibrate, and compile production-grade executive cover letters and technical dossiers. It caters to senior technical leadership roles (Technical Art Directors, Principal TDs, Lead Rendering Engineers) where standard single-column resume formats fail to communicate pipeline scale, runtime frametime budgets, and procedural system architectures.

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
│  - Spacing   │                      │                  └────────┬─────────┘
│  - Typo / UI │                      ▼                           │
└──────────────┘      ┌────────────────────────────────┐          │
                      │ Interactive Spacing Layer      │          │
                      │  - Canvas Margin Handles (X/Y) │          │
                      │  - Seam Gaps (Indiv / Sync)    │          │
                      │  - Paragraph Drag Strips       │          │
                      └───────────────┬────────────────┘          │
                                      ▼                           │
                      ┌────────────────────────────────┐          │
                      │ Editable Content Sections      │          │
                      │  - Masthead (Candidate Meta)   │          │
                      │  - RecipientLedger (Requisition)│         │
                      │  - StatementSection (Prose)    │          │
                      │  - TelemetrySection (3 Metrics)│          │
                      │  - TaxonomySection (3 Columns) │          │
                      │  - SignoffFooter (QR + Stamp)  │          │
                      └───────────────┬────────────────┘          │
                                      │                           │
                                      ▼                           ▼
                        ┌───────────────────────────────────────────┐
                        │        pdfExport.ts Engine                │
                        │ 1. DOM Clone & OKLCH/RGB Sanitization     │
                        │ 2. html2canvas High-DPI Raster Pass       │
                        │ 3. Exact Buffer Height Cropping (No Gap)  │
                        │ 4. Line-Sorted Text Extraction for Search │
                        │ 5. jsPDF Vector Link & QR Clickable Layer │
                        │ 6. Monolithic Folio or Sliced A4/Letter   │
                        └───────────────────────────────────────────┘
```

The system operates entirely client-side, persisting data to `localStorage`, rendering dual typography systems (Editorial Serif vs. Modern Sans), providing in-place Markdown editing, zero-API-key LLM harmonization workflows, Figma-style interactive canvas spacing, and compiling documents into dual-layer, ATS-searchable, vector-linked PDFs.

---

## 2. Directory Structure

```
├── .env.example                       # Default environment configurations (PORT)
├── .gitignore                         # Git exclusions
├── index.html                         # Pure static entry HTML, optimized web fonts
├── metadata.json                      # Application metadata manifest
├── package.json                       # Dependencies and run scripts (pure static build)
├── README.md                          # Architectural manual and operational guide
├── server.ts                          # Optional local Node/Express development wrapper
├── tsconfig.json                      # TypeScript compiler configuration (bundler resolution, noEmit)
├── vite.config.ts                     # Vite configuration with Tailwind CSS v4 & React plugin
└── src/
    ├── App.tsx                        # Root orchestrator, global shortcuts, dynamic seam spacing
    ├── constants.ts                   # Master copy dataset (DEFAULT_DATA) & DEFAULT_SPACING
    ├── index.css                      # Tailwind v4 theme tokens, typography modes, print rules
    ├── main.tsx                       # React 19 root bootstrap
    ├── types.ts                       # Core TypeScript data contracts, spacing, and union types
    ├── components/
    │   ├── AiBridgeModal.tsx          # LLM prompt synthesizer, diff preview, rollback history
    │   ├── DossierQrCode.tsx          # Procedural SVG vector QR generator
    │   ├── EditableText.tsx           # In-place contentEditable element with Markdown toolbar
    │   ├── InteractiveSpacingOverlay.tsx # Figma-like canvas padding handles & InterSectionGap
    │   ├── Masthead.tsx               # Header: candidate identity, collapsible target card
    │   ├── PdfExportModal.tsx         # Live miniature preview artboard & PDF compilation studio
    │   ├── RecipientLedger.tsx        # Requisition tabular metadata block
    │   ├── SignoffFooter.tsx          # Valediction, signature block, clickable QR, base stamp
    │   ├── StatementSection.tsx       # Narrative prose with inline draggable paragraph gaps
    │   ├── TaxonomySection.tsx        # Tri-column architectural competency matrix
    │   ├── TelemetrySection.tsx       # Verified performance metrics (draw calls, bakes, VRAM)
    │   └── Toolbar.tsx                # Two-tier command deck: presets, spacing popover, themes
    └── utils/
        ├── markdown.ts                # Regex Markdown parser, XSS sanitizer, plain-text generator
        ├── pdfExport.ts               # Dual-layer hybrid raster/vector PDF compilation engine
        └── schemaValidator.ts         # Defensive validator, type sanitizer, and change diff calculator
```

---

## 3. Technical Stack & Runtime Dependencies

| Domain                   | Technology   | Version    | Purpose                                                             |
| :----------------------- | :----------- | :--------- | :------------------------------------------------------------------ |
| **Framework**            | React        | `^19.0.1`  | Concurrent UI rendering and reactive state management               |
| **Language**             | TypeScript   | `^7.0.2`   | Strict typing and structural contract enforcement                   |
| **Bundler / Dev Server** | Vite         | `^8.3.0`   | Development server, rapid HMR, static production bundling           |
| **Styling**              | Tailwind CSS | `^4.3.3`   | Modern engine styling via `@tailwindcss/vite`                       |
| **Icons**                | Lucide React | `^0.546.0` | Production vector iconography                                       |
| **PDF Generation**       | jsPDF        | `^4.2.1`   | Native PDF layout, metadata, link annotations, invisible text layer |
| **DOM Rasterization**    | html2canvas  | `^1.4.1`   | Pixel-accurate DOM tree rendering to canvas                         |
| **QR Engine**            | qrcode       | `^1.5.4`   | Deterministic matrix generation for dynamic SVG QR rendering        |

---

## 4. Canonical Data Schema (`src/types.ts`)

The document state is modeled under the `DossierData` interface. Modifying, serializing, or restoring dossier configurations conforms to this schema:

```typescript
export type TypographyStyle = "editorial" | "modern";
export type ThemePalette = "" | "theme-amber" | "theme-cobalt" | "theme-emerald" | "theme-slate";
export type ViewPreset = "editorial" | "technical" | "executive";

export type ExportDocumentFormat = "digital-folio" | "a4" | "letter";
export type ExportPaginationMode = "continuous" | "multi-page" | "fit-single";
export type ExportQuality = "standard" | "high" | "ultra";
export type ExportThemeMode = "current" | "force-light";

export interface SpacingSettings {
  sheetPaddingY: number; // Vertical canvas padding (12px - 120px)
  sheetPaddingX: number; // Horizontal canvas padding (16px - 120px)
  sectionGap: number; // Master/default inter-section rhythm (4px - 120px)
  paragraphGap: number; // Spacing between letter paragraphs (6px - 44px)
  customGaps?: Record<string, number>; // Individual seam overrides (px)
}

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
  spacing: SpacingSettings;
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

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  studio: string;
  role: string;
  summary: string;
  data: DossierData;
}
```

---

## 5. Core Subsystems & Operational Mechanics

### A. Figma-Style Interactive Spacing Engine (`InteractiveSpacingOverlay.tsx`)

Spacing in the document is directly editable on the canvas using interactive drag handles and live visual guides:

1. **Canvas Margins (Padding X/Y)**:
   - Hovering near the top, bottom, or sides of the document displays accent-tinted padding guide zones with live pixel metrics (`↕ 44px Top Margin`).
   - Dragging resizes the document canvas margins in real time (unlocked up to `120px`).
2. **Individual Seam Spacing & Master Sync**:
   - Each boundary between visible sections (`header-ledger`, `ledger-statement`, `statement-metrics`, `metrics-taxonomy`, `taxonomy-signoff`, etc.) is an interactive rhythm strip (`InterSectionGap`).
   - **Default Drag**: Adjusts that specific section seam independently without affecting the rest of the letter.
   - **Hold `Ctrl`, `Alt`, or `Cmd`**: Switches to **Master Sync Mode** (`↕ 48px · Sync All Gaps 🔗`). All visible section gaps adjust uniformly.
   - **Hold `Shift`**: Snaps values to `4px` grid increments.
   - **Double-Click**: Resets that specific seam back to the master section rhythm.
3. **Paragraph Flow Gaps**:
   - In `StatementSection.tsx`, hover strips between adjacent paragraphs allow dragging prose separation (`8px` to `36px`).
4. **Structural Layout Invariant**:
   - The spacer elements are real structural layout blocks (`style={{ height: `${gap}px` }}`).
   - The interactive handle lines and badges are tagged with `data-pdf-remove="true"` and `.no-print`. In **Preview Mode** and during **PDF export**, the handles unmount while the exact custom spacing remains intact.

---

### B. Dual-Layer Hybrid PDF Compilation Pipeline (`pdfExport.ts` & `PdfExportModal.tsx`)

```
[DOM: #dossier-sheet]
         │
         ▼
[1. Deep Clone & Style Freezing]
   ├── Strip .no-print & [data-pdf-remove] (handles, editor tools)
   ├── Freeze computed styles (margins, padding, boxSizing, typography)
   └── toSafeRgb(): Normalize OKLCH, OKLAB, color-mix() into standard sRGB
         │
         ▼
[2. Geometry & Content Measurement]
   ├── Lock canonical width: 896px
   └── Calculate tight content bottom (sheetTop to lowest element + paddingBottom)
         │
         ▼
[3. html2canvas High-DPI Raster Pass]
   └── Render canvas at 1.5x (standard), 2.0x (high), or 2.8x (ultra)
         │
         ▼
[4. Exact Canvas Buffer Cropping]
   └── Crop raw canvas to targetCanvasHeight (eliminates blank bottom gap & squishing)
         │
         ▼
[5. jsPDF Assembly & Vector Annotation Injection]
   ├── Layer A: High-DPI cropped JPEG background
   ├── Layer B: Invisible selectable text layer (clustered and sorted by line)
   └── Layer C: Clickable vector web link annotations (URLs + QR Code)
         │
         ▼
[Compiled .pdf Document]
```

#### Key Technical Guarantees:

- **No Blank Bottom Space (Digital Folio)**: Measures the lowest visible element in the clone and sets the folio page dimension to exact content bounds: `[210mm, calculatedHeightMm]`. The canvas buffer is cropped to match this aspect ratio before injection.
- **Selectable, Searchable Text Layer**: Extracted text fragments are clustered by vertical position (line tolerance: `6px`) and sorted left-to-right. Selecting and copying text in Adobe Acrobat or Apple Preview preserves natural word separation with spaces.
- **Clickable Vector Links & QR**: The QR code is wrapped in a semantic `<a>` tag, allowing the link scanner to detect its bounding rect and inject a native clickable PDF link annotation directly over the graphic.

---

### C. AI Studio Assistant (`AiBridgeModal.tsx` & `schemaValidator.ts`)

The AI workflow operates via an air-gapped structured exchange compatible with any provider (ChatGPT, Claude, Gemini, DeepSeek):

1. **Prompt Synthesis**:
   - Generates an optimized, ready-to-use prompt targeted to a specific scope: **Full Dossier**, **Statement Only**, or **Metrics & Taxonomy**.
   - Incorporates the current schema, target studio, target role, and optional user job posting notes.
2. **Defensive Inbound Validation (`schemaValidator.ts`)**:
   - Parses the model's response (extracting JSON blocks from fences or conversational text).
   - Validates every nested structure against `validateAndSanitizeDossierData`.
   - Clamps spacing ranges, validates arrays, and prevents prototype pollution.
3. **Visual Diff Preview**:
   - Displays a summary of verified changes before applying (e.g. `Target Studio: "EA SPORTS FC" · 3 letter paragraphs · 3 benchmark cards`).
4. **Automated Snapshot History**:
   - Automatically archives an immutable snapshot to `localStorage` under `studio_dossier_history_v1` (max 20 entries) prior to applying updates, enabling 1-click rollbacks.

---

### D. Clean Document Canvas & Toolbar Integration

- **Zero Canvas Clutter**: All dashed placeholder buttons (`+ Show Target Card`, `+ Show Recipient Ledger`, `+ Show Benchmarks`, etc.) have been removed. When a section is toggled off, it leaves a clean editorial layout.
- **Sections Menu (`Toolbar.tsx`)**:
  - The toolbar button displays active sections (`Sections 8/8` or an accent badge `Sections 6/8`).
  - Includes a 1-click **"Restore All"** action to bring back all hidden sections simultaneously.
  - Positioned with `relative z-40` and unclipped overflow, ensuring dropdowns open downwards without being cut off or obscured by the `#dossier-sheet` artboard.
- **Spacing Atelier Popover**:
  - Exposes quick rhythm presets (`Compact: 16px`, `Default: 28px`, `Spacious: 48px`), live numeric sliders (up to `120px`), and a **"Relink All"** button if custom individual seams are active.

---

## 6. Typography & Color Palettes

### Typography Systems

Classes injected into `#dossier-sheet` govern the entire type system:

- **`dossier-editorial`**:
  - Body & Prose: _Cormorant Garamond_ (Serif).
  - Leading: `1.82`. Font size: `18px - 19px`.
  - Tone: Refined monograph, executive leadership.
- **`dossier-modern`**:
  - Body & Prose: _Plus Jakarta Sans_ (Geometric Sans).
  - Leading: `1.72`. Font size: `15px - 15.5px`.
  - Tone: Technical systems infrastructure, core engine engineering.
- **Monospace Accents (Shared)**:
  - _JetBrains Mono_ applied to section numbers (`01.`, `02.`), telemetry numbers, date stamps, and technical tags.

### Palette Engine

CSS Variables defined in `src/index.css` adapt dynamically across light and dark modes:

| Theme Token        | Identifier      | Light `--accent-base` | Dark `--accent-base` | Industry Fit                         |
| :----------------- | :-------------- | :-------------------- | :------------------- | :----------------------------------- |
| **Terracotta**     | `""` (Default)  | `#c2410c`             | `#f97316`            | Game Studios, VFX, Creative Tech     |
| **Warm Brass**     | `theme-amber`   | `#b45309`             | `#f59e0b`            | Architecture, Simulation, Industrial |
| **Precision Blue** | `theme-cobalt`  | `#2563eb`             | `#60a5fa`            | Engine Systems, Core Rendering       |
| **Systems Green**  | `theme-emerald` | `#059669`             | `#34d399`            | Pipeline R&D, Tools, Graphics Infra  |
| **Monochrome**     | `theme-slate`   | `#334155`             | `#94a3b8`            | Executive TD, Systems Architecture   |

---

## 7. State Management & Persistence Contracts

State synchronization follows a unidirectional data flow rooted in `App.tsx`:

```
                       ┌─────────────────────────┐
                       │  localStorage Registry  │
                       └────────────┬────────────┘
                                    │ Hydrate & Validate on Mount
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

| Storage Key                    | Type                       | Default Value                   | Description                                          |
| :----------------------------- | :------------------------- | :------------------------------ | :--------------------------------------------------- |
| `studio_dossier_data_v16`      | `string` (JSON)            | `DEFAULT_DATA` (`constants.ts`) | Master dossier document schema (includes `spacing`). |
| `studio_dossier_dark_v16`      | `string` ("true"\|"false") | System `prefers-color-scheme`   | UI dark/light mode preference.                       |
| `studio_dossier_palette_v16`   | `string`                   | `""` (Terracotta)               | Active accent color token (`theme-*`).               |
| `studio_dossier_show_a4_guide` | `string` ("true"\|"false") | `"false"`                       | A4 physical cutline reference guide visibility.      |
| `studio_dossier_history_v1`    | `string` (JSON)            | `[]`                            | Up to 20 historical rollback snapshots.              |

---

## 8. Development, Build, & Static Deployment Workflow

The application is structured as a **pure static Single Page Application (SPA)** ready for direct deployment to Cloudflare Pages, Netlify, Vercel, or GitHub Pages.

### Prerequisites

- Node.js (`v20.x` or higher) or Bun (`v1.x` or higher)

### Commands

```bash
# Install dependencies
bun install
# or: npm install

# Start local Vite development server with HMR
bun run dev
# or: npm run dev

# Run static type-checking and compile production assets
bun run build
# or: npm run build

# Preview static production build locally
bun run preview
# or: npm run preview
```

### Deploying to Cloudflare Pages

1. Connect your Git repository in the Cloudflare Pages dashboard.
2. Configure build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
3. Deploy. The application contains zero Node.js server dependencies in production.

---

## 9. Keyboard Control & Interaction Matrix

| Key Combination                | Scope               | Action                                                                             |
| :----------------------------- | :------------------ | :--------------------------------------------------------------------------------- |
| `Cmd/Ctrl + P` or `P`          | Global              | Toggles between Interactive Edit Mode and Preview Mode                             |
| `Cmd/Ctrl + Enter`             | Global              | Toggles between Interactive Edit Mode and Preview Mode                             |
| `Escape`                       | Global              | Dismisses open modals (`AiBridgeModal`, `PdfExportModal`), exits active field edit |
| `Cmd/Ctrl + Enter`             | `PdfExportModal`    | Immediately compiles and triggers PDF download                                     |
| `Cmd/Ctrl + B`                 | Active Text Element | Toggles Markdown bold formatting (`**...**`)                                       |
| `Cmd/Ctrl + I`                 | Active Text Element | Toggles Markdown italic formatting (`*...*`)                                       |
| `Cmd/Ctrl + K`                 | Active Text Element | Opens inline link insertion dialog                                                 |
| `Cmd/Ctrl + \``                | Active Text Element | Toggles Markdown inline code formatting (`` `...` ``)                              |
| **Pointer Drag**               | Section Gap Strip   | Adjusts that specific section seam individually                                    |
| **Hold `Ctrl` / `Alt` + Drag** | Section Gap Strip   | Switches to **Master Sync Mode** (adjusts all section gaps together)               |
| **Hold `Shift` + Drag**        | Spacing Handle      | Snaps spacing values to `4px` grid increments                                      |
| **Double-Click**               | Spacing Handle      | Resets that specific seam or margin to master default                              |

---

## 10. Critical Invariants

1. **Canonical Width**: `#dossier-sheet` maintains an `896px` max-width bounding box during PDF compilation to guarantee precise pixel-to-millimeter coordinate mapping (`210mm / 896px = 0.234375`).
2. **Structural Spacing vs. UI Decorators**: The `InterSectionGap` container must never be marked `.no-print` or `[data-pdf-remove]`. Only the internal dashed guide lines and pill badges carry `.no-print`. The spacer `<div>` must maintain its structural height in all modes.
3. **Safe RGB Normalization**: Any dynamic color applied to the DOM tree passes through `toSafeRgb()` to prevent `html2canvas` parser failures on CSS Color Level 4 notation (`oklch()`, `oklab()`, `color-mix()`).
4. **Editable Invariants**: Components wrapping editable content must include `suppressContentEditableWarning={true}` and sanitize clipboard paste events to plain text to avoid rich-text DOM style contamination.
