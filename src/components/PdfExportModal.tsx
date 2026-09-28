import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  PdfExportConfig,
  ExportDocumentFormat,
  ExportPaginationMode,
  ExportQuality,
  ExportThemeMode,
  DossierData,
} from "../types.ts";
import { CANONICAL_WIDTH_PX, ExportStage } from "../utils/pdfExport.ts";
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
  Loader2,
  AlertCircle,
} from "lucide-react";

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (
    config: PdfExportConfig,
    onProgress?: (stage: ExportStage) => void,
  ) => Promise<void>;
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
  const [exportStage, setExportStage] = useState<"idle" | ExportStage | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exactContentHeightPx, setExactContentHeightPx] = useState<number>(
    measuredDocHeightPx || 1200,
  );

  const previewMountRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize modal state on open without feedback reset loops
  useEffect(() => {
    if (!isOpen) return;

    setFilename(defaultFilename);
    setErrorMessage(null);
    setExportStage("idle");

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    const prevActive = document.activeElement as HTMLElement | null;
    modalContainerRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
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
  }, [isOpen, defaultFilename, onClose]);

  const pxToMm = 210 / CANONICAL_WIDTH_PX;
  const continuousHeightMm = Math.round(exactContentHeightPx * pxToMm);

  const isA4 = format === "a4";
  const paperHeightMm = isA4 ? 297 : 279.4;
  const paperWidthMm = isA4 ? 210 : 215.9;
  const pageHeightDomPx = Math.round(CANONICAL_WIDTH_PX * (paperHeightMm / paperWidthMm));
  const estimatedPhysicalPages = Math.max(1, Math.ceil(exactContentHeightPx / pageHeightDomPx));

  const PREVIEW_CONTAINER_WIDTH = 276;
  const specimenScale = Number((PREVIEW_CONTAINER_WIDTH / CANONICAL_WIDTH_PX).toFixed(4));
  const specimenScaledHeight = Math.round(exactContentHeightPx * specimenScale);
  const cutlineTopScaledPx = Math.round(pageHeightDomPx * specimenScale);

  useEffect(() => {
    if (!isOpen || !sheetElement || !previewMountRef.current) return;

    previewMountRef.current.innerHTML = "";
    const clone = sheetElement.cloneNode(true) as HTMLElement;

    clone.id = "specimen-sheet-clone";
    clone.classList.add("preview-mode");
    clone.classList.remove("no-print");

    // Purge non-printable editor UI
    clone.querySelectorAll(".no-print, [data-pdf-remove]").forEach((el) => el.remove());
    clone.querySelector("#a4-page-guideline")?.remove();
    clone.querySelectorAll("[contenteditable]").forEach((el) => {
      el.removeAttribute("contenteditable");
      el.removeAttribute("tabindex");
    });
    clone.querySelectorAll(".animate-ping, .availability-ping").forEach((el) => el.remove());

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
    clone.style.height = "auto";
    clone.style.minHeight = "0px";
    clone.style.maxHeight = "none";
    clone.style.paddingBottom = "32px";

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

      // Measure the exact footer baseline inside the clean clone to kill trailing whitespace
      const cloneFooter = clone.querySelector("footer");
      if (cloneFooter && cloneFooter instanceof HTMLElement) {
        let offsetTop = 0;
        let curr: HTMLElement | null = cloneFooter;
        while (curr && curr !== clone) {
          offsetTop += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        const preciseHeight = Math.ceil(offsetTop + cloneFooter.offsetHeight + 32);
        if (preciseHeight >= 500 && preciseHeight <= 3500) {
          setExactContentHeightPx(preciseHeight);
          clone.style.height = `${preciseHeight}px`;
          clone.style.overflow = "hidden";
        }
      } else {
        const naturalH = Math.ceil(clone.scrollHeight || 1100);
        setExactContentHeightPx(naturalH);
        clone.style.height = `${naturalH}px`;
      }
    }

    return () => {
      if (mountNode) {
        mountNode.innerHTML = "";
      }
    };
  }, [isOpen, sheetElement, themeMode, isDark, format]);

  const handleSelectFormat = (selectedFormat: ExportDocumentFormat) => {
    setFormat(selectedFormat);
    if (selectedFormat === "digital-folio") {
      setPaginationMode("continuous");
    } else {
      setPaginationMode("fit-single");
    }
  };

  const handleExecute = useCallback(async () => {
    if (exportStage === "preparing" || exportStage === "rendering" || exportStage === "compiling") {
      return;
    }

    setErrorMessage(null);
    setExportStage("preparing");

    const config: PdfExportConfig = {
      format,
      paginationMode,
      quality,
      themeMode,
      embedLinks,
      filename: filename.trim().endsWith(".pdf") ? filename.trim() : `${filename.trim()}.pdf`,
    };

    try {
      await onConfirmExport(config, (stage) => setExportStage(stage));
      setExportStage("success");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PDF generation encountered an error.";
      setErrorMessage(msg);
      setExportStage("error");
    }
  }, [
    exportStage,
    format,
    paginationMode,
    quality,
    themeMode,
    embedLinks,
    filename,
    onConfirmExport,
    onClose,
  ]);

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
    quality === "ultra" ? "~4.1 MB"
    : quality === "high" ? "~2.2 MB"
    : "~1.2 MB";

  const isBusy =
    exportStage === "preparing" || exportStage === "rendering" || exportStage === "compiling";

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-110 flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="atelier-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-(--bg-sheet) border border-(--border-sheet) rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden transition-all my-auto max-h-[92vh] text-xs focus:outline-none"
      >
        <header className="px-6 py-4 border-b border-(--border-sheet) flex items-center justify-between bg-(--bg-subtle)/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-(--accent-base) flex items-center justify-center text-white shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="atelier-modal-title"
                  className="font-bold text-sm text-(--text-main) tracking-tight leading-tight"
                >
                  Studio Export Atelier
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-wider bg-(--bg-sheet) px-2 py-0.5 rounded-full border border-(--border-sheet) text-(--text-muted) font-semibold flex items-center gap-1">
                  <FileCheck2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified 1:1 Engine Active</span>
                </span>
              </div>
              <p className="text-[11px] text-(--text-muted)">
                {applicantName} · Re: {studioName} ({roleName})
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-main) p-2 rounded-xl bg-(--bg-sheet) border border-(--border-sheet) hover:border-(--accent-base) transition-colors cursor-pointer flex items-center justify-center shadow-2xs disabled:opacity-40"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
          <aside className="lg:col-span-5 bg-(--bg-subtle)/90 border-b lg:border-b-0 lg:border-r border-(--border-sheet) p-6 flex flex-col items-center justify-between gap-4 select-none relative">
            <div className="w-full flex items-center justify-between text-[10px] font-mono text-(--text-faint)">
              <span className="inline-flex items-center gap-1.5 font-semibold text-(--text-main) uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Output Specimen
              </span>
              <span className="px-2 py-0.5 rounded-full bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted)">
                {format === "digital-folio" ?
                  "210 mm Width"
                : isA4 ?
                  "A4 Sheet"
                : "US Letter"}
              </span>
            </div>

            <div className="relative w-full flex flex-col items-center justify-center my-auto">
              <div className="mb-2 px-2.5 py-0.5 rounded-full bg-(--bg-sheet) border border-(--border-sheet) text-[10px] font-mono text-(--text-muted) shadow-2xs flex items-center gap-1.5">
                <span className="text-(--accent-base) font-bold">
                  {format === "digital-folio" ?
                    `210 × ${continuousHeightMm} mm`
                  : `${paperWidthMm} × ${paperHeightMm} mm`}
                </span>
                <span className="opacity-40">·</span>
                <span>
                  {format === "digital-folio" ?
                    "Continuous Folio"
                  : paginationMode === "fit-single" ?
                    "1-Page Fit"
                  : `${estimatedPhysicalPages} Physical Pages`}
                </span>
              </div>

              {/* Viewport Frame with Height Bound */}
              <div
                className={`relative w-[276px] rounded-xl shadow-2xl border overflow-hidden transition-all duration-300 ${
                  themeMode === "force-light" ? "bg-white border-zinc-300 shadow-zinc-950/15"
                  : isDark ? "bg-[#131211] border-[#282522] shadow-black/50"
                  : "bg-white border-[#e2ded4] shadow-zinc-950/10"
                }`}
                style={{
                  height:
                    format === "digital-folio" ?
                      Math.min(390, specimenScaledHeight)
                    : Math.min(390, Math.round(pageHeightDomPx * specimenScale)),
                }}
              >
                <div
                  ref={scrollContainerRef}
                  className="w-full h-full overflow-y-auto overflow-x-hidden scrollbar-none relative"
                  style={{
                    backgroundColor:
                      themeMode === "force-light" ? "#ffffff"
                      : isDark ? "#131211"
                      : "#ffffff",
                  }}
                >
                  {/* Height-Locked Wrapper Stops Scrolling At Footer Baseline */}
                  <div
                    style={{
                      width: `${PREVIEW_CONTAINER_WIDTH}px`,
                      height: `${specimenScaledHeight}px`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      ref={previewMountRef}
                      style={{
                        width: `${CANONICAL_WIDTH_PX}px`,
                        height: `${exactContentHeightPx}px`,
                        transform: `scale(${specimenScale})`,
                        transformOrigin: "top left",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                      className="origin-top-left"
                    />
                  </div>

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
                  <div className="absolute bottom-2 inset-x-2 px-2 py-1 rounded-lg bg-(--accent-base) text-white text-center font-mono text-[8.5px] font-bold shadow-md z-30 flex items-center justify-center gap-1.5">
                    <Check className="w-3 h-3 stroke-3" />
                    <span>Calibrated Single-Sheet Compression</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-2 text-center pt-2 border-t border-(--border-sheet) text-[10.5px] font-mono">
              <div className="p-2 rounded-xl bg-(--bg-sheet) border border-(--border-sheet)">
                <div className="text-[9px] text-(--text-faint) uppercase">Format</div>
                <div className="font-semibold text-(--text-main) truncate mt-0.5">
                  {format === "digital-folio" ?
                    "1 Monolithic"
                  : paginationMode === "fit-single" ?
                    "1-Page Fit"
                  : `${estimatedPhysicalPages} Pages`}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-(--bg-sheet) border border-(--border-sheet)">
                <div className="text-[9px] text-(--text-faint) uppercase">Density</div>
                <div className="font-semibold text-(--text-main) mt-0.5">
                  {quality === "ultra" ?
                    "300 DPI"
                  : quality === "high" ?
                    "220 DPI"
                  : "150 DPI"}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-(--bg-sheet) border border-(--border-sheet)">
                <div className="text-[9px] text-(--text-faint) uppercase">Payload</div>
                <div className="font-semibold text-(--accent-base) mt-0.5">
                  {payloadEstimate}
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-7 p-6 space-y-5 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-(--text-faint)">
                <span>1. Delivery Destination</span>
                <span className="text-(--accent-base) font-sans lowercase font-medium">
                  {format === "digital-folio" ? "screen & ats primary" : "paper-calibrated"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectFormat("digital-folio")}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                    format === "digital-folio" ?
                      "bg-(--accent-soft) border-(--accent-base) text-(--text-main) shadow-xs ring-1 ring-(--accent-base)"
                    : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-body) hover:border-(--text-muted)"
                  }`}
                >
                  <div className="flex items-center justify-between w-full pb-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Globe
                        className={`w-4 h-4 ${
                          format === "digital-folio" ?
                            "text-(--accent-base)"
                          : "text-(--text-muted)"
                        }`}
                      />
                      <span>Digital Folio</span>
                    </div>
                    {format === "digital-folio" ?
                      <span className="w-4 h-4 rounded-full bg-(--accent-base) text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    : <span className="text-[9px] font-mono text-(--text-faint) uppercase">
                        Continuous
                      </span>
                    }
                  </div>
                  <p className="text-[11px] text-(--text-muted) leading-relaxed mt-1">
                    Continuous single-sheet PDF. Zero page cuts. Tightly hugs content with no
                    artificial bottom space.
                  </p>
                  <div className="mt-2.5 text-[9.5px] font-mono text-(--text-faint) flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Exact Height ({continuousHeightMm} mm)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectFormat("a4")}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between relative ${
                    format !== "digital-folio" ?
                      "bg-(--accent-soft) border-(--accent-base) text-(--text-main) shadow-xs ring-1 ring-(--accent-base)"
                    : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-body) hover:border-(--text-muted)"
                  }`}
                >
                  <div className="flex items-center justify-between w-full pb-1">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Printer
                        className={`w-4 h-4 ${
                          format !== "digital-folio" ?
                            "text-(--accent-base)"
                          : "text-(--text-muted)"
                        }`}
                      />
                      <span>Standard Paper</span>
                    </div>
                    {format !== "digital-folio" ?
                      <span className="w-4 h-4 rounded-full bg-(--accent-base) text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-3" />
                      </span>
                    : <span className="text-[9px] font-mono text-(--text-faint) uppercase">
                        A4 / Letter
                      </span>
                    }
                  </div>
                  <p className="text-[11px] text-(--text-muted) leading-relaxed mt-1">
                    Calibrated physical paper geometry for desk printing, executive binders, or
                    institutional requirements.
                  </p>
                  <div className="mt-2.5 text-[9.5px] font-mono text-(--text-faint) flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Physical Sheet Sizing</span>
                  </div>
                </button>
              </div>
            </div>

            {format !== "digital-folio" && (
              <div className="p-4 rounded-2xl bg-(--bg-subtle) border border-(--border-sheet) space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-(--text-faint) block mb-1">
                      Paper Standard
                    </label>
                    <div className="flex bg-(--bg-sheet) p-0.5 rounded-xl border border-(--border-sheet)">
                      <button
                        type="button"
                        onClick={() => setFormat("a4")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          format === "a4" ?
                            "bg-(--accent-base) text-white shadow-2xs font-semibold"
                          : "text-(--text-muted) hover:text-(--text-main)"
                        }`}
                      >
                        A4 (210×297)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat("letter")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          format === "letter" ?
                            "bg-(--accent-base) text-white shadow-2xs font-semibold"
                          : "text-(--text-muted) hover:text-(--text-main)"
                        }`}
                      >
                        Letter (8.5×11&quot;)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-(--text-faint) block mb-1">
                      Pagination Logic
                    </label>
                    <div className="flex bg-(--bg-sheet) p-0.5 rounded-xl border border-(--border-sheet)">
                      <button
                        type="button"
                        onClick={() => setPaginationMode("fit-single")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          paginationMode === "fit-single" ?
                            "bg-(--accent-base) text-white shadow-2xs font-semibold"
                          : "text-(--text-muted) hover:text-(--text-main)"
                        }`}
                        title="Scales composition down proportionally to guarantee 1 physical page"
                      >
                        Fit to 1 Page
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaginationMode("multi-page")}
                        className={`flex-1 py-1.5 text-center font-medium text-[11px] rounded-lg transition-all cursor-pointer ${
                          paginationMode === "multi-page" ?
                            "bg-(--accent-base) text-white shadow-2xs font-semibold"
                          : "text-(--text-muted) hover:text-(--text-main)"
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
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-(--text-faint) block">
                  2. Color Palette
                </label>
                <div className="flex bg-(--bg-subtle) p-0.5 rounded-xl border border-(--border-sheet) min-w-0">
                  <button
                    type="button"
                    onClick={() => setThemeMode("current")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      themeMode === "current" ?
                        "bg-(--bg-sheet) text-(--text-main) shadow-2xs font-semibold"
                      : "text-(--text-muted) hover:text-(--text-main)"
                    }`}
                  >
                    {isDark ?
                      <Moon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    : <Palette className="w-3.5 h-3.5 text-(--accent-base) shrink-0" />}
                    <span className="truncate">{isDark ? "Obsidian Dark" : "Editorial"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("force-light")}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg font-medium text-[10.5px] flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      themeMode === "force-light" ?
                        "bg-(--bg-sheet) text-(--text-main) shadow-2xs font-semibold"
                      : "text-(--text-muted) hover:text-(--text-main)"
                    }`}
                    title="Inverts dark backgrounds to pure white paper for printing"
                  >
                    <Sun className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Clean White</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] font-mono uppercase tracking-wider text-(--text-faint) block">
                  3. Raster Density
                </label>
                <div className="flex bg-(--bg-subtle) p-0.5 rounded-xl border border-(--border-sheet)">
                  <button
                    type="button"
                    onClick={() => setQuality("standard")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "standard" ?
                        "bg-(--bg-sheet) text-(--text-main) shadow-2xs font-semibold"
                      : "text-(--text-muted) hover:text-(--text-main)"
                    }`}
                    title="150 DPI. Lightweight payload (~1.2 MB)"
                  >
                    150 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality("high")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "high" ?
                        "bg-(--bg-sheet) text-(--text-main) shadow-2xs font-semibold"
                      : "text-(--text-muted) hover:text-(--text-main)"
                    }`}
                    title="220 DPI. Crisp retina text (~2.2 MB). Recommended."
                  >
                    220 DPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuality("ultra")}
                    className={`flex-1 py-1.5 text-center rounded-lg font-medium text-[10.5px] transition-all cursor-pointer whitespace-nowrap ${
                      quality === "ultra" ?
                        "bg-(--bg-sheet) text-(--text-main) shadow-2xs font-semibold"
                      : "text-(--text-muted) hover:text-(--text-main)"
                    }`}
                    title="300 DPI. Publication-grade clarity (~4.1 MB)"
                  >
                    300 DPI
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-(--bg-subtle) border border-(--border-sheet) space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-3">
                  <div className="font-semibold text-xs text-(--text-main) flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-(--accent-base)" />
                    <span>Embed Clickable Link Annotations</span>
                  </div>
                  <p className="text-[11px] text-(--text-muted)">
                    Generates native PDF web links for portfolio, email, phone, and ArtStation.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={embedLinks}
                  onChange={(e) => setEmbedLinks(e.target.checked)}
                  className="accent-(--accent-base) w-4 h-4 cursor-pointer shrink-0"
                />
              </div>

              <div className="pt-2 border-t border-(--border-sheet) flex items-center gap-2 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-mono">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Dual-layer selectable text enabled</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-(--text-faint)">
                <span>Output Filename</span>
                <button
                  type="button"
                  onClick={() => setFilename(defaultFilename)}
                  className="text-[10px] text-(--accent-base) hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Default</span>
                </button>
              </div>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full px-3.5 py-2 bg-(--bg-sheet) border border-(--border-sheet) rounded-xl font-mono text-xs text-(--text-main) outline-none focus:border-(--accent-base)"
              />
            </div>
          </main>
        </div>

        {/* Footer with immediate tactile feedback */}
        <footer className="px-6 py-3.5 border-t border-(--border-sheet) bg-(--bg-subtle)/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex-1 w-full sm:w-auto">
            {errorMessage ?
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-mono text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            : <div className="text-[11px] font-mono text-(--text-faint) hidden sm:flex items-center gap-2">
                <span className="flex items-center gap-1 text-(--text-muted)">
                  <kbd className="px-1.5 py-0.5 rounded bg-(--bg-sheet) border border-(--border-sheet) text-[10px]">
                    ⌘
                  </kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-(--bg-sheet) border border-(--border-sheet) text-[10px]">
                    Enter
                  </kbd>
                </span>
                <span>to export instantly</span>
              </div>
            }
          </div>

          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isBusy}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-(--border-sheet) bg-(--bg-sheet) hover:bg-(--bg-muted) text-(--text-main) font-medium text-xs cursor-pointer transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={(e) => {
                e.stopPropagation();
                handleExecute();
              }}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-[0.96] ${
                exportStage === "success" ?
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : isBusy ? "bg-(--accent-base) opacity-90 text-white cursor-wait"
                : "bg-(--accent-base) hover:opacity-95 text-white active:bg-(--accent-light)"
              }`}
            >
              {exportStage === "preparing" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Preparing layout...</span>
                </>
              )}
              {exportStage === "rendering" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Rendering canvas...</span>
                </>
              )}
              {exportStage === "compiling" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Compiling PDF document...</span>
                </>
              )}
              {exportStage === "success" && (
                <>
                  <Check className="w-4 h-4 stroke-3 animate-in zoom-in-50" />
                  <span>Downloaded Successfully!</span>
                </>
              )}
              {(exportStage === "idle" || exportStage === "error") && (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {format === "digital-folio" ?
                      "Download Digital Folio PDF"
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
