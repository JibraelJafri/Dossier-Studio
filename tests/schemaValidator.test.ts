import { describe, it, expect } from "vitest";
import { validateAndSanitizeDossierData } from "../src/utils/schemaValidator.ts";
import { DEFAULT_DATA } from "../src/constants.ts";

describe("schemaValidator", () => {
  it("returns base data when input is not an object", () => {
    const res = validateAndSanitizeDossierData(null, DEFAULT_DATA);
    expect(res.data.applicant.name).toBe(DEFAULT_DATA.applicant.name);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("clamps spacing parameters to safe numerical boundaries", () => {
    const input = {
      spacing: {
        sheetPaddingY: 9999, // Should clamp to max 120
        sheetPaddingX: -50,  // Should clamp to min 16
        sectionGap: 9999,    // Should clamp to max 120
        paragraphGap: 0,     // Should clamp to min 6
      },
    };

    const res = validateAndSanitizeDossierData(input, DEFAULT_DATA);
    expect(res.data.spacing?.sheetPaddingY).toBe(120);
    expect(res.data.spacing?.sheetPaddingX).toBe(16);
    expect(res.data.spacing?.sectionGap).toBe(120);
    expect(res.data.spacing?.paragraphGap).toBe(6);
  });

  it("defends against prototype pollution attacks in customGaps", () => {
    const maliciousPayload = JSON.parse(
      '{"spacing": {"customGaps": {"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}, "normal-seam": 42}}}',
    );

    const res = validateAndSanitizeDossierData(maliciousPayload, DEFAULT_DATA);
    expect((Object.prototype as Record<string, unknown>).polluted).toBeUndefined();
    expect(res.data.spacing?.customGaps?.["normal-seam"]).toBe(42);
    expect(Object.prototype.hasOwnProperty.call(res.data.spacing?.customGaps || {}, "__proto__")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(res.data.spacing?.customGaps || {}, "constructor")).toBe(false);
  });

  it("truncates excessively long strings to preserve performance", () => {
    const input = {
      applicant: {
        name: "A".repeat(500),
      },
    };

    const res = validateAndSanitizeDossierData(input, DEFAULT_DATA);
    expect(res.data.applicant.name.length).toBe(120);
  });

  it("validates and sanitizes structured metrics and taxonomy arrays", () => {
    const input = {
      metrics: [
        {
          val: "-50%",
          label: "Frametime",
          narrative: "Optimized mesh compute passes",
        },
      ],
      taxonomy: [
        {
          title: "Rendering Architecture",
          items: [
            { name: "Vulkan 1.3", detail: "Bindless descriptor indexing" },
          ],
        },
      ],
    };

    const res = validateAndSanitizeDossierData(input, DEFAULT_DATA);
    expect(res.data.metrics.length).toBe(1);
    expect(res.data.metrics[0]?.val).toBe("-50%");
    expect(res.data.taxonomy.length).toBe(1);
    expect(res.data.taxonomy[0]?.title).toBe("Rendering Architecture");
  });
});
