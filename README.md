# Dossier Studio: Architectural Specification & System Manual

## 1. System Overview

Dossier Studio is a client-rendered web application designed to author, calibrate, and compile production-grade executive technical dossiers and high-impact application folios. It is engineered specifically for senior technical leadership disciplines (Technical Directors, Principal Pipeline TDs, Lead Engine & Rendering Artists) where standard single-column resumes fail to represent runtime frametime budgets, procedural world systems, and low-level engine toolchains.

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
                        │ 4. Line-Clustered Text Layer for ATS      │
                        │ 5. jsPDF Vector Link & QR Clickable Layer │
                        │ 6. Folio / Fit-Single / Multi-Page Slicing│
                        └───────────────────────────────────────────┘
```

The application runs entirely in the browser, persisting document schemas in `localStorage`, offering dual typography engines (Editorial Serif vs. Modern Sans), in-place Markdown formatting with floating micro-toolbars, zero-API-key LLM harmonization workflows, Figma-style interactive canvas spacing, and compiling dual-layer, ATS-searchable, vector-linked PDFs.

---

## 2. Directory Structure

```
├── .gitignore                         # Git exclusions
├── .node-version                      # Pinned Node runtime version (24.21.0)
├── index.html                         # Pure static entry HTML, web font preconnects
├── metadata.json                      # Application metadata manifest
├── package.json                       # Dependencies, scripts, and runtime engines
├── public/                            # Static edge assets & Cloudflare configuration
│   └── _headers                       # Security headers (CSP, HSTS, immutable assets)
├── README.md                          # Architectural manual and operational guide
├── tsconfig.json                      # TypeScript compiler configuration (bundler resolution, noEmit)
├── vite.config.ts                     # Vite configuration with Tailwind CSS v4 & React plugin
└── src/
    ├── App.tsx                        # Root application orchestrator, hotkeys, seam wiring
    ├── constants.ts                   # Master copy dataset (DEFAULT_DATA) & DEFAULT_SPACING
    ├── index.css                      # Tailwind v4 theme tokens, typography modes, print CSS
    ├── main.tsx                       # React 19 root bootstrap
    ├── types.ts                       # Core TypeScript data contracts, spacing, and union types
    ├── hooks/
    │   ├── useDossierData.ts          # State lifecycle, debounced v16 persistence, atomic mutators
    │   ├── useKeyboardShortcuts.ts    # Global shortcuts (P, Cmd+P, Cmd+Enter, Escape)
    │   ├── useSheetMetrics.ts         # ResizeObserver sheet dimension tracking & fit scaling
    │   └── useTheme.ts                # Dual dark/light mode & 5 accent palette synchronizer
    ├── components/
    │   ├── AiBridgeModal.tsx          # LLM prompt synthesizer, diff inspector, rollback history
    │   ├── DossierQrCode.tsx          # Procedural SVG vector QR generator with custom eyes
    │   ├── EditableText.tsx           # In-place contentEditable element with Markdown toolbar
    │   ├── InteractiveSpacingOverlay.tsx # Margin drag handles & InterSectionGap sliders
    │   ├── Masthead.tsx               # Header: candidate identity, collapsible target card
    │   ├── PdfExportModal.tsx         # Live miniature preview artboard & PDF compilation studio
    │   ├── RecipientLedger.tsx        # Requisition tabular metadata block
    │   ├── SignoffFooter.tsx          # Valediction, signature block, clickable QR, base stamp
    │   ├── StatementSection.tsx       # Narrative prose with inline draggable paragraph gaps
    │   ├── TaxonomySection.tsx        # Tri-column architectural competency matrix
    │   ├── TelemetrySection.tsx       # Verified performance metrics (draw calls, bakes, VRAM)
    │   └── Toolbar.tsx                # Two-tier command deck: presets, spacing, themes, modes
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
| **Bundler / Dev Server** | Vite         | `^8.3.0`   | Rapid HMR development server, static production bundling            |
| **Styling**              | Tailwind CSS | `^4.3.3`   | Modern engine styling via `@tailwindcss/vite`                       |
| **Icons**                | Lucide React | `^0.546.0` | Vector iconography across commands and toolbars                     |
| **PDF Generation**       | jsPDF        | `^4.2.1`   | Native PDF layout, metadata, link annotations, invisible text layer |
| **DOM Rasterization**    | html2canvas  | `^1.4.1`   | Pixel-accurate DOM tree rendering to canvas buffer                  |
| **QR Engine**            | qrcode       | `^1.5.4`   | Deterministic matrix generation for dynamic SVG QR rendering        |
| **Hosting Target**        | Static CDN   | Edge       | Cloudflare Pages / Vercel / Netlify static hosting                  |

---

## 4. Core Subsystems & Operational Mechanics

### A. Figma-Style Interactive Spacing Engine (`InteractiveSpacingOverlay.tsx`)

Spacing in the document is directly editable on the canvas using interactive drag handles, sliders, and keyboard controls:

1. **Canvas Margins (Padding X/Y)**:
   - Hovering near the top, bottom, or sides of `#dossier-sheet` renders accent-tinted guide zones with live pixel metrics (`↕ 44px Top Margin`).
   - Supports dragging and keyboard control (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` with `Shift` snapping to 4px).
   - Double-clicking or pressing `Home` resets that margin to `DEFAULT_SPACING`.
2. **Individual Seam Spacing & Master Sync (`InterSectionGap`)**:
   - Each boundary between visible sections (`header-ledger`, `ledger-statement`, `statement-metrics`, `metrics-taxonomy`, `taxonomy-signoff`, etc.) is an interactive rhythm strip.
   - **Default Drag / Arrow**: Adjusts that specific seam independently, writing an override into `spacing.customGaps[seamKey]`.
   - **Master Sync Mode**: Holding `Ctrl`, `Alt`, or `Cmd` switches to uniform synchronization (`↕ 48px · Sync All Gaps 🔗`). All visible section gaps adjust simultaneously, clearing custom overrides.
   - **Shift Snapping**: Holding `Shift` snaps values to `4px` grid increments.
   - **Reset**: Double-clicking or pressing `Home` resets that specific seam back to the master section rhythm.
3. **Paragraph Rhythm Strips (`StatementSection.tsx`)**:
   - Spacing between individual letter paragraphs is adjustable via integrated draggable divider bars with live pixel badges and keyboard access.
4. **Structural Layout Invariant**:
   - Spacer elements are real structural layout blocks (`style={{ height: `${gap}px` }}`).
   - Interactive handle lines and badges are tagged with `data-pdf-remove="true"` and `.no-print`. In **Preview Mode** and during **PDF export**, handles unmount while exact custom spacing remains pixel-identical.

---

### B. Dual-Layer Hybrid PDF Compilation Pipeline (`pdfExport.ts` & `PdfExportModal.tsx`)

```
[DOM: #dossier-sheet]
         │
         ▼
[1. Deep Clone & Style Freezing]
   ├── Strip .no-print & [data-pdf-remove] (handles, toolbar popovers)
   ├── Freeze computed styles (margins, padding, boxSizing, typography)
   └── toSafeRgb(): Normalize OKLCH, OKLAB, color-mix() via canvas sentinel
         │
         ▼
[2. Geometry & Content Measurement]
   ├── Lock canonical width: 896px
   └── Calculate tight content bottom (scoped via element bounding rects)
         │
         ▼
[3. html2canvas High-DPI Raster Pass]
   └── Render canvas at 1.5x (standard: 150 DPI), 2.0x (high: 220 DPI), or 2.8x (ultra: 300 DPI)
         │
         ▼
[4. Exact Canvas Buffer Cropping]
   └── Crop raw canvas to targetCanvasHeight (eliminates bottom whitespace)
         │
         ▼
[5. jsPDF Assembly & Vector Annotation Injection]
   ├── Layer A: High-DPI cropped JPEG background
   ├── Layer B: Invisible selectable text layer (line-clustered with native spaces)
   └── Layer C: Clickable vector web link annotations (URLs + QR Code)
         │
         ▼
[Compiled .pdf Document]
```

#### Compilation Pathways:

1. **Digital Folio (`continuous`)**:
   - Measures the lowest visible element in the clone and sets the folio page dimension to exact content bounds: `[210mm, calculatedHeightMm]`.
   - Canvas buffer is cropped to match this exact aspect ratio before injection, eliminating artificial bottom gaps.
   - Retains full dual-layer selectable text and clickable URL annotations.
2. **Fit-Single (`fit-single`)**:
   - Targets standard physical paper formats (A4: `210 × 297 mm` or US Letter: `215.9 × 279.4 mm`).
   - Dynamically calculates a proportional scale factor: `Math.min(1, paperHeightMm / contentHeightMm)`.
   - Centers content vertically and horizontally, scaling raster graphics, invisible text, and clickable link annotations synchronously to guarantee a single-page output.
3. **Multi-Page (`multi-page`)**:
   - Slices the document vertically at physical page height boundaries (`CANONICAL_WIDTH_PX * (paperHeightMm / paperWidthMm)`).
   - Distributes raster slices across sequential PDF pages and maps invisible text runs and web links to their corresponding page index.
   - The export modal features a live cutline indicator (`✂ Page 1 Cutline (297mm)`) warning when content overflows onto page 2.
4. **Color Engine Normalization**:
   - Modern browser OKLCH/OKLAB colors break `html2canvas`. The pipeline uses an offscreen 1x1 canvas context (`toSafeRgb`) with a sentinel color check to normalize computed styles to standard RGB/RGBA strings prior to rasterization.
   - **Clean White (`force-light`)**: Automatically converts Obsidian dark backgrounds into pure white paper with dark editorial typography for ink-efficient printing.
5. **ATS-Ready Searchable Text Layer**:
   - Uses `doc.createTreeWalker(..., NodeFilter.SHOW_TEXT)` to collect every text node and bounding client rectangle.
   - Clusters words into horizontal lines using a `5px` vertical baseline tolerance and horizontal gap limits (`clusterWordsIntoLines`).
   - Injects invisible text (`{ renderingMode: "invisible" }`) positioned over the raster background, allowing natural highlight, copy-paste, and ATS scanner parsing.

---

### C. In-Place Markdown & Micro-Editor Engine (`EditableText.tsx`)

`EditableText` replaces standard form fields with direct in-place editing:

- **Presentation Mode**: Rendered as semantic DOM elements (`h1`, `h2`, `p`, `span`, `div`, `a`). Renders Markdown formatting safely via `parseMarkdown()`.
- **Edit Mode**: Activated via click or keyboard navigation (`Enter` / `Space`). Sets `contentEditable="true"`.
- **Floating Markdown Toolbar**: When editing prose with `allowMarkdown={true}` and `showMarkdownToolbar={true}`, an absolute floating toolbar provides:
  - **Bold (`**text**`)** — `Ctrl+B` / `Cmd+B`
  - **Italic (`*text*`)** — `Ctrl+I` / `Cmd+I`
  - **Link (`[label](url)`)** — `Ctrl+K` / `Cmd+K` (opens a dedicated display text / URL modal)
  - **Code (`` `code` ``)** — `Ctrl+`` ` / `Cmd+`` `
  - **Markdown Guide** — Quick syntax reference popover
  - **Done** — Commits changes and blurs element
- **XSS Sanitization (`markdown.ts`)**:
  - Escapes HTML entities (`&`, `<`, `>`, `"`, `'`).
  - Strict protocol validation rejecting `javascript:`, `data:`, `vbscript:`, and `file:` schemes.
  - Underscore italic parser respects word boundaries to prevent corrupting shader constants or programming identifiers (e.g. `BUFFER_SIZE_UAV`).

---

### D. AI Studio Assistant & Version Snapshot Engine (`AiBridgeModal.tsx`)

The AI Bridge enables zero-API-key harmonization with any LLM (ChatGPT, Claude, Gemini, DeepSeek):

1. **Structured Prompt Synthesis**:
   - Generates targeted system prompts across three scopes:
     - **Full Dossier**: Complete document tailoring preserving personal contact data.
     - **Statement Prose**: Focuses exclusively on the dossier statement narrative.
     - **Metrics & Skills**: Calibrates the 3 benchmark cards and 3 taxonomy categories.
   - Automatically injects candidate context, target studio, target role, and optional job description text.
2. **Schema Sanitization & Diff Verification**:
   - Ingested JSON payloads are cleaned (stripping markdown code fences or isolating outer braces).
   - Validated against `validateAndSanitizeDossierData` in `schemaValidator.ts`.
   - Displays real-time diff notices indicating verified updates and structural warnings prior to application.
3. **Time-Machine Snapshot History**:
   - Maintains up to 20 local document snapshots in `localStorage` under `studio_dossier_history_v1`.
   - Automatically archives a pre-sync checkpoint before applying AI updates or importing JSON files.
   - Provides one-click restoration to any historical version with relative timestamps.

---

### E. Two-Tier Command Toolbar (`Toolbar.tsx`)

The toolbar is structured into two persistent tiers:

- **Tier 1 (Execution & Mode Deck)**:
  - **Studio Identifier & Status**: Live autosave status indicator.
  - **Mode Switcher**: Toggle between interactive **Edit Mode** and print-accurate **Preview Mode**.
  - **A4 Guide**: Toggle physical 297mm cutline reference overlay.
  - **AI Sync**: Triggers the AI Bridge modal.
  - **Copy Text**: Formats and copies a clean plain-text transcription of the entire dossier to the clipboard.
  - **Print**: Triggers browser native print dialog configured via print CSS.
  - **Export PDF**: Opens the high-DPI export atelier modal.
- **Tier 2 (Formatting & Architecture Controls)**:
  - **Presets**: One-click layout switching:
    - `Complete`: All sections active (Editorial Master).
    - `Technical`: Focuses on technical telemetry and architecture (hides recipient block).
    - `Executive`: Pure narrative focus (hides telemetry benchmarks and taxonomy matrix).
  - **Preview Scale**: Switch between `Fit to Viewport` and `100% Actual Scale`.
  - **Typography Mode**: Switch between `Editorial Serif` (Cormorant Garamond) and `Modern Sans` (Plus Jakarta Sans).
  - **Spacing Popover**: Master section slider, padding sliders, quick rhythm presets (`Compact`, `Default`, `Spacious`), and one-click `Relink All` for custom seams.
  - **Palette Dropdown**: Switch between 5 curated themes (`Terracotta`, `Amber`, `Cobalt`, `Emerald`, `Slate`).
  - **Sections Visibility**: Granular checklist controlling 8 individual document sections with a `Restore All` shortcut.
  - **Dark / Light Toggle**: Instant Obsidian Dark vs. Editorial Light mode switch.

---

## 5. State Synchronization & Persistence Contracts

The application maintains client persistence without requiring an external database:

| Storage Key                    | Type                       | Default Value                   | Description                                                 |
| :----------------------------- | :------------------------- | :------------------------------ | :---------------------------------------------------------- |
| `studio_dossier_data_v16`      | `string` (JSON)            | `DEFAULT_DATA` (`constants.ts`) | Master document schema (applicant, target, prose, spacing). |
| `studio_dossier_dark_v16`      | `string` ("true"\|"false") | System `prefers-color-scheme`   | Active dark mode state.                                     |
| `studio_dossier_palette_v16`   | `string`                   | `""` (Terracotta)               | Active color accent class token.                            |
| `studio_dossier_show_a4_guide` | `string` ("true"\|"false") | `"false"`                       | Visibility state of the A4 cutline overlay.                 |
| `studio_dossier_history_v1`    | `string` (JSON)            | `[]`                            | Up to 20 historical rollback snapshots.                     |

- **Autosave Engine**: Modifications trigger a debounced 300ms persistence pass to `localStorage`.
- **Unload Flush**: A `beforeunload` window event listener flushes pending state synchronously to eliminate data loss on tab close.

---

## 6. Global Keyboard Shortcuts

| Shortcut                       | Context                       | Action                                                    |
| :----------------------------- | :---------------------------- | :-------------------------------------------------------- |
| `P`                            | Global (Not focused in input) | Toggle between **Edit Mode** and **Preview Mode**         |
| `Cmd + P` / `Ctrl + P`         | Global                        | Toggle **Preview Mode**                                   |
| `Cmd + Enter` / `Ctrl + Enter` | Global                        | Toggle **Preview Mode** (or Export in PDF modal)          |
| `Escape`                       | Global                        | Exit **Preview Mode** / Close active modals or popovers   |
| `ArrowUp` / `ArrowDown`        | Drag handles / Sliders        | Increment / Decrement seam or margin spacing              |
| `ArrowLeft` / `ArrowRight`     | Margin handles                | Adjust horizontal margin padding                          |
| `Shift + Drag / Arrow`         | Drag handles / Sliders        | Snap spacing adjustments to `4px` increments              |
| `Ctrl / Alt / Cmd + Drag`      | InterSectionGap               | **Master Sync Mode**: Adjusts all section seams uniformly |
| `Double-Click` / `Home`        | Spacing handles               | Reset seam or margin to default spacing                   |
| `Cmd + B` / `Ctrl + B`         | EditableText (Active)         | Toggle bold formatting (`**text**`)                       |
| `Cmd + I` / `Ctrl + I`         | EditableText (Active)         | Toggle italic formatting (`*text*`)                       |
| `Cmd + K` / `Ctrl + K`         | EditableText (Active)         | Open hyperlink dialog                                     |
| `Cmd + ` `/`Ctrl + ` `         | EditableText (Active)         | Toggle inline code formatting (`` `code` ``)              |

---

## 7. Build, Deployment, & Server Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start local Vite development server with HMR
npm run dev
```

### Production Build (Static SPA)

The project compiles to pure static HTML/CSS/JS in the `dist/` directory, compatible with any static hosting platform:

```bash
# Type check and build static production bundle
npm run build

# Preview production build locally
npm run preview
```

### Static Hosting Deployments (Cloudflare Pages, Vercel, Netlify)

1. Link your Git repository.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Set Node Version: Pinned to `24.21.0` in `.node-version`
5. Edge Headers: Static edge security headers (`CSP`, `HSTS`, cache controls) are automatically applied via `public/_headers`.
