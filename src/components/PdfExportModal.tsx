import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PdfExportConfig,
  ExportDocumentFormat,
  ExportPaginationMode,
  ExportQuality,
  ExportThemeMode,
  DossierData,
} from "../types.ts";
import { calculateContentTightHeight, CANONICAL_WIDTH_PX } from "../utils/pdfExport.ts";
import {
  Download,
  X,
  Printer,
  Check,
  Globe,
  Sun,
  Moon,
  ExternalLink,
  RotateCcw,
  Palette,
  FileCheck2,
} from "lucide-react";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (config: PdfExportConfig) => Promise<void>;
  sheetElement: HTMLElement | null;
  dossierData: DossierData;
  isDark: boolean;
  measuredDocHeightPx: number;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  sheetElement,
  dossierData,
  isDark,
  measuredDocHeightPx,
}) => {
  const applicantName = dossierData.applicant.name || "Candidate";
  const studioName = dossierData.target.studio || "Studio";
  const roleName = dossierData.target.role || "Dossier";

  const defaultFilename = `Dossier_${applicantName.trim().replace(/[^a-z0-9]/gi, "_")}_${studioName.trim().replace(/[^a-z0-9]/gi, "_")}.pdf`;

  const [format, setFormat] = useState<ExportDocumentFormat>("digital-folio");
  const [paginationMode, setPaginationMode] = useState<ExportPaginationMode>("continuous");
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [themeMode, setThemeMode] = useState<ExportThemeMode>("current");
  const [embedLinks, setEmbedLinks] = useState<boolean>(true);
  const [filename, setFilename] = useState<string>(defaultFilename);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewMountRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setErrorMessage(null);
      setIsExporting(false);

      const prevActive = document.activeElement as HTMLElement | null;
      modalContainerRef.current?.focus();

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (!isExporting) onClose();
          return;
        }

        if (e.key === "Tab" && modalContainerRef.current) {
          const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
        prevActive?.focus();
      };
    }
  }, [isOpen, defaultFilename, isExporting, onClose]);

  const pxToMm = 210 / CANONICAL_WIDTH_PX;
  const calculatedTightHeightPx = sheetElement
    ? calculateContentTightHeight(sheetElement)
    : measuredDocHeightPx || 800;
  const continuousHeightMm = Math.round(calculatedTightHeightPx * pxToMm);

  const isA4 = format === "a4";
  const paperHeightMm = isA4 ? 297 : 279.4;
  const paperWidthMm = isA4 ? 210 : 215.9;
  const pageHeightDomPx = Math.round(CANONICAL_WIDTH_PX * (paperHeightMm / paperWidthMm));
  const estimatedPhysicalPages = Math.max(1, Math.ceil(calculatedTightHeightPx / pageHeightDomPx));

  useEffect(() => {
    if (!isOpen || !sheetElement || !previewMountRef.current) return;

    previewMountRef.current.innerHTML = "";
    const clone = sheetElement.cloneNode(true) as HTMLElement;

    clone.id = "specimen-sheet-clone";
    clone.classList.add("preview-mode");
    clone.classList.remove("no-print");

    clone.querySelectorAll(".no-print, [data-pdf-remove]").forEach((el) => el.remove());
    clone.querySelector("#a4-page-guideline")?.remove();
    clone.querySelectorAll("[contenteditable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("tabindex");
    });

    clone.style.width = `${CANONICAL_WIDTH_PX}px`;
    clone.style.maxWidth = `${CANONICAL_WIDTH_PX}px`;
    clone.style.minWidth = `${CANONICAL_WIDTH_PX}px`;
    clone.style.transform = "none";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.borderRadius = "0px";
    clone.style.border = "none";
    clone.style.pointerEvents = "none";
    clone.style.userSelect = "none";

    if (format === "digital-folio") {
      clone.style.height = `${calculatedTightHeightPx}px`;
      clone.style.minHeight = "0px";
    }

    if (themeMode === "force-light") {
      clone.classList.remove("dark");
      clone.style.backgroundColor = "#ffffff";
      clone.style.color = "#181614";
      clone.querySelectorAll(".dark").forEach((node) => node.classList.remove("dark"));
    } else {
      clone.style.backgroundColor = isDark ? "#131211" : "#ffffff";
    }

    const mountNode = previewMountRef.current;
    if (mountNode) {
      mountNode.appendChild(clone);
    }

    return () => {
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [isOpen, sheetElement, themeMode, isDark, format, calculatedTightHeightPx]);

  const handleSelectFormat = (selectedFormat: ExportDocumentFormat) => {
    setFormat(selectedFormat);
    if (selectedFormat === "digital-folio") {
      setPaginationMode("continuous");
    } else {
      setPaginationMode("fit-single");
    }
  };

  const handleExecute = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setErrorMessage(null);

    const config: PdfExportConfig = {
      format,
      paginationMode,
      quality,
      themeMode,
      embedLinks,
      filename: filename.trim().endsWith(".pdf") ? filename.trim() : `${filename.trim()}.pdf`,
    };

    try {
      await onConfirmExport(config);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF generation encountered an error.";
      setErrorMessage(msg);
      setIsExporting(false);
    }
  }, [isExporting, format, paginationMode, quality, themeMode, embedLinks, filename, onConfirmExport, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleExecute();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleExecute]);

  if (!isOpen) return null;

  const payloadEstimate =
    quality === "ultra" ? "~4.1 MB" : quality === "high" ? "~2.2 MB" : "~1.2 MB";

  const PREVIEW_CONTAINER_WIDTH = 276;
  const specimenScale = Number((PREVIEW_CONTAINER_WIDTH / CANONICAL_WIDTH_PX).toFixed(4));
  const specimenScaledHeight = Math.round(calculatedTightHeightPx * specimenScale);
  const cutlineTopScaledPx = Math.round(pageHeightDomPx * specimenScale);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="atelier-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) onClose();
      }}
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden transition-all my-auto max-h-[92vh] text-xs focus:outline-none"
      >
        <header className="px-6 py-4 border-b border-[var(--border-sheet)] flex items-center justify-between bg-[var(--bg-subtle)]/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-base)] flex items-center justify-center text-white shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="atelier-modal-title"
                  className="font-bold text-sm text-[var(--text-main)] tracking-tight leading-tight"
                >
                  Studio Export Atelier
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-wider bg-[var(--bg-sheet)] px-2 py-0.5 rounded-full border border-[var(--border-sheet)] text-[var(--text-muted)] font-semibold flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Selectable Text Engine Active</span>
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                {applicantName} · Re: {studioName} ({roleName})
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-sheet)] hover:border-[var(--accent-base)] transition-colors cursor-pointer flex items-center justify-center shadow-2xs disabled:opacity-40"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
          <aside className="lg:col-span-5 bg-[var(--bg-subtle)]/90 border-b lg:border-b-0 lg:border-r border-[var(--border-sheet)] p-6 flex flex-col items-center justify-between gap-4 select-none relative">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-[var(--text-faint)]">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-main)] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Output Specimen
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[var(--text-muted)]">
                {format === "digital-folio"
                  ? "210 mm Width"
                  : isA4
                  ? "A4 Sheet"
                  : "US Letter"}
              </span>
            </div>

            <div className="relative w-full flex flex-col items-center justify-center my-auto">
              <div className="mb-2 px-2.5 py-0.5 rounded-full bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[10px] font-mono text-[var(--text-muted)] shadow-2xs flex items-center gap-1.5">
                <span className="text-[var(--accent-base)] font-bold">
                  {format === "digital-folio"
                    ? `210 × ${continuousHeightMm} mm`
                    : `${paperWidthMm} × ${paperHeightMm} mm`}
                </span>
                <span className="opacity-40">·</span>
                <span>
                  {format === "digital-folio"
                    ? "Continuous Folio"
                    : paginationMode === "fit-single"
                    ? "1-Page Fit"
                    : `${estimatedPhysicalPages} Physical Pages`}
                </span>
              </div>

              <div
                className={`relative w-[276px] rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 ${
                  themeMode === "force-light"
                    ? "bg-white border-zinc-300 shadow-zinc-950/15"
                    : isDark
                    ? "bg-[#131211] border-[#282522] shadow-black/50"
                    : "bg-white border-[#e2ded4] shadow-zinc-950/10"
                }`}
                style={{
                  height:
                    format === "digital-folio"
                      ? Math.min(390, specimenScaledHeight)
                      : Math.min(390, Math.round(pageHeightDomPx * specimenScale)),
                }}
              >
                <div
                  className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-none relative"
                  style={{
                    backgroundColor:
                      themeMode === "force-light"
                        ? "#ffffff"
                        : isDark
                        ? "#131211"
                        : "#ffffff",
                  }}
                >
                  <div
                    ref={previewMountRef}
                    style={{
                      width: `${CANONICAL_WIDTH_PX}px`,
                      transform: `scale(${specimenScale})`,
                      transformOrigin: "top left",
                    }}
                    className="origin-top-left"
                  />

                  {format !== "digital-folio" &&
                    paginationMode === "multi-page" &&
                    estimatedPhysicalPages > 1 && (
                      <div
                        className="absolute inset-x-0 border-b-2 border-dashed border-red-500/80 z-20 flex items-center justify-between px-2 bg-red-500/10 py-0.5"
                        style={{ top: `${cutlineTopScaledPx}px` }}
                      >
                        <span className="font-mono text-[7.5px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                          ✂ Page 1 Cutline (297mm)
                        </span>
                        <span className="font-mono text-[7px] text-red-600 dark:text-red-400 font-semibold">
                          Spills to Page 2
                        </span>
                      </div>
                    )}
                </div>

                {format !== "digital-folio" && paginationMode === "fit-single" && (
                  <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-lg bg-[var(--accent-base)] text-white text-center font-mono text-[8.5px] font-bold shadow-md z-30 flex items-center justify-center gap-1.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Calibrated Single-Sheet Compression</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 text-center pt-2 border-t border-[var(--border-sheet)] text-[10.5px] font-mono">
              <div className="p-2 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-sheet)]">
                <div className="text-[9px] text-[var(--text-faint)] uppercase">Format</div>
                <div className="font-semibold text-[var(--text-main)] truncate mt-0.5">
                  {format === "digital-folio"
                    ? "1 Monolithic"
                    : paginationMode === "fit-single"
                    ? "1-Page Fit"
                    : `${estimatedPhysicalPages} Pages`}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-sheet)]">
                <div className="text-[9px] text-[var(--text-faint)] uppercase">Density</div>
                <div className="font-semibold text-[var(--text-main)] mt-0.5">
                  {quality === "ultra"
                    ? "300 DPI"
                    : quality === "high"
                    ? "220 DPI"
                    : "150 DPI"}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[var(--bg-sheet)] border border-[var(--border-sheet)]">
                <div className="text-[9px] text-[var(--text-faint)] uppercase">Payload</div>
                <div className="font-semibold text-[var(--accent-base)] mt-0.5">
                  {payloadEstimate}
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                <span>1. Delivery Destination</span>
                <span className="text-[var(--accent-base)] font-sans lowercase font-medium">
                  {format === "digital-folio" ? "screen & ats primary" : "paper-calibrated"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectFormat("digital-folio")}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                    format === "digital-folio"
                      ? "bg-[var(--accent-soft)] border-[var(--accent-base)] text-[var(--text-main)] shadow-xs ring-1 ring-[var(--accent-base)]"
                      : "bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[var(--text-body)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full pb-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Globe
                        className={`w-4 h-4 ${
                          format === "digital-folio"
                            ? "text-[var(--accent-base)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      />
                      <span>Digital Folio</span>
                    </div>
                    {format === "digital-folio" ? (
                      <span className="w-4 h-4 rounded-full bg-[var(--accent-base)] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[var(--text-faint)] uppercase">
                        Continuous
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                    Continuous single-sheet PDF. Zero page cuts. Tightly hugs content with no artificial bottom space.
                  </p>
                  <div className="mt-2.5 text-[9.5px] font-mono text-[var(--text-faint)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Exact Height ({continuousHeightMm} mm)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFormat("a4")}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                    format !== "digital-folio"
                      ? "bg-[var(--accent-soft)] border-[var(--accent-base)] text-[var(--text-main)] shadow-xs ring-1 ring-[var(--accent-base)]"
                      : "bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[var(--text-body)] hover:border-[var(--text-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full pb-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Printer
                        className={`w-4 h-4 ${
                          format !== "digital-folio"
                            ? "text-[var(--accent-base)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      />
                      <span>Standard Paper</span>
                    </div>
                    {format !== "digital-folio" ? (
                      <span className="w-4 h-4 rounded-full bg-[var(--accent-base)] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[var(--text-faint)] uppercase">
                        A4 / Letter
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">
                    Calibrated physical paper geometry for desk printing, executive binders, or institutional requirements.
                  </p>
                  <div className="mt-2.5 text-[9.5px] font-mono text-[var(--text-faint)] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Physical Sheet Sizing</span>
                  </div>
                </button>
              </div>
            </div>

            {format !== "digital-folio" && (
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-sheet)] space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-faint)] block mb-1">
                      Paper Standard
                    </label>
                    <div className="flex bg-[var(--bg-sheet)] p-0.5 rounded-xl border border-[var(--border-sheet)]">
                      <button
                        type="button"
                        onClick={() => setFormat("a4")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          format === "a4"
                            ? "bg-[var(--accent-base)] text-white shadow-2xs font-semibold"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        A4 (210×297)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat("letter")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          format === "letter"
                            ? "bg-[var(--accent-base)] text-white shadow-2xs font-semibold"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        Letter (8.5×11&quot;)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[var(--text-faint)] block mb-1">
                      Pagination Logic
                    </label>
                    <div className="flex bg-[var(--bg-sheet)] p-0.5 rounded-xl border border-[var(--border-sheet)]">
                      <button
                        type="button"
                        onClick={() => setPaginationMode("fit-single")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          paginationMode === "fit-single"
                            ? "bg-[var(--accent-base)] text-white shadow-2xs font-semibold"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                        title="Scales composition down proportionally to guarantee 1 physical page"
                      >
                        Fit to 1 Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaginationMode("multi-page")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          paginationMode === "multi-page"
                            ? "bg-[var(--accent-base)] text-white shadow-2xs font-semibold"
                            : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                        }`}
                        title="Divides document into sequential pages at exact paper height seams"
                      >
                        Multi-Page
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)] block">
                  2. Color Palette
                </label>
                <div className="flex bg-[var(--bg-subtle)] p-0.5 rounded-xl border border-[var(--border-sheet)] min-w-0">
                  <button
                    type="button"
                    onClick={() => setThemeMode("current")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      themeMode === "current"
                        ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                  >
                    {isDark ? (
                      <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Palette className="w-3.5 h-3.5 text-[var(--accent-base)] shrink-0" />
                    )}
                    <span className="truncate">{isDark ? "Obsidian Dark" : "Editorial"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("force-light")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      themeMode === "force-light"
                        ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                    title="Inverts dark backgrounds to pure white paper for printing"
                  >
                    <Sun className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Clean White</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)] block">
                  3. Raster Density
                </label>
                <div className="flex bg-[var(--bg-subtle)] p-0.5 rounded-xl border border-[var(--border-sheet)]">
                  <button
                    type="button"
                    onClick={() => setQuality("standard")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "standard"
                        ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                    title="150 DPI. Lightweight payload (~1.2 MB)"
                  >
                    150 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality("high")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "high"
                        ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                    title="220 DPI. Crisp retina text (~2.2 MB). Recommended."
                  >
                    220 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality("ultra")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "ultra"
                        ? "bg-[var(--bg-sheet)] text-[var(--text-main)] shadow-2xs font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    }`}
                    title="300 DPI. Publication-grade clarity (~4.1 MB)"
                  >
                    300 DPI
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-sheet)] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-3">
                  <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-base)]" />
                    <span>Embed Clickable Link Annotations</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Generates native PDF web links for portfolio, email, phone, and ArtStation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={embedLinks}
                  onChange={(e) => setEmbedLinks(e.target.checked)}
                  className="accent-[var(--accent-base)] w-4 h-4 cursor-pointer shrink-0"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border-sheet)] flex items-center gap-2 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-mono">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Dual-layer line-clustered text active (ATS &amp; search indexed)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[var(--text-faint)]">
                <span>Output Filename</span>
                <button
                  type="button"
                  onClick={() => setFilename(defaultFilename)}
                  className="text-[10px] text-[var(--accent-base)] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Default</span>
                </button>
              </div>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-xl font-mono text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-base)] focus:ring-1 focus:ring-[var(--accent-base)]"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs">
                {errorMessage}
              </div>
            )}
          </main>
        </div>

        <footer className="px-6 py-3.5 border-t border-[var(--border-sheet)] bg-[var(--bg-subtle)]/70 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-[var(--text-faint)] hidden sm:flex items-center gap-2">
            <span className="flex items-center gap-1 text-[var(--text-muted)]">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[10px]">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-sheet)] border border-[var(--border-sheet)] text-[10px]">
                Enter
              </kbd>
            </span>
            <span>to export instantly</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              disabled={isExporting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-sheet)] bg-[var(--bg-sheet)] hover:bg-[var(--bg-muted)] text-[var(--text-main)] font-medium text-xs cursor-pointer transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleExecute}
              className="px-6 py-2 rounded-xl bg-[var(--accent-base)] hover:opacity-95 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {isExporting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span>Compiling PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {format === "digital-folio"
                      ? "Download Digital Folio PDF"
                      : "Download Print Document PDF"}
                  </span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};