import React from "react";
import { MetricItem, SectionHeaderMeta, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { Trash2, Plus, EyeOff } from "lucide-react";

interface TelemetrySectionProps {
  headerMeta?: SectionHeaderMeta;
  metrics: MetricItem[];
  typographyStyle?: TypographyStyle;
  onUpdateHeaderMeta: <K extends keyof SectionHeaderMeta>(
    field: K,
    val: SectionHeaderMeta[K],
  ) => void;
  onUpdateMetric: <K extends keyof MetricItem>(index: number, field: K, val: MetricItem[K]) => void;
  onAddMetric: () => void;
  onRemoveMetric: (index: number) => void;
  onHideSection?: () => void;
  onHide?: () => void;
  disabled?: boolean;
}

export const TelemetrySection: React.FC<TelemetrySectionProps> = ({
  headerMeta = {
    sectionNumber: "02.",
    title: "Verified Impact & Systems Telemetry",
    subtitle: "Measurable Production Performance & Optimization Record",
  },
  metrics,
  typographyStyle = "editorial",
  onUpdateHeaderMeta,
  onUpdateMetric,
  onAddMetric,
  onRemoveMetric,
  onHideSection,
  onHide,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";
  const handleHide = onHide || onHideSection;

  return (
    <section
      className="group/sec relative transition-colors duration-200"
      aria-label="Verified Benchmarks & Impact"
    >
      {!disabled && handleHide && (
        <div className="absolute -top-2.5 right-0 z-30 pb-1.5 transition-all duration-150 ease-out delay-150 opacity-0 pointer-events-none group-hover/sec:opacity-100 group-hover/sec:pointer-events-auto group-hover/sec:delay-0 no-print">
          <button
            type="button"
            onClick={handleHide}
            className="p-1.5 rounded-md bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) shadow-xs text-(--text-faint) hover:text-(--text-main) hover:border-(--accent-base) cursor-pointer flex items-center justify-center"
            title="Hide Benchmarks & Telemetry Section"
            aria-label="Hide Telemetry Section"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 mb-5">
        <h2 className="flex items-baseline gap-2 shrink-0">
          <span
            className={
              isEditorial ?
                "font-serif italic text-lg text-(--accent-base)"
              : "font-mono text-xs font-bold text-(--accent-base)"
            }
          >
            <EditableText
              value={headerMeta.sectionNumber || "02."}
              onChange={(val) => onUpdateHeaderMeta("sectionNumber", val)}
              disabled={disabled}
            />
          </span>
          <span
            className={
              isEditorial ?
                "font-serif text-2xl sm:text-3xl font-medium tracking-tight text-(--text-main)"
              : "font-sans text-sm font-bold uppercase tracking-wider text-(--text-main)"
            }
          >
            <EditableText
              value={headerMeta.title || "Verified Impact & Systems Telemetry"}
              onChange={(val) => onUpdateHeaderMeta("title", val)}
              disabled={disabled}
            />
          </span>
        </h2>

        <span
          className={
            isEditorial ?
              "font-serif italic text-xs text-(--text-faint) sm:text-right"
            : "font-mono text-[11px] text-(--text-faint) sm:text-right"
          }
        >
          <EditableText
            value={headerMeta.subtitle || "Measurable Production Performance & Optimization Record"}
            onChange={(val) => onUpdateHeaderMeta("subtitle", val)}
            disabled={disabled}
          />
        </span>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-3 gap-4 sm:gap-5">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="group/card relative bg-(--bg-subtle)/50 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:bg-(--bg-subtle)/80 flex flex-col justify-between"
          >
            {/* Out-of-flow Delete Action */}
            {!disabled && metrics.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveMetric(idx)}
                className="absolute top-3.5 right-3.5 p-1 rounded-md text-(--text-faint) hover:text-red-600 hover:bg-(--bg-sheet) border border-transparent hover:border-(--border-subtle) opacity-0 group-hover/card:opacity-100 transition-all duration-150 cursor-pointer no-print z-20 shadow-2xs"
                title="Remove metric card"
                aria-label={`Remove metric card ${idx + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <div className="space-y-2">
              <div>
                <EditableText
                  value={m.val}
                  onChange={(val) => onUpdateMetric(idx, "val", val)}
                  disabled={disabled}
                  className={
                    isEditorial ?
                      "text-4xl sm:text-5xl font-light tracking-tight tabular-nums text-(--text-main) leading-none whitespace-nowrap block"
                    : "text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-(--text-main) leading-none whitespace-nowrap block"
                  }
                />
              </div>

              <div
                className={
                  isEditorial ?
                    "font-serif italic text-base text-(--accent-base) font-medium leading-snug"
                  : "text-xs font-semibold text-(--accent-base) uppercase tracking-wide leading-snug"
                }
              >
                <EditableText
                  value={m.label}
                  onChange={(val) => onUpdateMetric(idx, "label", val)}
                  disabled={disabled}
                />
              </div>
            </div>

            <div
              className={`pt-3 text-(--text-muted) ${
                isEditorial ? "font-serif text-sm leading-relaxed" : "text-xs leading-relaxed"
              }`}
            >
              <EditableText
                value={m.narrative}
                onChange={(val) => onUpdateMetric(idx, "narrative", val)}
                allowMarkdown={true}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="mt-4 pt-1 no-print">
          <button
            type="button"
            onClick={onAddMetric}
            className="text-xs font-mono text-(--text-faint) hover:text-(--accent-base) inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-dashed border-(--border-sheet) hover:border-(--accent-base) transition-colors cursor-pointer"
            title="Add a new telemetry benchmark card"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Metric Benchmark</span>
          </button>
        </div>
      )}
    </section>
  );
};
