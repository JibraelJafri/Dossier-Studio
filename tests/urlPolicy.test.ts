import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  isValidUrl,
  sanitizeHref,
  formatPlaintextUrl,
} from "../src/utils/urlPolicy.ts";

describe("urlPolicy", () => {
  describe("normalizeUrl", () => {
    it("normalizes valid https URLs", () => {
      expect(normalizeUrl("https://example.com/portfolio")).toBe("https://example.com/portfolio");
      expect(normalizeUrl("http://example.com")).toBe("http://example.com/");
    });

    it("prepends https: to schemeless domain URLs", () => {
      expect(normalizeUrl("artstation.com/artist")).toBe("https://artstation.com/artist");
      expect(normalizeUrl("//artstation.com/artist")).toBe("https://artstation.com/artist");
    });

    it("allows mailto: and tel: protocols", () => {
      expect(normalizeUrl("mailto:developer@example.com")).toBe("mailto:developer@example.com");
      expect(normalizeUrl("tel:+1234567890")).toBe("tel:+1234567890");
    });

    it("rejects dangerous or disallowed protocols", () => {
      expect(normalizeUrl("javascript:alert(1)")).toBeNull();
      expect(normalizeUrl("data:text/html,<h1>XSS</h1>")).toBeNull();
      expect(normalizeUrl("vbscript:msgbox(1)")).toBeNull();
      expect(normalizeUrl("file:///etc/passwd")).toBeNull();
      expect(normalizeUrl("blob:https://example.com/abc")).toBeNull();
    });

    it("strips ASCII control characters", () => {
      expect(normalizeUrl("https://example.com\u0000/test")).toBe("https://example.com/test");
      expect(normalizeUrl("https://example.com\u001F/test")).toBe("https://example.com/test");
    });

    it("handles null, empty, or whitespace inputs", () => {
      expect(normalizeUrl("")).toBeNull();
      expect(normalizeUrl("   ")).toBeNull();
      expect(normalizeUrl(null as unknown as string)).toBeNull();
      expect(normalizeUrl(undefined as unknown as string)).toBeNull();
    });
  });

  describe("isValidUrl", () => {
    it("returns true for valid URLs and false for invalid ones", () => {
      expect(isValidUrl("https://github.com")).toBe(true);
      expect(isValidUrl("mailto:test@test.com")).toBe(true);
      expect(isValidUrl("javascript:void(0)")).toBe(false);
      expect(isValidUrl("not a valid url ^^^")).toBe(false);
    });
  });

  describe("sanitizeHref", () => {
    it("escapes quotes and angle brackets in valid URLs", () => {
      expect(sanitizeHref("https://example.com/search?q=<script>")).toBe(
        "https://example.com/search?q=%3Cscript%3E",
      );
      expect(sanitizeHref("https://example.com/test'\"")).toBe(
        "https://example.com/test%27%22",
      );
    });

    it("returns null for invalid or malicious URLs", () => {
      expect(sanitizeHref("javascript:alert('xss')")).toBeNull();
      expect(sanitizeHref("")).toBeNull();
    });
  });

  describe("formatPlaintextUrl", () => {
    it("formats URLs for plaintext export", () => {
      expect(formatPlaintextUrl("artstation.com/td")).toBe("https://artstation.com/td");
      expect(formatPlaintextUrl("https://github.com/project")).toBe("https://github.com/project");
      expect(formatPlaintextUrl("   ")).toBe("");
      expect(formatPlaintextUrl("javascript:void(0)")).toBe("");
    });
  });
});
