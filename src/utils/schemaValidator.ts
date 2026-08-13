import { DossierData, LetterParagraph } from "../types.ts";
import { DEFAULT_SPACING } from "../constants.ts";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function cleanString(val: unknown, fallback: string, maxLen = 2000): string {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
  }
  return fallback;
}

function cleanBoolean(val: unknown, fallback: boolean): boolean {
  return typeof val === "boolean" ? val : fallback;
}

function cleanNumber(val: unknown, fallback: number, min: number, max: number): number {
  if (typeof val === "number" && !isNaN(val) && Number.isFinite(val)) {
    return Math.max(min, Math.min(max, Math.round(val)));
  }
  return fallback;
}

export interface ValidationResult {
  data: DossierData;
  changes: string[];
  warnings: string[];
}

export function validateAndSanitizeDossierData(
  input: unknown,
  base: DossierData,
): ValidationResult {
  const changes: string[] = [];
  const warnings: string[] = [];

  if (!isObject(input)) {
    warnings.push("Input was not a valid object. Retained existing state.");
    return { data: JSON.parse(JSON.stringify(base)), changes, warnings };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = input as Record<string, any>;
  const output: DossierData = JSON.parse(JSON.stringify(base));

  // 1. Visibility Settings
  if (isObject(raw.visibility)) {
    const v = raw.visibility;
    output.visibility = {
      headerKicker: cleanBoolean(v.headerKicker, base.visibility.headerKicker),
      targetCard: cleanBoolean(v.targetCard, base.visibility.targetCard),
      availabilityBadge: cleanBoolean(v.availabilityBadge, base.visibility.availabilityBadge),
      recipientBlock: cleanBoolean(v.recipientBlock, base.visibility.recipientBlock),
      metrics: cleanBoolean(v.metrics, base.visibility.metrics),
      taxonomy: cleanBoolean(v.taxonomy, base.visibility.taxonomy),
      signoffMeta: cleanBoolean(v.signoffMeta, base.visibility.signoffMeta),
      footerStamp: cleanBoolean(v.footerStamp, base.visibility.footerStamp),
    };
  }

  // 2. Interactive Spacing Settings
  if (isObject(raw.spacing)) {
    const s = raw.spacing;
    const customGaps: Record<string, number> = {};

    if (isObject(s.customGaps)) {
      for (const [k, v] of Object.entries(s.customGaps)) {
        if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
        if (typeof v === "number" && !isNaN(v) && Number.isFinite(v)) {
          customGaps[k] = cleanNumber(v, 28, 4, 120);
        }
      }
    }

    output.spacing = {
      sheetPaddingY: cleanNumber(
        s.sheetPaddingY,
        base.spacing?.sheetPaddingY ?? DEFAULT_SPACING.sheetPaddingY,
        12,
        120,
      ),
      sheetPaddingX: cleanNumber(
        s.sheetPaddingX,
        base.spacing?.sheetPaddingX ?? DEFAULT_SPACING.sheetPaddingX,
        16,
        120,
      ),
      sectionGap: cleanNumber(
        s.sectionGap,
        base.spacing?.sectionGap ?? DEFAULT_SPACING.sectionGap,
        4,
        120,
      ),
      paragraphGap: cleanNumber(
        s.paragraphGap,
        base.spacing?.paragraphGap ?? DEFAULT_SPACING.paragraphGap,
        6,
        44,
      ),
      customGaps,
    };
  } else if (!output.spacing) {
    output.spacing = { ...DEFAULT_SPACING };
  }

  // 3. Typography & Theme Palette
  if (raw.typographyStyle === "editorial" || raw.typographyStyle === "modern") {
    output.typographyStyle = raw.typographyStyle;
  }

  if (
    raw.themePalette === "" ||
    raw.themePalette === "theme-amber" ||
    raw.themePalette === "theme-cobalt" ||
    raw.themePalette === "theme-emerald" ||
    raw.themePalette === "theme-slate"
  ) {
    output.themePalette = raw.themePalette;
  }

  // 4. Applicant Information
  if (isObject(raw.applicant)) {
    const a = raw.applicant;
    output.applicant = {
      name: cleanString(a.name, base.applicant.name, 120),
      title: cleanString(a.title, base.applicant.title, 160),
      location: cleanString(a.location, base.applicant.location, 160),
      phone: cleanString(a.phone, base.applicant.phone, 80),
      email: cleanString(a.email, base.applicant.email, 120),
      artstation: cleanString(a.artstation, base.applicant.artstation, 160),
      website: cleanString(a.website, base.applicant.website, 160),
      dossierKicker: cleanString(a.dossierKicker, base.applicant.dossierKicker || "", 160),
      qrUrl: cleanString(a.qrUrl, base.applicant.qrUrl || "", 240),
    };

    if (output.applicant.name !== base.applicant.name) {
      changes.push(`Applicant Name: "${output.applicant.name}"`);
    }
    if (output.applicant.title !== base.applicant.title) {
      changes.push(`Applicant Title: "${output.applicant.title}"`);
    }
  }

  // 5. Target Requisition
  if (isObject(raw.target)) {
    const t = raw.target;
    output.target = {
      recipientTitle: cleanString(t.recipientTitle, base.target.recipientTitle, 160),
      studio: cleanString(t.studio, base.target.studio, 120),
      role: cleanString(t.role, base.target.role, 140),
      department: cleanString(t.department, base.target.department, 140),
      date: cleanString(t.date, base.target.date, 60),
      location: cleanString(t.location, base.target.location, 120),
      availability: cleanString(t.availability, base.target.availability, 120),
      cardHeaderLabel: cleanString(t.cardHeaderLabel, base.target.cardHeaderLabel || "Target Requisition", 80),
      cardBadgeLabel: cleanString(t.cardBadgeLabel, base.target.cardBadgeLabel || "CONFIDENTIAL", 40),
      statusLabel: cleanString(t.statusLabel, base.target.statusLabel || "Target Studio", 60),
      dateLabel: cleanString(t.dateLabel, base.target.dateLabel || "Date of Record", 60),
      attentionLabel: cleanString(t.attentionLabel, base.target.attentionLabel || "Attention / Addressee", 60),
      departmentLabel: cleanString(t.departmentLabel, base.target.departmentLabel || "Division & Track", 60),
      locationLabel: cleanString(t.locationLabel, base.target.locationLabel || "Mobility & Notice", 60),
      studioLabel: cleanString(t.studioLabel, base.target.studioLabel || "Target Studio", 60),
    };

    if (output.target.studio !== base.target.studio) {
      changes.push(`Target Studio: "${output.target.studio}"`);
    }
    if (output.target.role !== base.target.role) {
      changes.push(`Target Role: "${output.target.role}"`);
    }
  }

  // 6. Statement Letter
  if (isObject(raw.letter)) {
    const l = raw.letter;
    let paragraphs = base.letter.paragraphs;

    if (Array.isArray(l.paragraphs) && l.paragraphs.length > 0) {
      const validParas: LetterParagraph[] = [];

      for (const item of l.paragraphs) {
        if (typeof item === "string" && item.trim().length > 0) {
          validParas.push({ content: cleanString(item, "", 5000) });
        } else if (isObject(item) && typeof item.content === "string" && item.content.trim().length > 0) {
          validParas.push({ content: cleanString(item.content, "", 5000) });
        }
      }

      if (validParas.length > 0) {
        paragraphs = validParas;
        changes.push(`${validParas.length} letter paragraphs updated`);
      } else {
        warnings.push("No valid paragraphs found in letter payload. Retained existing paragraphs.");
      }
    }

    output.letter = {
      salutation: cleanString(l.salutation, base.letter.salutation, 200),
      sectionNumber: cleanString(l.sectionNumber, base.letter.sectionNumber || "01.", 20),
      sectionTitle: cleanString(l.sectionTitle, base.letter.sectionTitle || "Statement of Intent", 100),
      sectionSubtitle: cleanString(l.sectionSubtitle, base.letter.sectionSubtitle || "Technical Manifesto", 160),
      paragraphs,
    };

    if (output.letter.salutation !== base.letter.salutation) {
      changes.push("Salutation updated");
    }
  }

  // 7. Telemetry & Metrics
  if (Array.isArray(raw.metrics)) {
    const validMetrics = raw.metrics
      .filter(
        (m: unknown): m is Record<string, unknown> =>
          isObject(m) &&
          (typeof m.val === "string" || typeof m.val === "number") &&
          (typeof m.label === "string" || typeof m.label === "number"),
      )
      .map((m) => ({
        kicker: cleanString(m.kicker, "", 100),
        val: String(m.val).trim().slice(0, 50),
        label: String(m.label).trim().slice(0, 160),
        narrative: cleanString(m.narrative, "", 1500),
        contextTag: cleanString(m.contextTag, "", 120),
      }));

    if (validMetrics.length > 0) {
      output.metrics = validMetrics;
      changes.push(`${validMetrics.length} technical benchmark cards updated`);
    }
  }

  if (isObject(raw.metricsHeader)) {
    output.metricsHeader = {
      sectionNumber: cleanString(raw.metricsHeader.sectionNumber, base.metricsHeader?.sectionNumber || "02.", 20),
      title: cleanString(raw.metricsHeader.title, base.metricsHeader?.title || "Verified Benchmarks", 120),
      subtitle: cleanString(raw.metricsHeader.subtitle, base.metricsHeader?.subtitle || "Sub-Millisecond Profiling", 160),
    };
  }

  // 8. Architecture Taxonomy
  if (Array.isArray(raw.taxonomy)) {
    const validTaxonomy = raw.taxonomy
      .filter(
        (cat: unknown): cat is Record<string, unknown> & { items: unknown[] } =>
          isObject(cat) && typeof cat.title === "string" && Array.isArray(cat.items),
      )
      .map((cat) => ({
        title: String(cat.title).trim().slice(0, 100),
        categoryTag: cleanString(cat.categoryTag, "", 80),
        items: cat.items
          .filter(
            (item: unknown): item is Record<string, unknown> =>
              isObject(item) && (typeof item.name === "string" || typeof item.name === "number"),
          )
          .map((item) => ({
            name: String(item.name).trim().slice(0, 120),
            detail: cleanString(item.detail, "", 600),
          })),
      }))
      .filter((cat) => cat.items.length > 0);

    if (validTaxonomy.length > 0) {
      output.taxonomy = validTaxonomy;
      changes.push(`${validTaxonomy.length} competency columns updated`);
    }
  }

  if (isObject(raw.taxonomyHeader)) {
    output.taxonomyHeader = {
      sectionNumber: cleanString(raw.taxonomyHeader.sectionNumber, base.taxonomyHeader?.sectionNumber || "03.", 20),
      title: cleanString(raw.taxonomyHeader.title, base.taxonomyHeader?.title || "Core Systems Competencies", 120),
      subtitle: cleanString(raw.taxonomyHeader.subtitle, base.taxonomyHeader?.subtitle || "Engine Architecture", 160),
    };
  }

  // 9. Signoff Section
  if (isObject(raw.signoff)) {
    output.signoff = {
      valediction: cleanString(raw.signoff.valediction, base.signoff.valediction, 120),
      name: cleanString(raw.signoff.name, base.signoff.name, 120),
      roleTitle: cleanString(raw.signoff.roleTitle, base.signoff.roleTitle, 160),
    };
  }

  if (isObject(raw.signoffMeta)) {
    output.signoffMeta = {
      recordBadge: cleanString(raw.signoffMeta.recordBadge, base.signoffMeta?.recordBadge || "RECORD VERIFIED", 80),
      portfolioLabel: cleanString(raw.signoffMeta.portfolioLabel, base.signoffMeta?.portfolioLabel || "Portfolio", 100),
      directChannelLabel: cleanString(raw.signoffMeta.directChannelLabel, base.signoffMeta?.directChannelLabel || "Direct Channel", 100),
      footerSpecNote: cleanString(raw.signoffMeta.footerSpecNote, base.signoffMeta?.footerSpecNote || "Verified Systems Spec", 100),
      footerPageNote: cleanString(raw.signoffMeta.footerPageNote, base.signoffMeta?.footerPageNote || "1-PAGE CALIBRATED DOSSIER", 100),
    };
  }

  return { data: output, changes, warnings };
}