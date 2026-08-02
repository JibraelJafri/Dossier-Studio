export type TypographyStyle = "editorial" | "modern";
export type ThemePalette = "" | "theme-amber" | "theme-cobalt" | "theme-emerald" | "theme-slate";
export type ViewPreset = "editorial" | "technical" | "executive";

export type ExportDocumentFormat = "digital-folio" | "a4" | "letter";
export type ExportPaginationMode = "continuous" | "multi-page" | "fit-single";
export type ExportQuality = "standard" | "high" | "ultra";
export type ExportThemeMode = "current" | "force-light";

export interface PdfExportConfig {
  format: ExportDocumentFormat;
  paginationMode: ExportPaginationMode;
  quality: ExportQuality;
  themeMode: ExportThemeMode;
  embedLinks: boolean;
  filename: string;
}

export interface VisibilitySettings {
  headerKicker: boolean;
  targetCard: boolean;
  availabilityBadge: boolean;
  recipientBlock: boolean;
  metrics: boolean;
  taxonomy: boolean;
  signoffMeta: boolean;
  footerStamp: boolean;
}

export interface SpacingSettings {
  sheetPaddingY: number; // Vertical canvas padding (px)
  sheetPaddingX: number; // Horizontal canvas padding (px)
  sectionGap: number; // Master/default inter-section rhythm (px)
  paragraphGap: number; // Spacing between letter paragraphs (px)
  customGaps?: Record<string, number>; // Individual seam overrides (px)
}

export interface ApplicantInfo {
  name: string;
  title: string;
  location: string;
  phone: string;
  email: string;
  artstation: string;
  website: string;
  dossierKicker?: string;
  qrUrl?: string;
}

export interface TargetInfo {
  recipientTitle: string;
  studio: string;
  role: string;
  department: string;
  date: string;
  location: string;
  availability: string;
  cardHeaderLabel?: string;
  cardBadgeLabel?: string;
  statusLabel?: string;
  dateLabel?: string;
  attentionLabel?: string;
  departmentLabel?: string;
  locationLabel?: string;
  studioLabel?: string;
}

export interface LetterParagraph {
  content: string;
}

export interface LetterInfo {
  salutation: string;
  paragraphs: LetterParagraph[];
  sectionNumber?: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export interface MetricItem {
  kicker: string;
  val: string;
  label: string;
  narrative: string;
  contextTag: string;
}

export interface TaxonomyItem {
  name: string;
  detail: string;
}

export interface TaxonomyCategory {
  title: string;
  categoryTag: string;
  items: TaxonomyItem[];
}

export interface SignoffInfo {
  valediction: string;
  name: string;
  roleTitle: string;
}

export interface SectionHeaderMeta {
  sectionNumber: string;
  title: string;
  subtitle: string;
}

export interface SignoffMeta {
  recordBadge: string;
  portfolioLabel: string;
  directChannelLabel: string;
  footerSpecNote: string;
  footerPageNote: string;
}

export interface DossierData {
  visibility: VisibilitySettings;
  spacing: SpacingSettings;
  typographyStyle: TypographyStyle;
  themePalette?: ThemePalette;
  applicant: ApplicantInfo;
  target: TargetInfo;
  letter: LetterInfo;
  metricsHeader?: SectionHeaderMeta;
  metrics: MetricItem[];
  taxonomyHeader?: SectionHeaderMeta;
  taxonomy: TaxonomyCategory[];
  signoff: SignoffInfo;
  signoffMeta?: SignoffMeta;
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  studio: string;
  role: string;
  summary: string;
  data: DossierData;
}
