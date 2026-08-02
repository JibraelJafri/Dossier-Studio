import { DossierData } from "../types.ts";
import { sanitizeHref, formatPlaintextUrl } from "./urlPolicy.ts";

export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type MarkdownChunk =
  | { type: "code"; content: string }
  | { type: "link"; label: string; href: string }
  | { type: "text"; content: string };

export function parseMarkdown(text: string): string {
  if (!text || typeof text !== "string") return "";

  const chunks: MarkdownChunk[] = [];
  const tokenRegex = /`([^`]+)`|\[([^\]]+)\]\(((?:[^()\s]+|\([^()\s]*\))+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    if (match[1] !== undefined) {
      chunks.push({
        type: "code",
        content: match[1],
      });
    } else if (match[2] !== undefined && match[3] !== undefined) {
      chunks.push({
        type: "link",
        label: match[2],
        href: match[3],
      });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    chunks.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return chunks
    .map((chunk) => {
      if (chunk.type === "code") {
        return `<code class="font-mono text-[0.88em] px-1.5 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--accent-base)] border border-[var(--border-sheet)] font-medium">${escapeHtml(
          chunk.content,
        )}</code>`;
      }

      if (chunk.type === "link") {
        const safeHref = sanitizeHref(chunk.href);
        if (!safeHref) {
          return escapeHtml(chunk.label);
        }
        return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="dossier-link">${escapeHtml(
          chunk.label,
        )}</a>`;
      }

      let formatted = escapeHtml(chunk.content);

      // Bold (**text** or __text__)
      formatted = formatted.replace(
        /(\*\*|__)(.+?)\1/g,
        '<strong class="font-semibold text-[var(--text-main)]">$2</strong>',
      );

      // Italic (*text* or word-boundary protected _text_)
      formatted = formatted.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em class="italic">$2</em>');
      formatted = formatted.replace(
        /(^|[^a-zA-Z0-9_])_([^_]+)_(?![a-zA-Z0-9_])/g,
        '$1<em class="italic">$2</em>',
      );

      return formatted;
    })
    .join("");
}

export function stripMarkdown(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
    .replace(/(^|[^a-zA-Z0-9_])_([^_]+)_(?![a-zA-Z0-9_])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");
}

export function formatDossierPlainText(data: DossierData): string {
  const lines: string[] = [];

  lines.push(data.applicant.name.toUpperCase());
  lines.push(data.applicant.title);
  lines.push(`${data.applicant.location} | ${data.applicant.phone} | ${data.applicant.email}`);

  const portfolioUrl = formatPlaintextUrl(data.applicant.website);
  const artstationUrl = formatPlaintextUrl(data.applicant.artstation);
  const linkParts: string[] = [];
  if (portfolioUrl) linkParts.push(`Portfolio: ${portfolioUrl}`);
  if (artstationUrl) linkParts.push(`ArtStation: ${artstationUrl}`);
  if (linkParts.length > 0) {
    lines.push(linkParts.join(" | "));
  }
  lines.push("------------------------------------------------------------");

  lines.push(`Date: ${data.target.date}`);
  lines.push(`To: ${data.target.recipientTitle}`);
  lines.push(`Company: ${data.target.studio} (${data.target.department})`);
  lines.push(`Re: Application for ${data.target.role}`);
  lines.push("------------------------------------------------------------\n");

  lines.push(data.letter.salutation);
  lines.push("");
  data.letter.paragraphs.forEach((p) => {
    lines.push(stripMarkdown(p.content));
    lines.push("");
  });

  if (data.visibility.metrics && data.metrics.length > 0) {
    const title = data.metricsHeader?.title || "KEY VERIFIED TECHNICAL BENCHMARKS";
    lines.push(`${title.toUpperCase()}:`);
    data.metrics.forEach((m) => {
      const kickerPart = m.kicker ? `[${m.kicker}] ` : "";
      const tagPart = m.contextTag ? ` (${m.contextTag})` : "";
      lines.push(`* ${kickerPart}${m.val} - ${m.label}`);
      lines.push(`  ${m.narrative}${tagPart}`);
    });
    lines.push("");
  }

  if (data.visibility.taxonomy && data.taxonomy.length > 0) {
    const title = data.taxonomyHeader?.title || "CORE ARCHITECTURE & SYSTEMS COMPETENCIES";
    lines.push(`${title.toUpperCase()}:`);
    data.taxonomy.forEach((cat) => {
      const tagPart = cat.categoryTag ? ` [${cat.categoryTag}]` : "";
      lines.push(`- ${cat.title}${tagPart}:`);
      cat.items.forEach((item) => {
        lines.push(`  * ${item.name}: ${item.detail}`);
      });
    });
    lines.push("");
  }

  lines.push(data.signoff.valediction);
  lines.push(data.signoff.name);
  lines.push(data.signoff.roleTitle);

  return lines.join("\n");
}