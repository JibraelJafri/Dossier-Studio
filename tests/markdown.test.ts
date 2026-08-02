import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  parseMarkdown,
  stripMarkdown,
  formatDossierPlainText,
} from "../src/utils/markdown.ts";
import { DEFAULT_DATA } from "../src/constants.ts";

describe("markdown utilities", () => {
  describe("escapeHtml", () => {
    it("escapes special HTML characters properly", () => {
      expect(escapeHtml('<script>alert("xss") & test</script>')).toBe(
        "&lt;script&gt;alert(&quot;xss&quot;) &amp; test&lt;/script&gt;",
      );
      expect(escapeHtml("Tom's code")).toBe("Tom&#39;s code");
    });

    it("handles non-string values gracefully", () => {
      expect(escapeHtml(null as unknown as string)).toBe("");
      expect(escapeHtml(undefined as unknown as string)).toBe("");
    });
  });

  describe("parseMarkdown", () => {
    it("renders code blocks without executing content", () => {
      const parsed = parseMarkdown("Use `m_pRenderGraph->Execute()` for drawcalls");
      expect(parsed).toContain("<code");
      expect(parsed).toContain("m_pRenderGraph-&gt;Execute()");
    });

    it("renders markdown links with safe sanitization", () => {
      const parsed = parseMarkdown("Check [My Portfolio](https://portfolio.dev) here");
      expect(parsed).toContain('href="https://portfolio.dev/"');
      expect(parsed).toContain('class="dossier-link"');
      expect(parsed).toContain("My Portfolio</a>");
    });

    it("sanitizes dangerous javascript links in markdown to plain text", () => {
      const parsed = parseMarkdown("Click [malicious](javascript:alert(1)) here");
      expect(parsed).not.toContain("javascript:");
      expect(parsed).not.toContain("<a href");
      expect(parsed).toContain("malicious");
    });

    it("protects shader and variable names with underscores from accidental italics", () => {
      const parsed = parseMarkdown("Configure MAX_BUFFER_SIZE and SV_Target0 properly");
      expect(parsed).not.toContain("<em");
      expect(parsed).toContain("MAX_BUFFER_SIZE");
      expect(parsed).toContain("SV_Target0");
    });

    it("formats bold and italic syntax accurately", () => {
      const parsedBold = parseMarkdown("This is **critical** performance");
      expect(parsedBold).toContain('<strong class="font-semibold text-[var(--text-main)]">critical</strong>');

      const parsedItalic = parseMarkdown("This is *highlighted* prose");
      expect(parsedItalic).toContain('<em class="italic">highlighted</em>');
    });

    it("handles balanced parentheses in URLs", () => {
      const parsed = parseMarkdown("See [Docs](https://example.com/item(1)) for details");
      expect(parsed).toContain('href="https://example.com/item(1)"');
    });
  });

  describe("stripMarkdown", () => {
    it("removes markdown formatting for plaintext usage", () => {
      const text = "Review **Unreal Engine 5.4** with `RenderPass` and [Docs](https://docs.dev).";
      const stripped = stripMarkdown(text);
      expect(stripped).toBe("Review Unreal Engine 5.4 with RenderPass and Docs (https://docs.dev).");
    });
  });

  describe("formatDossierPlainText", () => {
    it("formats dossier into clean plaintext document", () => {
      const plain = formatDossierPlainText(DEFAULT_DATA);
      expect(plain).toContain(DEFAULT_DATA.applicant.name.toUpperCase());
      expect(plain).toContain(DEFAULT_DATA.applicant.title);
      expect(plain).toContain(DEFAULT_DATA.target.studio);
      expect(plain).toContain(DEFAULT_DATA.letter.salutation);
      expect(plain).toContain(DEFAULT_DATA.signoff.valediction);
      expect(plain).not.toContain("<strong");
      expect(plain).not.toContain("<code");
    });
  });
});
