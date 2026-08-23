import { describe, it, expect } from "vitest";
import {
  calculateContentTightHeight,
  cleanTextForPdf,
  sliceLinkToPage,
  clusterWordsIntoLines,
  CANONICAL_WIDTH_PX,
} from "../src/utils/pdfExport.ts";

describe("pdfExport utilities", () => {
  describe("cleanTextForPdf", () => {
    it("converts non-breaking spaces to standard spaces", () => {
      expect(cleanTextForPdf("Hello\u00A0World")).toBe("Hello World");
    });

    it("strips zero-width spaces and BOM markers", () => {
      expect(cleanTextForPdf("Zero\u200BWidth\uFEFFText")).toBe("ZeroWidthText");
    });

    it("replaces unsupported Indian Rupee symbol with ASCII INR for WinAnsi safety", () => {
      expect(cleanTextForPdf("Total: \u20B95000")).toBe("Total: INR5000");
    });
  });

  describe("calculateContentTightHeight", () => {
    it("measures DOM elements and clamps to minimum height", () => {
      const container = document.createElement("div");
      const child = document.createElement("div");
      container.appendChild(child);
      document.body.appendChild(container);

      const height = calculateContentTightHeight(container, 48);
      expect(height).toBeGreaterThanOrEqual(600);

      document.body.removeChild(container);
    });
  });

  describe("sliceLinkToPage", () => {
    const pxToMm = 210 / CANONICAL_WIDTH_PX;
    const pageHeightDomPx = 1200;

    it("returns null when link is outside current page boundary", () => {
      const link = {
        href: "https://example.com",
        x: 50,
        y: 1300,
        width: 100,
        height: 20,
      };

      // Page 0 spans y: 0 to 1200 -> link is completely on page 1
      expect(sliceLinkToPage(link, 0, pageHeightDomPx, pxToMm)).toBeNull();
    });

    it("slices link when it crosses page cutline boundary", () => {
      const link = {
        href: "https://example.com",
        x: 50,
        y: 1190,
        width: 100,
        height: 30, // spans 1190 to 1220
      };

      // Page 0 visible portion: 1190 to 1200 (10px height)
      const sliceP0 = sliceLinkToPage(link, 0, pageHeightDomPx, pxToMm);
      expect(sliceP0).not.toBeNull();
      expect(sliceP0?.hMm).toBeCloseTo(10 * pxToMm, 2);

      // Page 1 visible portion: 1200 to 1220 (20px height)
      const sliceP1 = sliceLinkToPage(link, 1, pageHeightDomPx, pxToMm);
      expect(sliceP1).not.toBeNull();
      expect(sliceP1?.yMm).toBeCloseTo(0, 2);
      expect(sliceP1?.hMm).toBeCloseTo(20 * pxToMm, 2);
    });
  });

  describe("clusterWordsIntoLines", () => {
    const pxToMm = 210 / CANONICAL_WIDTH_PX;

    it("clusters closely horizontally aligned words on same line", () => {
      const words = [
        { text: "Principal", x: 10, y: 100, width: 40, height: 16, fontSizePt: 12 },
        { text: "Engine", x: 55, y: 100, width: 35, height: 16, fontSizePt: 12 },
        { text: "Architect", x: 95, y: 100, width: 45, height: 16, fontSizePt: 12 },
        { text: "NextLine", x: 10, y: 130, width: 50, height: 16, fontSizePt: 12 },
      ];

      const lines = clusterWordsIntoLines(words, pxToMm);
      expect(lines.length).toBe(2);
      expect(lines[0]?.text).toBe("Principal Engine Architect");
      expect(lines[1]?.text).toBe("NextLine");
    });
  });
});
