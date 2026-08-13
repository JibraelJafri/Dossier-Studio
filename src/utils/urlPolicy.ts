export function normalizeUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const clean = rawUrl.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  if (!clean) return null;

  try {
    let candidate = clean;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
      candidate = candidate.startsWith("//") ? `https:${candidate}` : `https://${candidate}`;
    }

    const parsed = new URL(candidate, "https://sanitizer.local");
    const allowed = ["https:", "http:", "mailto:", "tel:"];
    if (!allowed.includes(parsed.protocol)) {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

export function isValidUrl(rawUrl: string): boolean {
  return normalizeUrl(rawUrl) !== null;
}

export function sanitizeHref(rawUrl: string): string | null {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return null;
  return normalized
    .replace(/"/g, "%22")
    .replace(/'/g, "%27")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E");
}

export function formatPlaintextUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  const normalized = normalizeUrl(trimmed);
  return normalized ?? "";
}