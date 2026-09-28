import { PdfExportConfig } from "../types.ts";
import { normalizeUrl } from "./urlPolicy.ts";

export interface ExecutePdfExportArgs {
  sheetElement: HTMLElement;
  config: PdfExportConfig;
  isDark: boolean;
}

interface ExtractedWordItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSizePt: number;
}

export interface ExtractedLineItem {
  text: string;
  xMm: number;
  yMm: number;
  fontSizePt: number;
  yPx: number;
  baselineOffsetPx: number;
}

export interface ExtractedLinkItem {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CANONICAL_WIDTH_PX = 896;

export function calculateContentTightHeight(
  sheetElement: HTMLElement,
  padBottomFallback = 48,
): number {
  const sheetTop = sheetElement.getBoundingClientRect().top;
  let maxBottom = 0;
  const allElements = Array.from(sheetElement.querySelectorAll("*")) as HTMLElement[];

  allElements.forEach((el) => {
    if (
      el.closest(".no-print") ||
      el.closest("[data-pdf-remove]") ||
      el.id === "a4-page-guideline"
    ) {
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    const b = rect.bottom - sheetTop;
    if (b > maxBottom) maxBottom = b;
  });

  const padBottom =
    parseFloat(window.getComputedStyle(sheetElement).paddingBottom || "0") || padBottomFallback;
  return Math.max(600, Math.ceil(maxBottom + padBottom));
}

export function cleanTextForPdf(text: string): string {
  if (!text) return "";
  return text
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u20B9/g, "INR");
}

let conversionCanvas: HTMLCanvasElement | null = null;
let conversionCtx: CanvasRenderingContext2D | null = null;

export function toSafeRgb(colorStr: string): string {
  if (
    !colorStr ||
    colorStr === "transparent" ||
    colorStr === "inherit" ||
    colorStr === "initial" ||
    colorStr === "currentColor"
  ) {
    return colorStr;
  }

  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(colorStr)) return colorStr;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/i.test(colorStr)) return colorStr;

  if (typeof document !== "undefined") {
    if (!conversionCanvas) {
      conversionCanvas = document.createElement("canvas");
      conversionCanvas.width = 1;
      conversionCanvas.height = 1;
      conversionCtx = conversionCanvas.getContext("2d", { willReadFrequently: true });
    }
    if (conversionCtx) {
      try {
        conversionCtx.fillStyle = "#000000";
        conversionCtx.fillStyle = colorStr;
        const computed = conversionCtx.fillStyle;
        if (computed) return computed;
      } catch {
        // Fallback
      }
    }
  }

  return colorStr;
}

function sanitizeClonedColors(root: HTMLElement): void {
  const allElements = [root, ...Array.from(root.querySelectorAll("*"))] as HTMLElement[];

  allElements.forEach((el) => {
    if (el.closest(".no-print") || el.closest("[data-pdf-remove]")) return;

    const computed = window.getComputedStyle(el);

    if (
      computed.color &&
      (computed.color.includes("oklch") || computed.color.includes("color-mix"))
    ) {
      el.style.color = toSafeRgb(computed.color);
    }
    if (
      computed.backgroundColor &&
      (computed.backgroundColor.includes("oklch") || computed.backgroundColor.includes("color-mix"))
    ) {
      el.style.backgroundColor = toSafeRgb(computed.backgroundColor);
    }
    if (
      computed.borderTopColor &&
      (computed.borderTopColor.includes("oklch") || computed.borderTopColor.includes("color-mix"))
    ) {
      el.style.borderTopColor = toSafeRgb(computed.borderTopColor);
    }
    if (
      computed.borderBottomColor &&
      (computed.borderBottomColor.includes("oklch") ||
        computed.borderBottomColor.includes("color-mix"))
    ) {
      el.style.borderBottomColor = toSafeRgb(computed.borderBottomColor);
    }
    if (
      computed.borderLeftColor &&
      (computed.borderLeftColor.includes("oklch") || computed.borderLeftColor.includes("color-mix"))
    ) {
      el.style.borderLeftColor = toSafeRgb(computed.borderLeftColor);
    }
    if (
      computed.borderRightColor &&
      (computed.borderRightColor.includes("oklch") ||
        computed.borderRightColor.includes("color-mix"))
    ) {
      el.style.borderRightColor = toSafeRgb(computed.borderRightColor);
    }
    if (
      computed.outlineColor &&
      (computed.outlineColor.includes("oklch") || computed.outlineColor.includes("color-mix"))
    ) {
      el.style.outlineColor = toSafeRgb(computed.outlineColor);
    }

    if (el instanceof SVGElement) {
      const fill = el.getAttribute("fill");
      if (fill && fill !== "none" && fill === "currentColor") {
        el.setAttribute("fill", toSafeRgb(computed.color));
      }
      const stroke = el.getAttribute("stroke");
      if (stroke && stroke !== "none" && stroke === "currentColor") {
        el.setAttribute("stroke", toSafeRgb(computed.color));
      }
    }
  });
}

function extractOrderedWords(clonedSheet: HTMLElement, doc: Document): ExtractedWordItem[] {
  const items: ExtractedWordItem[] = [];
  const sheetBounds = clonedSheet.getBoundingClientRect();

  const walker = doc.createTreeWalker(clonedSheet, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.textContent || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(".no-print") || parent.closest("[data-pdf-remove]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const range = doc.createRange();
  let node: Node | null;

  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;

    const style = doc.defaultView?.getComputedStyle(parent) || window.getComputedStyle(parent);
    const fontSizePx = parseFloat(style.fontSize) || 16;
    const fontSizePt = Math.max(6, Math.min(72, fontSizePx * 0.75));

    const text = node.textContent || "";
    const wordRegex = /\S+/g;
    let match: RegExpExecArray | null;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      const start = match.index;
      const end = start + word.length;

      try {
        range.setStart(node, start);
        range.setEnd(node, end);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          items.push({
            text: cleanTextForPdf(word),
            x: rect.left - sheetBounds.left,
            y: rect.top - sheetBounds.top,
            width: rect.width,
            height: rect.height,
            fontSizePt,
          });
        }
      } catch {
        // Range fallback
      }
    }
  }

  return items;
}

export function clusterWordsIntoLines(
  words: ExtractedWordItem[],
  pxToMm: number,
): ExtractedLineItem[] {
  if (words.length === 0) return [];

  const lines: ExtractedLineItem[] = [];
  const firstWord = words[0];
  if (!firstWord) return [];

  let currentGroup: ExtractedWordItem[] = [firstWord];
  const lineTolerance = 5;

  for (let i = 1; i < words.length; i++) {
    const curr = words[i];
    if (!curr) continue;
    const prev = currentGroup[currentGroup.length - 1];
    if (!prev) {
      currentGroup = [curr];
      continue;
    }

    const horizontalGap = curr.x - (prev.x + prev.width);
    const maxPermittedGap = Math.max(28, prev.fontSizePt * 1.8);

    const isSameLineRun =
      Math.abs(curr.y - prev.y) <= lineTolerance &&
      curr.x >= prev.x &&
      horizontalGap >= -2 &&
      horizontalGap <= maxPermittedGap;

    if (isSameLineRun) {
      currentGroup.push(curr);
    } else {
      const first = currentGroup[0];
      if (first) {
        const lineText = currentGroup.map((w) => w.text).join(" ");
        const baselineOffsetPx = first.height * 0.82;
        lines.push({
          text: lineText,
          xMm: first.x * pxToMm,
          yMm: (first.y + baselineOffsetPx) * pxToMm,
          fontSizePt: first.fontSizePt,
          yPx: first.y,
          baselineOffsetPx,
        });
      }
      currentGroup = [curr];
    }
  }

  if (currentGroup.length > 0) {
    const first = currentGroup[0];
    if (first) {
      const lineText = currentGroup.map((w) => w.text).join(" ");
      const baselineOffsetPx = first.height * 0.82;
      lines.push({
        text: lineText,
        xMm: first.x * pxToMm,
        yMm: (first.y + baselineOffsetPx) * pxToMm,
        fontSizePt: first.fontSizePt,
        yPx: first.y,
        baselineOffsetPx,
      });
    }
  }

  return lines;
}

export function sliceLinkToPage(
  link: ExtractedLinkItem,
  pageIdx: number,
  pageHeightDomPx: number,
  pxToMm: number,
): { xMm: number; yMm: number; wMm: number; hMm: number } | null {
  const linkTop = link.y;
  const linkBottom = link.y + link.height;
  const pageStartPx = pageIdx * pageHeightDomPx;
  const pageEndPx = (pageIdx + 1) * pageHeightDomPx;

  if (linkBottom <= pageStartPx || linkTop >= pageEndPx) {
    return null;
  }

  const visibleTopPx = Math.max(linkTop, pageStartPx);
  const visibleBottomPx = Math.min(linkBottom, pageEndPx);
  const visibleHeightPx = visibleBottomPx - visibleTopPx;

  if (visibleHeightPx <= 0) return null;

  return {
    xMm: link.x * pxToMm,
    yMm: (visibleTopPx - pageStartPx) * pxToMm,
    wMm: link.width * pxToMm,
    hMm: visibleHeightPx * pxToMm,
  };
}

export async function executePdfExport({
  sheetElement,
  config,
  isDark,
}: ExecutePdfExportArgs): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    }
  } catch (e) {
    console.warn("Font pre-flight check bypassed:", e);
  }

  const isForceLight = config.themeMode === "force-light";
  const effectiveIsDark = isForceLight ? false : isDark;
  const sheetBg = effectiveIsDark ? "#131211" : "#ffffff";

  let capturedWords: ExtractedWordItem[] = [];
  const capturedLinks: ExtractedLinkItem[] = [];
  let calculatedTightHeightPx = 800;

  const scaleMap: Record<string, number> = {
    standard: 1.5,
    high: 2.0,
    ultra: 2.8,
  };
  const renderScale = scaleMap[config.quality] || 2.0;

  const rawCanvas = await html2canvas(sheetElement, {
    scale: renderScale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: sheetBg,
    windowWidth: 1280,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc: Document) => {
      const clonedSheet = clonedDoc.getElementById("dossier-sheet");
      if (!clonedSheet) return;

      // Clean up body in iframe to ensure strict 0 offset rendering
      clonedDoc.body.style.margin = "0";
      clonedDoc.body.style.padding = "0";
      clonedDoc.body.style.backgroundColor = sheetBg;

      Array.from(clonedDoc.body.children).forEach((child) => {
        if (child !== clonedSheet && !child.contains(clonedSheet)) {
          child.remove();
        }
      });

      if (isForceLight) {
        clonedDoc.documentElement.classList.remove("dark");
        clonedDoc.body.classList.remove("dark");
        clonedSheet.classList.remove("dark");
        clonedSheet.querySelectorAll(".dark").forEach((el) => el.classList.remove("dark"));
      }

      // Purge non-printable UI, guide markers, and animation ping layers
      clonedSheet.querySelectorAll("[data-pdf-remove]").forEach((el) => el.remove());
      clonedSheet.querySelectorAll(".no-print").forEach((el) => el.remove());
      clonedSheet
        .querySelectorAll(".availability-ping, .animate-ping")
        .forEach((el) => el.remove());
      clonedSheet.querySelector("#a4-page-guideline")?.remove();
      clonedSheet.querySelectorAll("[contenteditable]").forEach((el) => {
        el.removeAttribute("contenteditable");
        el.removeAttribute("tabindex");
      });

      clonedSheet.classList.add("preview-mode");
      clonedSheet.classList.remove("no-print");

      // Enforce clean canonical dimensions with no transform or margin bleed
      clonedSheet.style.width = `${CANONICAL_WIDTH_PX}px`;
      clonedSheet.style.maxWidth = `${CANONICAL_WIDTH_PX}px`;
      clonedSheet.style.minWidth = `${CANONICAL_WIDTH_PX}px`;
      clonedSheet.style.transform = "none";
      clonedSheet.style.margin = "0 auto";
      clonedSheet.style.boxShadow = "none";
      clonedSheet.style.borderRadius = "0px";
      clonedSheet.style.border = "none";
      clonedSheet.style.backgroundColor = sheetBg;
      clonedSheet.style.minHeight = "0px";
      clonedSheet.style.height = "auto";

      // Sanitize color spaces without touching CSS grid/flex layout
      sanitizeClonedColors(clonedSheet);

      calculatedTightHeightPx = calculateContentTightHeight(clonedSheet);

      if (config.format === "digital-folio") {
        clonedSheet.style.height = `${calculatedTightHeightPx}px`;
        clonedSheet.style.maxHeight = `${calculatedTightHeightPx}px`;
        clonedSheet.style.overflow = "hidden";
      }

      capturedWords = extractOrderedWords(clonedSheet, clonedDoc);

      if (config.embedLinks) {
        const sheetBounds = clonedSheet.getBoundingClientRect();
        clonedSheet.querySelectorAll("a").forEach((anchor) => {
          if (anchor.closest(".no-print") || anchor.closest("[data-pdf-remove]")) return;
          const rawHref = anchor.getAttribute("href");
          const validatedHref = rawHref ? normalizeUrl(rawHref) : null;
          if (!validatedHref) return;

          const rect = anchor.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          capturedLinks.push({
            href: validatedHref,
            x: rect.left - sheetBounds.left,
            y: rect.top - sheetBounds.top,
            width: rect.width,
            height: rect.height,
          });
        });
      }
    },
  });

  if (!rawCanvas || rawCanvas.width === 0 || rawCanvas.height === 0) {
    throw new Error("Canvas rendering produced an empty image buffer.");
  }

  const targetCanvasHeight = Math.max(
    1,
    Math.min(rawCanvas.height, Math.round(calculatedTightHeightPx * renderScale)),
  );
  const canvas = document.createElement("canvas");
  canvas.width = rawCanvas.width;
  canvas.height = targetCanvasHeight;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(
      rawCanvas,
      0,
      0,
      rawCanvas.width,
      targetCanvasHeight,
      0,
      0,
      rawCanvas.width,
      targetCanvasHeight,
    );
  }

  rawCanvas.width = 0;
  rawCanvas.height = 0;

  // Continuous Digital Folio: single continuous canvas with selectable text & clickable links
  if (config.format === "digital-folio") {
    const documentWidthMm = 210;
    const pxToMm = documentWidthMm / CANONICAL_WIDTH_PX;
    const documentHeightMm = Number((calculatedTightHeightPx * pxToMm).toFixed(2));

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [documentWidthMm, documentHeightMm],
      compress: true,
    });

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, documentWidthMm, documentHeightMm, undefined, "FAST");

    const lines = clusterWordsIntoLines(capturedWords, pxToMm);
    lines.forEach((line) => {
      if (line.yPx > calculatedTightHeightPx) return;
      pdf.setFontSize(line.fontSizePt);
      pdf.text(line.text, line.xMm, line.yMm, { renderingMode: "invisible" });
    });

    if (config.embedLinks) {
      capturedLinks.forEach((link) => {
        if (link.y > calculatedTightHeightPx) return;
        const xMm = link.x * pxToMm;
        const yMm = link.y * pxToMm;
        const wMm = link.width * pxToMm;
        const hMm = link.height * pxToMm;
        pdf.link(xMm, yMm, wMm, hMm, { url: link.href });
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    pdf.save(config.filename);
    return;
  }

  // Standard Paper Formats (A4 / US Letter)
  const isA4 = config.format === "a4";
  const paperWidthMm = isA4 ? 210 : 215.9;
  const paperHeightMm = isA4 ? 297 : 279.4;
  const pxToMm = paperWidthMm / CANONICAL_WIDTH_PX;

  if (config.paginationMode === "fit-single") {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: isA4 ? "a4" : "letter",
      compress: true,
    });

    const contentHeightMm = calculatedTightHeightPx * pxToMm;
    const scaleFactor = Math.min(1, paperHeightMm / contentHeightMm);

    const printWidthMm = paperWidthMm * scaleFactor;
    const printHeightMm = contentHeightMm * scaleFactor;
    const xOffsetMm = (paperWidthMm - printWidthMm) / 2;
    const yOffsetMm = Math.max(0, (paperHeightMm - printHeightMm) / 2);

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(
      imgData,
      "PNG",
      xOffsetMm,
      yOffsetMm,
      printWidthMm,
      printHeightMm,
      undefined,
      "FAST",
    );

    const lines = clusterWordsIntoLines(capturedWords, pxToMm);
    lines.forEach((line) => {
      const xMm = xOffsetMm + line.xMm * scaleFactor;
      const yMm = yOffsetMm + line.yMm * scaleFactor;
      pdf.setFontSize(line.fontSizePt * scaleFactor);
      pdf.text(line.text, xMm, yMm, { renderingMode: "invisible" });
    });

    if (config.embedLinks) {
      capturedLinks.forEach((link) => {
        const xMm = xOffsetMm + link.x * pxToMm * scaleFactor;
        const yMm = yOffsetMm + link.y * pxToMm * scaleFactor;
        const wMm = link.width * pxToMm * scaleFactor;
        const hMm = link.height * pxToMm * scaleFactor;
        pdf.link(xMm, yMm, wMm, hMm, { url: link.href });
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    pdf.save(config.filename);
    return;
  }

  // Multi-Page Slicing: Each slice encoded individually
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: isA4 ? "a4" : "letter",
    compress: true,
  });

  const paperAspect = paperHeightMm / paperWidthMm;
  const pageHeightDomPx = CANONICAL_WIDTH_PX * paperAspect;
  const sliceHeightCanvasPx = Math.round(pageHeightDomPx * renderScale);
  const totalPages = Math.max(1, Math.ceil(calculatedTightHeightPx / pageHeightDomPx));
  const clusteredLines = clusterWordsIntoLines(capturedWords, pxToMm);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) pdf.addPage();

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightCanvasPx;

    const pageCtx = pageCanvas.getContext("2d");
    if (!pageCtx) throw new Error("Could not acquire 2D canvas rendering context.");

    pageCtx.fillStyle = sheetBg;
    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

    const srcY = pageIdx * sliceHeightCanvasPx;
    const srcHeight = Math.min(sliceHeightCanvasPx, canvas.height - srcY);

    if (srcHeight > 0) {
      pageCtx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);
    }

    const pageImgData = pageCanvas.toDataURL("image/png");
    pdf.addImage(pageImgData, "PNG", 0, 0, paperWidthMm, paperHeightMm, undefined, "FAST");

    clusteredLines.forEach((line) => {
      const itemPageIdx = Math.floor(line.yPx / pageHeightDomPx);
      if (itemPageIdx !== pageIdx) return;

      const yOnPagePx = line.yPx - pageIdx * pageHeightDomPx;
      const yMm = (yOnPagePx + line.baselineOffsetPx) * pxToMm;

      pdf.setPage(pageIdx + 1);
      pdf.setFontSize(line.fontSizePt);
      pdf.text(line.text, line.xMm, yMm, { renderingMode: "invisible" });
    });

    if (config.embedLinks) {
      capturedLinks.forEach((link) => {
        const slice = sliceLinkToPage(link, pageIdx, pageHeightDomPx, pxToMm);
        if (!slice) return;

        pdf.setPage(pageIdx + 1);
        pdf.link(slice.xMm, slice.yMm, slice.wMm, slice.hMm, { url: link.href });
      });
    }

    pageCanvas.width = 0;
    pageCanvas.height = 0;
  }

  canvas.width = 0;
  canvas.height = 0;
  pdf.save(config.filename);
}
