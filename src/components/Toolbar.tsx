import React, { useState, useRef, useEffect } from "react";
import {
  ThemePalette,
  TypographyStyle,
  ViewPreset,
  VisibilitySettings,
  SpacingSettings,
} from "../types.ts";
import { DEFAULT_SPACING } from "../constants.ts";
import {
  Sparkles,
  Download,
  Printer,
  Sun,
  Moon,
  Copy,
  Check,
  Type,
  Layers,
  ChevronDown,
  Palette,
  Ruler,
  Eye,
  Pencil,
  Maximize2,
  Minimize2,
  MoveVertical,
  RotateCcw,
  Link2,
  AlertCircle,
} from "lucide-react";

interface ToolbarProps {
  currentPreset: ViewPreset;
  onSelectPreset: (preset: ViewPreset) => void;
  typographyStyle: TypographyStyle;
  onChangeTypography: (style: TypographyStyle) => void;
  themePalette: ThemePalette;
  onChangeThemePalette: (palette: ThemePalette) => void;
  visibility: VisibilitySettings;
  onToggleVisibility: (key: keyof VisibilitySettings) => void;
  onRestoreAllSections: () => void;
  spacing: SpacingSettings;
  onChangeSpacing: (newSpacing: SpacingSettings) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenAiModal: () => void;
  onCopyPlainText: () => void;
  copyFeedback: "copied" | "denied" | "unsupported" | null;
  onOpenExportModal: () => void;
  onPrint: () => void;
  isExportingPdf: boolean;
  showA4Guide: boolean;
  onToggleA4Guide: () => void;
  saveStatus?: string;
  isPreviewMode: boolean;
  onTogglePreview: (preview: boolean) => void;
  previewScale: "actual" | "fit";
  onTogglePreviewScale: (scale: "actual" | "fit") => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPreset,
  onSelectPreset,
  typographyStyle,
  onChangeTypography,
  themePalette,
  onChangeThemePalette,
  visibility,
  onToggleVisibility,
  onRestoreAllSections,
  spacing,
  onChangeSpacing,
  isDark,
  onToggleDark,
  onOpenAiModal,
  onCopyPlainText,
  copyFeedback,
  onOpenExportModal,
  onPrint,
  isExportingPdf,
  showA4Guide,
  onToggleA4Guide,
  saveStatus,
  isPreviewMode,
  onTogglePreview,
  previewScale,
  onTogglePreviewScale,
}) => {
  const [isSectionsMenuOpen, setIsSectionsMenuOpen] = useState(false);
  const [isPaletteMenuOpen, setIsPaletteMenuOpen] = useState(false);
  const [isSpacingMenuOpen, setIsSpacingMenuOpen] = useState(false);

  const sectionsMenuRef = useRef<HTMLDivElement>(null);
  const paletteMenuRef = useRef<HTMLDivElement>(null);
  const spacingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (sectionsMenuRef.current && !sectionsMenuRef.current.contains(target)) {
        setIsSectionsMenuOpen(false);
      }
      if (paletteMenuRef.current && !paletteMenuRef.current.contains(target)) {
        setIsPaletteMenuOpen(false);
      }
      if (spacingMenuRef.current && !spacingMenuRef.current.contains(target)) {
        setIsSpacingMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSectionsMenuOpen(false);
        setIsPaletteMenuOpen(false);
        setIsSpacingMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const palettes: { id: ThemePalette; name: string; lightHex: string; darkHex: string }[] = [
    { id: "", name: "Terracotta", lightHex: "#c2410c", darkHex: "#f97316" },
    { id: "theme-amber", name: "Amber", lightHex: "#b45309", darkHex: "#f59e0b" },
    { id: "theme-cobalt", name: "Cobalt", lightHex: "#2563eb", darkHex: "#60a5fa" },
    { id: "theme-emerald", name: "Emerald", lightHex: "#059669", darkHex: "#34d399" },
    { id: "theme-slate", name: "Slate", lightHex: "#334155", darkHex: "#94a3b8" },
  ];

  const currentPaletteInfo = palettes.find((p) => p.id === themePalette) ?? palettes[0]!;
  const activeColorHex = isDark ? currentPaletteInfo.darkHex : currentPaletteInfo.lightHex;
  const activeSectionsCount = Object.values(visibility).filter(Boolean).length;
  const totalSectionsCount = Object.keys(visibility).length;
  const customGapCount = Object.keys(spacing.customGaps || {}).length;
  const hasHiddenSections = activeSectionsCount < totalSectionsCount;

  return (
    <header
      className="max-w-4xl mx-auto mb-6 no-print relative z-40"
      role="banner"
      aria-label="Toolbar"
    >
      <div className="bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-2xl shadow-xs transition-colors duration-200">
        {/* Tier 1: Action Command Deck */}
        <div className="h-12 px-3 sm:px-4 flex items-center justify-between gap-2 border-b border-[var(--border-sheet)] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-base)] shrink-0 shadow-2xs" />
              <span className="font-bold text-xs tracking-tight text-[var(--text-main)] whitespace-nowrap hidden sm:inline">
                Dossier Studio
              </span>
            </div>

            <span className="w-[1px] h-3.5 bg-[var(--border-subtle)] select-none shrink-0" />

            {/* Mode Switcher */}
            <div className="inline-flex items-center bg-[var(--bg-subtle)] p-0.5 rounded-lg border border-[var(--border-sheet)] shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onTogglePreview(false)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  !isPreviewMode
                    ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
                title="Edit Mode (Esc / P)"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onTogglePreview(true)}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  isPreviewMode
                    ? "bg-[var(--accent-base)] text-white shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--accent-base)]"
                }`}
                title="Preview Mode: WYSIWYG digital view (⌘P / P)"
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
                <span className="text-[9px] font-mono opacity-50 hidden md:inline">⌘P</span>
              </button>
            </div>

            {/* A4 Print Guideline Toggle */}
            <button
              type="button"
              onClick={onToggleA4Guide}
              className={`h-7 px-2 sm:px-2.5 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showA4Guide
                  ? "bg-[var(--accent-soft)] text-[var(--accent-base)] border border-[var(--accent-border)]"
                  : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-transparent"
              }`}
              title="Toggle A4 physical paper cutline reference overlay"
            >
              <Ruler className="w-3 h-3" />
              <span className="hidden md:inline">A4 Guide</span>
            </button>

            {saveStatus && (
              <span className="text-[10.5px] text-[var(--text-faint)] font-mono hidden lg:inline-flex items-center gap-1 select-none whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{saveStatus}</span>
              </span>
            )}
          </div>

          {/* Right Action Group */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isPreviewMode && (
              <button
                type="button"
                onClick={onOpenAiModal}
                className="h-7.5 px-2.5 text-xs font-semibold rounded-lg bg-[var(--accent-soft)] hover:bg-[var(--accent-base)] hover:text-white text-[var(--accent-base)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap border border-[var(--accent-border)] active:scale-[0.98]"
                title="Open AI Prompt & Sync Bridge"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">AI Sync</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCopyPlainText}
              className="h-7.5 px-2.5 text-xs font-medium rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap border border-[var(--border-sheet)] active:scale-[0.98]"
              title="Copy letter text to clipboard"
            >
              {copyFeedback === "copied" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Copied
                  </span>
                </>
              ) : copyFeedback === "denied" ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Clipboard Denied
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[11px] hidden sm:inline">Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="h-7.5 px-2.5 text-xs font-medium rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs whitespace-nowrap border border-[var(--border-sheet)] active:scale-[0.98]"
              title="Browser print dialog"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[11px] hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={onOpenExportModal}
              className="h-7.5 px-3 text-xs font-semibold bg-[var(--accent-base)] hover:opacity-90 active:scale-[0.98] text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs whitespace-nowrap"
              title="Configure and export PDF"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Formatting & Parameter Controls */}
        <div className="h-10 px-3 sm:px-4 bg-[var(--bg-subtle)]/50 rounded-b-2xl flex items-center justify-between gap-2 text-xs overflow-x-auto scrollbar-none">
          {/* Presets & Scale */}
          <div className="flex items-center gap-2 shrink-0">
            <nav className="inline-flex items-center bg-[var(--bg-sheet)] border border-[var(--border-sheet)] p-0.5 rounded-lg text-xs font-medium shadow-2xs">
              <button
                type="button"
                onClick={() => onSelectPreset("editorial")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  currentPreset === "editorial"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                Complete
              </button>
              <button
                type="button"
                onClick={() => onSelectPreset("technical")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  currentPreset === "technical"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                Technical
              </button>
              <button
                type="button"
                onClick={() => onSelectPreset("executive")}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  currentPreset === "executive"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                Executive
              </button>
            </nav>

            {isPreviewMode && (
              <>
                <span className="w-[1px] h-3 bg-[var(--border-subtle)] select-none shrink-0" />
                <div className="inline-flex items-center bg-[var(--bg-sheet)] p-0.5 rounded-lg border border-[var(--border-sheet)] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => onTogglePreviewScale("fit")}
                    className={`h-5 px-1.5 rounded-md text-[10.5px] font-medium transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      previewScale === "fit"
                        ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <Minimize2 className="w-2.5 h-2.5" />
                    <span>Fit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePreviewScale("actual")}
                    className={`h-5 px-1.5 rounded-md text-[10.5px] font-medium transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                      previewScale === "actual"
                        ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    <Maximize2 className="w-2.5 h-2.5" />
                    <span>100%</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Serif / Sans Toggle */}
            <div className="flex items-center bg-[var(--bg-sheet)] border border-[var(--border-sheet)] p-0.5 rounded-lg text-xs shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onChangeTypography("editorial")}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  typographyStyle === "editorial"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
                title="Editorial Serif (Cormorant Garamond)"
              >
                <Type className="w-3 h-3" />
                <span>Serif</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTypography("modern")}
                className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                  typographyStyle === "modern"
                    ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
                title="Modern Sans (Plus Jakarta Sans)"
              >
                <Type className="w-3 h-3" />
                <span>Sans</span>
              </button>
            </div>

            {/* Spacing Popover */}
            {!isPreviewMode && (
              <div className="relative shrink-0" ref={spacingMenuRef}>
                <button
                  type="button"
                  aria-expanded={isSpacingMenuOpen}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setIsSpacingMenuOpen((prev) => !prev);
                    setIsPaletteMenuOpen(false);
                    setIsSectionsMenuOpen(false);
                  }}
                  className={`h-6.5 px-2 rounded-lg border text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap ${
                    isSpacingMenuOpen
                      ? "bg-[var(--accent-soft)] border-[var(--accent-base)] text-[var(--accent-base)] font-semibold"
                      : "bg-[var(--bg-sheet)] border border-[var(--border-sheet)] hover:bg-[var(--bg-muted)] text-[var(--text-main)]"
                  }`}
                  title="Layout & Spacing controls"
                >
                  <MoveVertical className="w-3 h-3 text-[var(--accent-base)]" />
                  <span className="hidden md:inline font-medium">Spacing</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-subtle)] px-1 py-0.2 rounded font-medium">
                    {spacing.sectionGap}px
                  </span>
                  {customGapCount > 0 && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[var(--accent-base)] animate-pulse"
                      title={`${customGapCount} custom individual seams active`}
                    />
                  )}
                  <ChevronDown className="w-2.5 h-2.5 text-[var(--text-faint)]" />
                </button>

                {isSpacingMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 bg-[var(--bg-sheet)] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-3 border border-[var(--border-sheet)] animate-in fade-in zoom-in-95 duration-100"
                    role="dialog"
                    aria-label="Canvas Spacing Control"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                      <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-main)] tracking-wider">
                        Canvas Spacing Control
                      </span>
                      <button
                        type="button"
                        onClick={() => onChangeSpacing({ ...DEFAULT_SPACING })}
                        className="text-[10px] font-mono text-[var(--accent-base)] hover:underline flex items-center gap-1 cursor-pointer"
                        title="Reset all spacing and custom seams to default"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reset All</span>
                      </button>
                    </div>

                    {customGapCount > 0 && (
                      <div className="p-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-[var(--accent-base)] font-medium">
                          {customGapCount} individual seam{customGapCount > 1 ? "s" : ""} unlinked
                        </span>
                        <button
                          type="button"
                          onClick={() => onChangeSpacing({ ...spacing, customGaps: {} })}
                          className="px-2 py-0.5 rounded bg-[var(--accent-base)] text-white text-[9.5px] font-semibold flex items-center gap-1 cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <Link2 className="w-2.5 h-2.5" />
                          <span>Relink All</span>
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono uppercase text-[var(--text-faint)] block">
                        Quick Layout Rhythm
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onChangeSpacing({
                              sheetPaddingY: 28,
                              sheetPaddingX: 36,
                              sectionGap: 16,
                              paragraphGap: 12,
                              customGaps: {},
                            })
                          }
                          className="py-1 px-1.5 rounded-lg border border-[var(--border-sheet)] hover:border-[var(--accent-base)] text-[10.5px] font-medium text-center cursor-pointer transition-colors"
                        >
                          Compact
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeSpacing({
                              sheetPaddingY: 48,
                              sheetPaddingX: 52,
                              sectionGap: 28,
                              paragraphGap: 18,
                              customGaps: {},
                            })
                          }
                          className="py-1 px-1.5 rounded-lg border border-[var(--border-sheet)] hover:border-[var(--accent-base)] text-[10.5px] font-medium text-center cursor-pointer transition-colors"
                        >
                          Default
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onChangeSpacing({
                              sheetPaddingY: 64,
                              sheetPaddingX: 68,
                              sectionGap: 48,
                              paragraphGap: 24,
                              customGaps: {},
                            })
                          }
                          className="py-1 px-1.5 rounded-lg border border-[var(--border-sheet)] hover:border-[var(--accent-base)] text-[10.5px] font-medium text-center cursor-pointer transition-colors"
                        >
                          Spacious
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 font-mono text-[10.5px]">
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Master Section Rhythm</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {spacing.sectionGap}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="120"
                          value={spacing.sectionGap}
                          onChange={(e) =>
                            onChangeSpacing({
                              ...spacing,
                              sectionGap: Number(e.target.value),
                            })
                          }
                          className="w-full accent-[var(--accent-base)] h-1 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Sheet Margin (Y)</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {spacing.sheetPaddingY}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="120"
                          value={spacing.sheetPaddingY}
                          onChange={(e) =>
                            onChangeSpacing({ ...spacing, sheetPaddingY: Number(e.target.value) })
                          }
                          className="w-full accent-[var(--accent-base)] h-1 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Sheet Margin (X)</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {spacing.sheetPaddingX}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="16"
                          max="120"
                          value={spacing.sheetPaddingX}
                          onChange={(e) =>
                            onChangeSpacing({ ...spacing, sheetPaddingX: Number(e.target.value) })
                          }
                          className="w-full accent-[var(--accent-base)] h-1 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[var(--text-muted)]">
                          <span>Paragraph Gap</span>
                          <span className="font-bold text-[var(--text-main)]">
                            {spacing.paragraphGap}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="44"
                          value={spacing.paragraphGap}
                          onChange={(e) =>
                            onChangeSpacing({ ...spacing, paragraphGap: Number(e.target.value) })
                          }
                          className="w-full accent-[var(--accent-base)] h-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Accent Theme Palette Dropdown */}
            <div className="relative shrink-0" ref={paletteMenuRef}>
              <button
                type="button"
                aria-expanded={isPaletteMenuOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setIsPaletteMenuOpen((prev) => !prev);
                  setIsSectionsMenuOpen(false);
                  setIsSpacingMenuOpen(false);
                }}
                className={`h-6.5 px-2 rounded-lg border text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap ${
                  isPaletteMenuOpen
                    ? "bg-[var(--accent-soft)] border-[var(--accent-base)] text-[var(--accent-base)] font-semibold"
                    : "bg-[var(--bg-sheet)] border border-[var(--border-sheet)] hover:bg-[var(--bg-muted)] text-[var(--text-main)]"
                }`}
                title="Theme color palette"
              >
                <Palette className="w-3 h-3 text-[var(--text-muted)]" />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: activeColorHex }}
                />
                <span className="hidden sm:inline font-medium">{currentPaletteInfo.name}</span>
                <ChevronDown className="w-2.5 h-2.5 text-[var(--text-faint)]" />
              </button>

              {isPaletteMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-sheet)] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-0.5 border border-[var(--border-sheet)] animate-in fade-in zoom-in-95 duration-100"
                  role="dialog"
                  aria-label="Theme Color Palette"
                >
                  <div className="px-2 py-1 text-[9.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                    Theme Color Palette
                  </div>
                  {palettes.map((p) => {
                    const isSelected = themePalette === p.id;
                    const hex = isDark ? p.darkHex : p.lightHex;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onChangeThemePalette(p.id);
                          setIsPaletteMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left text-xs ${
                          isSelected
                            ? "bg-[var(--accent-soft)] text-[var(--accent-base)] font-semibold"
                            : "hover:bg-[var(--bg-subtle)] text-[var(--text-main)]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{p.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[var(--accent-base)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sections Visibility Dropdown */}
            <div className="relative shrink-0" ref={sectionsMenuRef}>
              <button
                type="button"
                aria-expanded={isSectionsMenuOpen}
                aria-haspopup="dialog"
                onClick={() => {
                  setIsSectionsMenuOpen((prev) => !prev);
                  setIsPaletteMenuOpen(false);
                  setIsSpacingMenuOpen(false);
                }}
                className={`h-6.5 px-2 rounded-lg border text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap ${
                  isSectionsMenuOpen
                    ? "bg-[var(--accent-soft)] border-[var(--accent-base)] text-[var(--accent-base)] font-semibold"
                    : hasHiddenSections
                    ? "bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-base)]"
                    : "bg-[var(--bg-sheet)] border border-[var(--border-sheet)] hover:bg-[var(--bg-muted)] text-[var(--text-main)]"
                }`}
                title="Configure visible sections"
              >
                <Layers className="w-3 h-3 text-[var(--text-muted)]" />
                <span className="hidden sm:inline">Sections</span>
                <span
                  className={`font-mono text-[10px] px-1 py-0.2 rounded font-medium ${
                    hasHiddenSections
                      ? "bg-[var(--accent-base)] text-white font-bold"
                      : "text-[var(--text-muted)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  {activeSectionsCount}/{totalSectionsCount}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-[var(--text-faint)]" />
              </button>

              {isSectionsMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-60 bg-[var(--bg-sheet)] rounded-xl shadow-2xl p-2.5 z-50 text-xs space-y-1 border border-[var(--border-sheet)] animate-in fade-in zoom-in-95 duration-100"
                  role="dialog"
                  aria-label="Document Sections Visibility"
                >
                  <div className="px-2 py-0.5 font-mono text-[9px] uppercase text-[var(--text-faint)] flex items-center justify-between">
                    <span>Document Sections</span>
                    {hasHiddenSections && (
                      <button
                        type="button"
                        onClick={onRestoreAllSections}
                        className="text-[9.5px] text-[var(--accent-base)] hover:underline font-semibold cursor-pointer"
                      >
                        Restore All
                      </button>
                    )}
                  </div>
                  {[
                    { key: "headerKicker", label: "Header Kicker" },
                    { key: "targetCard", label: "Target Card" },
                    { key: "recipientBlock", label: "Recipient Ledger" },
                    { key: "metrics", label: "Verified Benchmarks" },
                    { key: "taxonomy", label: "Core Taxonomy" },
                    { key: "availabilityBadge", label: "Notice / Availability" },
                    { key: "signoffMeta", label: "Portfolio QR" },
                    { key: "footerStamp", label: "Footer Stamp" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between px-2 py-1.5 hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer transition-colors select-none"
                    >
                      <span className="text-[var(--text-main)] text-[11px] font-medium">
                        {label}
                      </span>
                      <input
                        type="checkbox"
                        checked={visibility[key as keyof VisibilitySettings]}
                        onChange={() => onToggleVisibility(key as keyof VisibilitySettings)}
                        className="accent-[var(--accent-base)] w-3.5 h-3.5 cursor-pointer rounded"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              onClick={onToggleDark}
              className="h-6.5 w-6.5 rounded-lg bg-[var(--bg-sheet)] border border-[var(--border-sheet)] hover:bg-[var(--bg-muted)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-3 h-3 text-amber-400" />
              ) : (
                <Moon className="w-3 h-3 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};