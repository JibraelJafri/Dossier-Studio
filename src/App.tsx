import { useState, useRef, useCallback } from "react";
import {
  PdfExportConfig,
  TypographyStyle,
  ViewPreset,
} from "./types.ts";
import { formatDossierPlainText } from "./utils/markdown.ts";
import { Toolbar } from "./components/Toolbar.tsx";
import { Masthead } from "./components/Masthead.tsx";
import { RecipientLedger } from "./components/RecipientLedger.tsx";
import { StatementSection } from "./components/StatementSection.tsx";
import { TelemetrySection } from "./components/TelemetrySection.tsx";
import { TaxonomySection } from "./components/TaxonomySection.tsx";
import { SignoffFooter } from "./components/SignoffFooter.tsx";
import { AiBridgeModal } from "./components/AiBridgeModal.tsx";
import { PdfExportModal } from "./components/PdfExportModal.tsx";
import {
  InteractiveSpacingOverlay,
  InterSectionGap,
} from "./components/InteractiveSpacingOverlay.tsx";
import { useDossierData } from "./hooks/useDossierData.ts";
import { useTheme } from "./hooks/useTheme.ts";
import { useSheetMetrics } from "./hooks/useSheetMetrics.ts";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.ts";
import { DEFAULT_SPACING } from "./constants.ts";
import { safeStorage } from "./utils/storage.ts";
import { executePdfExport } from "./utils/pdfExport.ts";

export default function App() {
  const {
    data,
    saveStatus,
    updateData,
    updateSpacing,
    updateSeamGap,
    resetSeamGap,
    toggleVisibility,
    restoreAllSections,
    resetToDefaults,
  } = useDossierData();

  const { isDark, toggleDark, themePalette, setThemePalette } = useTheme(data.themePalette);

  const [currentPreset, setCurrentPreset] = useState<ViewPreset>("editorial");
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<"actual" | "fit">("actual");

  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<"copied" | "denied" | "unsupported" | null>(null);

  const [showA4Guide, setShowA4Guide] = useState<boolean>(() => {
    const saved = safeStorage.getItem("studio_dossier_show_a4_guide");
    return saved !== null ? saved === "true" : false;
  });

  const sheetRef = useRef<HTMLElement>(null);

  const { sheetDimensions, a4Height, fitScale } = useSheetMetrics(
    sheetRef,
    [data, showA4Guide],
    isPreviewMode,
    previewScale,
  );

  useKeyboardShortcuts({
    isPreviewMode,
    onTogglePreview: setIsPreviewMode,
    isAiModalOpen,
    onCloseAiModal: () => setIsAiModalOpen(false),
    isPdfModalOpen,
    onClosePdfModal: () => setIsPdfModalOpen(false),
  });

  const handleToggleA4Guide = () => {
    setShowA4Guide((prev) => {
      const next = !prev;
      safeStorage.setItem("studio_dossier_show_a4_guide", String(next));
      return next;
    });
  };

  const spacing = data.spacing || DEFAULT_SPACING;

  const getSeamGap = useCallback(
    (seamKey: string) => {
      return spacing.customGaps?.[seamKey] ?? spacing.sectionGap;
    },
    [spacing],
  );

  const handleSelectPreset = (preset: ViewPreset) => {
    setCurrentPreset(preset);
    updateData((prev) => {
      if (preset === "editorial") {
        return {
          ...prev,
          visibility: {
            headerKicker: true,
            targetCard: true,
            availabilityBadge: true,
            recipientBlock: true,
            metrics: true,
            taxonomy: true,
            signoffMeta: true,
            footerStamp: true,
          },
        };
      }
      if (preset === "technical") {
        return {
          ...prev,
          visibility: {
            headerKicker: true,
            targetCard: true,
            availabilityBadge: true,
            recipientBlock: false,
            metrics: true,
            taxonomy: true,
            signoffMeta: true,
            footerStamp: true,
          },
        };
      }
      return {
        ...prev,
        visibility: {
          headerKicker: false,
          targetCard: false,
          availabilityBadge: false,
          recipientBlock: true,
          metrics: false,
          taxonomy: false,
          signoffMeta: true,
          footerStamp: false,
        },
      };
    }, true);
  };

  const handleChangeTypography = (style: TypographyStyle) => {
    updateData(
      (prev) => ({
        ...prev,
        typographyStyle: style,
      }),
      true,
    );
  };

  const handleCopyPlainText = () => {
    const text = formatDossierPlainText(data);
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setCopyFeedback("unsupported");
      setTimeout(() => setCopyFeedback(null), 2500);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback("copied");
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch((err) => {
        console.warn("Clipboard write failed:", err);
        setCopyFeedback("denied");
        setTimeout(() => setCopyFeedback(null), 2500);
      });
  };

  // Dynamic code-split execution: loads jsPDF and html2canvas on-demand inside executePdfExport
  const handleConfirmExport = async (config: PdfExportConfig) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    setIsExportingPdf(true);
    try {
      await executePdfExport({
        sheetElement: sheet,
        config,
        isDark,
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const hasLedger = data.visibility.recipientBlock;
  const hasMetrics = data.visibility.metrics;
  const hasTaxonomy = data.visibility.taxonomy;

  const postStatementSeamKey =
    hasMetrics ? "statement-metrics"
    : hasTaxonomy ? "statement-taxonomy"
    : "statement-signoff";

  const preSignoffSeamKey =
    hasTaxonomy ? "taxonomy-signoff"
    : hasMetrics ? "metrics-signoff"
    : "statement-signoff";

  const activeSectionsCount = Object.values(data.visibility).filter(Boolean).length;
  const hiddenSectionsCount = Object.keys(data.visibility).length - activeSectionsCount;

  return (
    <div
      className={`min-h-screen py-5 sm:py-8 px-3 sm:px-6 transition-colors duration-200 ${
        isPreviewMode ?
          isDark ? "bg-[#0b0a09]"
          : "bg-[#edebe4]"
        : ""
      }`}
    >
      <Toolbar
        currentPreset={currentPreset}
        onSelectPreset={handleSelectPreset}
        typographyStyle={data.typographyStyle || "editorial"}
        onChangeTypography={handleChangeTypography}
        themePalette={themePalette}
        onChangeThemePalette={(palette) => {
          setThemePalette(palette);
          updateData((prev) => ({ ...prev, themePalette: palette }), true);
        }}
        visibility={data.visibility}
        onToggleVisibility={toggleVisibility}
        onRestoreAllSections={restoreAllSections}
        spacing={spacing}
        onChangeSpacing={updateSpacing}
        isDark={isDark}
        onToggleDark={toggleDark}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onCopyPlainText={handleCopyPlainText}
        copyFeedback={copyFeedback}
        onOpenExportModal={() => setIsPdfModalOpen(true)}
        onPrint={() => window.print()}
        isExportingPdf={isExportingPdf}
        showA4Guide={showA4Guide}
        onToggleA4Guide={handleToggleA4Guide}
        saveStatus={saveStatus}
        isPreviewMode={isPreviewMode}
        onTogglePreview={setIsPreviewMode}
        previewScale={previewScale}
        onTogglePreviewScale={setPreviewScale}
      />

      <main
        ref={sheetRef}
        id="dossier-sheet"
        className={`print-sheet relative max-w-4xl mx-auto bg-[var(--bg-sheet)] rounded-2xl transition-all duration-150 ${
          data.typographyStyle === "editorial" ? "dossier-editorial" : "dossier-modern"
        } ${isPreviewMode ? "preview-mode ring-1 ring-black/5 dark:ring-white/10" : ""}`}
        style={{
          paddingTop: `${spacing.sheetPaddingY}px`,
          paddingBottom: `${spacing.sheetPaddingY}px`,
          paddingLeft: `${spacing.sheetPaddingX}px`,
          paddingRight: `${spacing.sheetPaddingX}px`,
          boxShadow:
            isPreviewMode ?
              "0 20px 50px -12px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.05)"
            : "var(--shadow-sheet)",
          transform: isPreviewMode && previewScale === "fit" ? `scale(${fitScale})` : undefined,
          transformOrigin: "top center",
          marginBottom:
            isPreviewMode && previewScale === "fit" ?
              `-${sheetDimensions.height * (1 - fitScale)}px`
            : undefined,
        }}
      >
        <InteractiveSpacingOverlay
          spacing={spacing}
          onChangeSpacing={updateSpacing}
          active={!isPreviewMode}
        />

        {!isPreviewMode && showA4Guide && a4Height > 0 && (
          <div
            className="no-print pointer-events-none absolute left-0 right-0 z-30 transition-all duration-200"
            style={{ top: `${a4Height}px` }}
            id="a4-page-guideline"
          >
            <div className="relative flex items-center justify-between px-2 sm:px-6">
              <div className="h-0 flex-1 border-t-2 border-dashed border-[var(--accent-border)]" />
              <div className="pointer-events-auto mx-2 sm:mx-3 px-3 py-1 rounded-full text-[10.5px] font-mono font-medium shadow-md flex items-center gap-2 whitespace-nowrap bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[var(--text-muted)]">
                <span>✂ Physical Paper Reference (A4: 297mm)</span>
                <span className="opacity-40">·</span>
                <span className="text-[var(--accent-base)]">
                  Digital Folio PDF Exports Continuous
                </span>
              </div>
              <div className="h-0 flex-1 border-t-2 border-dashed border-[var(--accent-border)]" />
            </div>
          </div>
        )}

        {/* 1. MASTHEAD */}
        <Masthead
          applicant={data.applicant}
          target={data.target}
          typographyStyle={data.typographyStyle || "editorial"}
          showHeaderKicker={data.visibility.headerKicker ?? true}
          onToggleHeaderKicker={() => toggleVisibility("headerKicker")}
          showTargetCard={data.visibility.targetCard ?? true}
          onToggleTargetCard={() => toggleVisibility("targetCard")}
          showAvailability={data.visibility.availabilityBadge ?? true}
          onToggleAvailability={() => toggleVisibility("availabilityBadge")}
          onUpdateApplicant={(field, val) =>
            updateData((prev) => ({
              ...prev,
              applicant: { ...prev.applicant, [field]: val },
            }))
          }
          onUpdateTarget={(field, val) =>
            updateData((prev) => ({
              ...prev,
              target: { ...prev.target, [field]: val },
            }))
          }
          disabled={isPreviewMode}
        />

        {/* SEAM 1: Header to Ledger or Header to Statement */}
        {hasLedger ? (
          <>
            <InterSectionGap
              seamKey="header-ledger"
              gap={getSeamGap("header-ledger")}
              onChangeGap={updateSeamGap}
              onResetGap={resetSeamGap}
              isCustom={spacing.customGaps?.["header-ledger"] !== undefined}
              label="Header to Ledger"
              disabled={isPreviewMode}
            />
            <RecipientLedger
              target={data.target}
              typographyStyle={data.typographyStyle || "editorial"}
              onUpdateTarget={(field, val) =>
                updateData((prev) => ({
                  ...prev,
                  target: { ...prev.target, [field]: val },
                }))
              }
              onHide={() => toggleVisibility("recipientBlock")}
              disabled={isPreviewMode}
            />
            <InterSectionGap
              seamKey="ledger-statement"
              gap={getSeamGap("ledger-statement")}
              onChangeGap={updateSeamGap}
              onResetGap={resetSeamGap}
              isCustom={spacing.customGaps?.["ledger-statement"] !== undefined}
              label="Ledger to Statement"
              disabled={isPreviewMode}
            />
          </>
        ) : (
          <InterSectionGap
            seamKey="header-statement"
            gap={getSeamGap("header-statement")}
            onChangeGap={updateSeamGap}
            onResetGap={resetSeamGap}
            isCustom={spacing.customGaps?.["header-statement"] !== undefined}
            label="Header to Statement"
            disabled={isPreviewMode}
          />
        )}

        {/* 2. STATEMENT OF INTENT */}
        <StatementSection
          letter={data.letter}
          typographyStyle={data.typographyStyle || "editorial"}
          paragraphGap={spacing.paragraphGap}
          onChangeParagraphGap={(pGap) => updateSpacing({ ...spacing, paragraphGap: pGap })}
          onUpdateLetterMeta={(field, val) =>
            updateData((prev) => ({
              ...prev,
              letter: { ...prev.letter, [field]: val },
            }))
          }
          onUpdateSalutation={(val) =>
            updateData((prev) => ({
              ...prev,
              letter: { ...prev.letter, salutation: val },
            }))
          }
          onUpdateParagraph={(idx, val) =>
            updateData((prev) => {
              const updated = [...prev.letter.paragraphs];
              updated[idx] = { content: val };
              return {
                ...prev,
                letter: { ...prev.letter, paragraphs: updated },
              };
            })
          }
          onAddParagraph={() =>
            updateData((prev) => ({
              ...prev,
              letter: {
                ...prev.letter,
                paragraphs: [
                  ...prev.letter.paragraphs,
                  { content: "New paragraph highlighting strategic systems contributions..." },
                ],
              },
            }))
          }
          onRemoveParagraph={(idx) =>
            updateData((prev) => {
              if (prev.letter.paragraphs.length <= 1) return prev;
              return {
                ...prev,
                letter: {
                  ...prev.letter,
                  paragraphs: prev.letter.paragraphs.filter((_, i) => i !== idx),
                },
              };
            })
          }
          disabled={isPreviewMode}
        />

        {/* SEAM: POST-STATEMENT */}
        <InterSectionGap
          seamKey={postStatementSeamKey}
          gap={getSeamGap(postStatementSeamKey)}
          onChangeGap={updateSeamGap}
          onResetGap={resetSeamGap}
          isCustom={spacing.customGaps?.[postStatementSeamKey] !== undefined}
          label={
            hasMetrics
              ? "Statement to Metrics"
              : hasTaxonomy
              ? "Statement to Taxonomy"
              : "Statement to Signoff"
          }
          disabled={isPreviewMode}
        />

        {/* 3. VERIFIED BENCHMARKS (Optional) */}
        {hasMetrics && (
          <>
            <TelemetrySection
              headerMeta={data.metricsHeader}
              metrics={data.metrics}
              typographyStyle={data.typographyStyle || "editorial"}
              onUpdateHeaderMeta={(field, val) =>
                updateData((prev) => ({
                  ...prev,
                  metricsHeader: {
                    ...prev.metricsHeader!,
                    [field]: val,
                  },
                }))
              }
              onUpdateMetric={(idx, field, val) =>
                updateData((prev) => {
                  const updated = [...prev.metrics];
                  const item = updated[idx];
                  if (!item) return prev;
                  updated[idx] = { ...item, [field]: val };
                  return { ...prev, metrics: updated };
                })
              }
              onAddMetric={() =>
                updateData((prev) => ({
                  ...prev,
                  metrics: [
                    ...prev.metrics,
                    {
                      kicker: "Memory Optimization",
                      val: "-42%",
                      label: "VRAM Footprint Reduced",
                      narrative:
                        "Restructured virtual texture streaming pools and virtual shadow maps.",
                      contextTag: "Nanite GPU Streaming",
                    },
                  ],
                }))
              }
              onRemoveMetric={(idx) =>
                updateData((prev) => {
                  if (prev.metrics.length <= 1) return prev;
                  return {
                    ...prev,
                    metrics: prev.metrics.filter((_, i) => i !== idx),
                  };
                })
              }
              onHide={() => toggleVisibility("metrics")}
              disabled={isPreviewMode}
            />

            {hasTaxonomy && (
              <InterSectionGap
                seamKey="metrics-taxonomy"
                gap={getSeamGap("metrics-taxonomy")}
                onChangeGap={updateSeamGap}
                onResetGap={resetSeamGap}
                isCustom={spacing.customGaps?.["metrics-taxonomy"] !== undefined}
                label="Metrics to Taxonomy"
                disabled={isPreviewMode}
              />
            )}
          </>
        )}

        {/* 4. CORE TAXONOMY (Optional) */}
        {hasTaxonomy && (
          <>
            <TaxonomySection
              headerMeta={data.taxonomyHeader}
              taxonomy={data.taxonomy}
              typographyStyle={data.typographyStyle || "editorial"}
              onUpdateHeaderMeta={(field, val) =>
                updateData((prev) => ({
                  ...prev,
                  taxonomyHeader: {
                    ...prev.taxonomyHeader!,
                    [field]: val,
                  },
                }))
              }
              onUpdateCategoryTitle={(cIdx, val) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat) return prev;
                  updated[cIdx] = { ...cat, title: val };
                  return { ...prev, taxonomy: updated };
                })
              }
              onUpdateCategoryTag={(cIdx, val) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat) return prev;
                  updated[cIdx] = { ...cat, categoryTag: val };
                  return { ...prev, taxonomy: updated };
                })
              }
              onUpdateItemName={(cIdx, iIdx, val) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat) return prev;
                  const items = [...cat.items];
                  const item = items[iIdx];
                  if (!item) return prev;
                  items[iIdx] = { ...item, name: val };
                  updated[cIdx] = { ...cat, items };
                  return { ...prev, taxonomy: updated };
                })
              }
              onUpdateItemDetail={(cIdx, iIdx, val) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat) return prev;
                  const items = [...cat.items];
                  const item = items[iIdx];
                  if (!item) return prev;
                  items[iIdx] = { ...item, detail: val };
                  updated[cIdx] = { ...cat, items };
                  return { ...prev, taxonomy: updated };
                })
              }
              onAddItem={(cIdx) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat) return prev;
                  const items = [
                    ...cat.items,
                    {
                      name: "Core Engine Subsystem",
                      detail: "Technical specification and profiling",
                    },
                  ];
                  updated[cIdx] = { ...cat, items };
                  return { ...prev, taxonomy: updated };
                })
              }
              onRemoveItem={(cIdx, iIdx) =>
                updateData((prev) => {
                  const updated = [...prev.taxonomy];
                  const cat = updated[cIdx];
                  if (!cat || cat.items.length <= 1) return prev;
                  const items = cat.items.filter((_, i) => i !== iIdx);
                  updated[cIdx] = { ...cat, items };
                  return { ...prev, taxonomy: updated };
                })
              }
              onHide={() => toggleVisibility("taxonomy")}
              disabled={isPreviewMode}
            />

            <InterSectionGap
              seamKey="taxonomy-signoff"
              gap={getSeamGap("taxonomy-signoff")}
              onChangeGap={updateSeamGap}
              onResetGap={resetSeamGap}
              isCustom={spacing.customGaps?.["taxonomy-signoff"] !== undefined}
              label="Taxonomy to Signoff"
              disabled={isPreviewMode}
            />
          </>
        )}

        {/* Fallback seam when taxonomy is hidden but metrics remain */}
        {!hasTaxonomy && hasMetrics && (
          <InterSectionGap
            seamKey={preSignoffSeamKey}
            gap={getSeamGap(preSignoffSeamKey)}
            onChangeGap={updateSeamGap}
            onResetGap={resetSeamGap}
            isCustom={spacing.customGaps?.[preSignoffSeamKey] !== undefined}
            label="Metrics to Signoff"
            disabled={isPreviewMode}
          />
        )}

        {/* 5. SIGNOFF & BASELINE */}
        <SignoffFooter
          signoff={data.signoff}
          signoffMeta={data.signoffMeta}
          applicant={data.applicant}
          typographyStyle={data.typographyStyle || "editorial"}
          showSignoffMeta={data.visibility.signoffMeta ?? true}
          onToggleSignoffMeta={() => toggleVisibility("signoffMeta")}
          showFooterStamp={data.visibility.footerStamp ?? true}
          onToggleFooterStamp={() => toggleVisibility("footerStamp")}
          onUpdateSignoff={(field, val) =>
            updateData((prev) => ({
              ...prev,
              signoff: { ...prev.signoff, [field]: val },
            }))
          }
          onUpdateSignoffMeta={(field, val) =>
            updateData((prev) => ({
              ...prev,
              signoffMeta: {
                ...prev.signoffMeta!,
                [field]: val,
              },
            }))
          }
          onUpdateApplicant={(field, val) =>
            updateData((prev) => ({
              ...prev,
              applicant: { ...prev.applicant, [field]: val },
            }))
          }
          disabled={isPreviewMode}
        />
      </main>

      {!isPreviewMode && (
        <footer className="max-w-4xl mx-auto mt-6 text-center text-xs text-[var(--text-muted)] no-print flex flex-wrap items-center justify-center gap-3">
          <span>Click any text to edit directly</span>
          <span aria-hidden="true">·</span>
          <span>Drag seams individually (hold Ctrl/Alt to sync all)</span>
          {hiddenSectionsCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--accent-base)] font-mono font-medium">
                {hiddenSectionsCount} hidden section{hiddenSectionsCount > 1 ? "s" : ""} (toggle in
                Toolbar)
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="text-[var(--text-faint)] font-mono text-[11px]">{saveStatus}</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={resetToDefaults}
            className="text-[var(--accent-base)] hover:underline cursor-pointer"
          >
            Reset Master Copy
          </button>
        </footer>
      )}

      <AiBridgeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        dossierData={data}
        onApplyData={(newData) => updateData(() => newData, true)}
      />

      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onConfirmExport={handleConfirmExport}
        sheetElement={sheetRef.current}
        dossierData={data}
        isDark={isDark}
        measuredDocHeightPx={sheetDimensions.height}
      />
    </div>
  );
}