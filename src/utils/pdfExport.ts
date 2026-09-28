import { PdfExportConfig } from "../types.ts";
import { normalizeUrl } from "./urlPolicy.ts";

export type ExportStage = "preparing" | "rendering" | "compiling" | "success";

export interface ExecutePdfExportArgs {
  sheetElement: HTMLElement;
  config: PdfExportConfig;
  isDark: boolean;
  onProgress?: (stage: ExportStage) => void;
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
  padBottomFallback = 32,
): number {
  const padBottom =
    parseFloat(window.getComputedStyle(sheetElement).paddingBottom || "0") || padBottomFallback;

  // Measure untransformed layout offset to the footer baseline (immune to scale transforms)
  const footer = sheetElement.querySelector("footer");
  if (footer && footer instanceof HTMLElement) {
    let offsetTop = 0;
    let curr: HTMLElement | null = footer;
    while (curr && curr !== sheetElement) {
      offsetTop += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }
    const tightHeight = Math.ceil(offsetTop + footer.offsetHeight + padBottom);
    if (tightHeight >= 500 && tightHeight <= 3500) {
      return tightHeight;
    }
  }

  // Fallback to untransformed scrollHeight
  return Math.max(600, Math.ceil(sheetElement.scrollHeight || 1000));
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

  if (colorStr.includes("oklab") || colorStr.includes("oklch") || colorStr.includes("color-mix")) {
    return "#181614";
  }

  return colorStr;
}

const ALL_LAYOUT_PROPS: (keyof CSSStyleDeclaration)[] = [
  "display",
  "boxSizing",
  "position",
  "flexDirection",
  "flexWrap",
  "alignItems",
  "justifyContent",
  "gap",
  "rowGap",
  "columnGap",
  "gridTemplateColumns",
  "gridTemplateRows",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "textAlign",
  "textTransform",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "borderTopWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopStyle",
  "borderBottomStyle",
  "borderLeftStyle",
  "borderRightStyle",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomLeftRadius",
  "borderBottomRightRadius",
  "opacity",
  "whiteSpace",
  "wordBreak",
];

const COLOR_PROPS: (keyof CSSStyleDeclaration)[] = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "textDecorationColor",
  "outlineColor",
];

function freezeComputedStyles(source: Element, target: HTMLElement): void {
  if (
    source.classList.contains("no-print") ||
    source.classList.contains("availability-ping") ||
    source.classList.contains("animate-ping") ||
    source.id === "a4-page-guideline"
  ) {
    target.setAttribute("data-pdf-remove", "true");
    return;
  }

  try {
    const computed = window.getComputedStyle(source);

    for (const prop of ALL_LAYOUT_PROPS) {
      if (source.id === "dossier-sheet" && (prop === "marginTop" || prop === "marginBottom")) {
        continue;
      }
      const val = computed[prop];
      if (val && typeof val === "string") {
        (target.style as unknown as Record<string, string>)[prop as string] = val;
      }
    }

    for (const prop of COLOR_PROPS) {
      const val = computed[prop];
      if (val && typeof val === "string") {
        (target.style as unknown as Record<string, string>)[prop as string] = toSafeRgb(val);
      }
    }

    target.style.overflow = "visible";

    if (source instanceof HTMLElement) {
      if (source.style.width && source.id !== "dossier-sheet")
        target.style.width = source.style.width;
      if (source.style.height && source.id !== "dossier-sheet")
        target.style.height = source.style.height;
    }

    if (source instanceof SVGElement) {
      const fill = source.getAttribute("fill");
      if (fill && fill !== "none") {
        const resolved = fill === "currentColor" ? toSafeRgb(computed.color) : toSafeRgb(fill);
        target.setAttribute("fill", resolved);
      }
      const stroke = source.getAttribute("stroke");
      if (stroke && stroke !== "none") {
        const resolved = stroke === "currentColor" ? toSafeRgb(computed.color) : toSafeRgb(stroke);
        target.setAttribute("stroke", resolved);
      }
    }
  } catch (err) {
    console.warn("Style freezing bypassed for element:", err);
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  const len = Math.min(sourceChildren.length, targetChildren.length);
  for (let i = 0; i < len; i++) {
    const sChild = sourceChildren[i];
    const tChild = targetChildren[i];
    if (sChild && tChild && tChild instanceof HTMLElement) {
      freezeComputedStyles(sChild, tChild);
    }
  }
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
        // Range detached fallback
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

export function triggerPdfDownload(pdfInstance: any, filename: string): void {
  const cleanFilename =
    filename.trim().endsWith(".pdf") ? filename.trim() : `${filename.trim()}.pdf`;

  try {
    const blob = pdfInstance.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanFilename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 4000);
    return;
  } catch (err) {
    console.warn("Direct blob URL download fallback to pdf.save():", err);
  }

  pdfInstance.save(cleanFilename);
}

export async function executePdfExport({
  sheetElement,
  config,
  isDark,
  onProgress,
}: ExecutePdfExportArgs): Promise<void> {
  onProgress?.("preparing");

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  try {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 2000)),
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

  onProgress?.("rendering");

  let rawCanvas: HTMLCanvasElement;

  try {
    rawCanvas = await html2canvas(sheetElement, {
      scale: renderScale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: sheetBg,
      windowWidth: 1280,
      scrollX: 0,
      scrollY: 0,
      onclone: async (clonedDoc: Document) => {
        // Await font readiness in cloned iframe
        if (clonedDoc.fonts && clonedDoc.fonts.ready) {
          try {
            await Promise.race([
              clonedDoc.fonts.ready,
              new Promise((resolve) => setTimeout(resolve, 1500)),
            ]);
          } catch {
            // Fallback
          }
        }

        const clonedSheet = clonedDoc.getElementById("dossier-sheet");
        if (!clonedSheet) return;

        if (isForceLight) {
          clonedDoc.documentElement.classList.remove("dark");
          clonedDoc.body.classList.remove("dark");
          clonedSheet.classList.remove("dark");
          clonedSheet.querySelectorAll(".dark").forEach((el) => el.classList.remove("dark"));
        }

        freezeComputedStyles(sheetElement, clonedSheet);

        // Normalize text-rendering inside iframe to eliminate ligature stacking ("TARGET REOUTSTTTON")
        clonedSheet.style.fontVariantLigatures = "none";
        clonedSheet.style.fontFeatureSettings = '"liga" 0';

        clonedSheet.querySelectorAll("*").forEach((node) => {
          if (node instanceof HTMLElement) {
            node.style.fontVariantLigatures = "none";
            node.style.fontFeatureSettings = '"liga" 0';
            node.style.overflow = "visible";
            node.style.letterSpacing = "normal";
          }
        });

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

        // Set dimensions cleanly only inside iframe (never touches the live DOM)
        clonedSheet.classList.add("preview-mode");
        clonedSheet.classList.remove("no-print");

        clonedSheet.style.width = `${CANONICAL_WIDTH_PX}px`;
        clonedSheet.style.maxWidth = `${CANONICAL_WIDTH_PX}px`;
        clonedSheet.style.minWidth = `${CANONICAL_WIDTH_PX}px`;
        clonedSheet.style.transform = "none";
        clonedSheet.style.margin = "0";
        clonedSheet.style.boxShadow = "none";
        clonedSheet.style.borderRadius = "0px";
        clonedSheet.style.border = "none";
        clonedSheet.style.backgroundColor = sheetBg;
        clonedSheet.style.minHeight = "0px";
        clonedSheet.style.height = "auto";
        clonedSheet.style.maxHeight = "none";
        clonedSheet.style.paddingBottom = "32px";

        // Measure true footer baseline in clean clone to eliminate trailing whitespace
        const clonedFooter = clonedSheet.querySelector("footer");
        let tightHeight = 1100;
        if (clonedFooter && clonedFooter instanceof HTMLElement) {
          let offsetTop = 0;
          let curr: HTMLElement | null = clonedFooter;
          while (curr && curr !== clonedSheet) {
            offsetTop += curr.offsetTop;
            curr = curr.offsetParent as HTMLElement | null;
          }
          tightHeight = Math.ceil(offsetTop + clonedFooter.offsetHeight + 32);
        } else {
          tightHeight = Math.ceil(clonedSheet.scrollHeight || 1100);
        }

        calculatedTightHeightPx = tightHeight;
        clonedSheet.style.height = `${calculatedTightHeightPx}px`;
        clonedSheet.style.maxHeight = `${calculatedTightHeightPx}px`;
        clonedSheet.style.overflow = "hidden";

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
  } catch (canvasErr) {
    console.warn("html2canvas-pro error, initiating vector fallback:", canvasErr);

    const fallbackPdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: config.format === "letter" ? "letter" : "a4",
      compress: true,
    });

    const isLight = config.themeMode === "force-light" || !isDark;
    const bgRgb = isLight ? [255, 255, 255] : [19, 18, 17];
    const textRgb = isLight ? [24, 22, 20] : [245, 244, 239];

    fallbackPdf.setFillColor(bgRgb[0]!, bgRgb[1]!, bgRgb[2]!);
    fallbackPdf.rect(0, 0, 210, 297, "F");

    fallbackPdf.setFont("helvetica", "bold");
    fallbackPdf.setFontSize(22);
    fallbackPdf.setTextColor(textRgb[0]!, textRgb[1]!, textRgb[2]!);

    const applicantHeading = sheetElement.querySelector("h1")?.textContent || "Candidate Dossier";
    fallbackPdf.text(applicantHeading, 16, 24);

    triggerPdfDownload(fallbackPdf, config.filename);
    onProgress?.("success");
    return;
  }

  if (!rawCanvas || rawCanvas.width === 0 || rawCanvas.height === 0) {
    throw new Error("Canvas rendering produced an empty image buffer.");
  }

  onProgress?.("compiling");

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

  // 1. Continuous Digital Folio
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
        const padX = 0.8;
        const padY = 0.6;
        pdf.link(Math.max(0, xMm - padX), Math.max(0, yMm - padY), wMm + padX * 2, hMm + padY * 2, {
          url: link.href,
        });
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    triggerPdfDownload(pdf, config.filename);
    onProgress?.("success");
    return;
  }

  // 2. Standard Physical Paper (Fit-Single)
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
        const padX = 0.8;
        const padY = 0.6;
        pdf.link(Math.max(0, xMm - padX), Math.max(0, yMm - padY), wMm + padX * 2, hMm + padY * 2, {
          url: link.href,
        });
      });
    }

    canvas.width = 0;
    canvas.height = 0;
    triggerPdfDownload(pdf, config.filename);
    onProgress?.("success");
    return;
  }

  // 3. Multi-Page Slicing
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
        const padX = 0.8;
        const padY = 0.6;
        pdf.link(
          Math.max(0, slice.xMm - padX),
          Math.max(0, slice.yMm - padY),
          slice.wMm + padX * 2,
          slice.hMm + padY * 2,
          { url: link.href },
        );
      });
    }

    pageCanvas.width = 0;
    pageCanvas.height = 0;
  }

  canvas.width = 0;
  canvas.height = 0;
  triggerPdfDownload(pdf, config.filename);
  onProgress?.("success");
}
