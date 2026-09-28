import React from "react";
import { SectionHeaderMeta, TaxonomyCategory, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { Trash2, Plus, EyeOff } from "lucide-react";

interface TaxonomySectionProps {
  headerMeta?: SectionHeaderMeta;
  taxonomy: TaxonomyCategory[];
  typographyStyle?: TypographyStyle;
  onUpdateHeaderMeta: <K extends keyof SectionHeaderMeta>(
    field: K,
    val: SectionHeaderMeta[K],
  ) => void;
  onUpdateCategoryTitle: (catIdx: number, val: string) => void;
  onUpdateCategoryTag?: (catIdx: number, val: string) => void;
  onUpdateItemName: (catIdx: number, itemIdx: number, val: string) => void;
  onUpdateItemDetail: (catIdx: number, itemIdx: number, val: string) => void;
  onAddItem: (catIdx: number) => void;
  onRemoveItem: (catIdx: number, itemIdx: number) => void;
  onHide?: () => void;
  onHideSection?: () => void;
  disabled?: boolean;
}

export const TaxonomySection: React.FC<TaxonomySectionProps> = ({
  headerMeta = {
    sectionNumber: "03.",
    title: "Core Systems & Architecture Competencies",
    subtitle: "Production Disciplines, Pipelines, & Technical Foundations",
  },
  taxonomy,
  typographyStyle = "editorial",
  onUpdateHeaderMeta,
  onUpdateCategoryTitle,
  onUpdateCategoryTag,
  onUpdateItemName,
  onUpdateItemDetail,
  onAddItem,
  onRemoveItem,
  onHide,
  onHideSection,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";
  const handleHide = onHide || onHideSection;

  return (
    <section
      className="group/sec relative transition-colors duration-200"
      aria-label="Core Systems & Architecture Competencies"
    >
      {!disabled && handleHide && (
        <div className="absolute -top-2.5 right-0 z-30 pb-1.5 transition-all duration-150 ease-out delay-150 opacity-0 pointer-events-none group-hover/sec:opacity-100 group-hover/sec:pointer-events-auto group-hover/sec:delay-0 no-print">
          <button
            type="button"
            onClick={handleHide}
            className="p-1.5 rounded-md bg-[var(--bg-sheet)]/95 backdrop-blur-xs border border-[var(--border-sheet)] shadow-xs text-[var(--text-faint)] hover:text-[var(--text-main)] hover:border-[var(--accent-base)] cursor-pointer flex items-center justify-center"
            title="Hide Taxonomy Section"
            aria-label="Hide Taxonomy Section"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 mb-6">
        <h2 className="flex items-center gap-1.5 shrink-0">
          <span
            className={
              isEditorial ?
                "font-serif italic text-lg text-[var(--accent-base)]"
              : "font-mono text-xs font-bold text-[var(--accent-base)]"
            }
          >
            <EditableText
              value={headerMeta.sectionNumber || "03."}
              onChange={(val) => onUpdateHeaderMeta("sectionNumber", val)}
              disabled={disabled}
            />
          </span>
          <span
            className={
              isEditorial ?
                "font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[var(--text-main)]"
              : "font-sans text-sm font-bold uppercase tracking-wider text-[var(--text-main)]"
            }
          >
            <EditableText
              value={headerMeta.title || "Core Systems & Architecture Competencies"}
              onChange={(val) => onUpdateHeaderMeta("title", val)}
              disabled={disabled}
            />
          </span>
        </h2>

        <span
          className={
            isEditorial ?
              "font-serif italic text-xs text-[var(--text-faint)] sm:text-right"
            : "font-mono text-[11px] text-[var(--text-faint)] sm:text-right"
          }
        >
          <EditableText
            value={
              headerMeta.subtitle || "Production Disciplines, Pipelines, & Technical Foundations"
            }
            onChange={(val) => onUpdateHeaderMeta("subtitle", val)}
            disabled={disabled}
          />
        </span>
      </div>

      {/* Tri-Column Architectural Matrix */}
      <div className="grid grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {taxonomy.map((col, cIdx) => (
          <div key={cIdx} className="space-y-4">
            <div className="pb-1 space-y-0.5">
              {/* Category Tag Header */}
              <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent-base)] font-semibold">
                <EditableText
                  value={col.categoryTag || "Track"}
                  onChange={(val) => onUpdateCategoryTag?.(cIdx, val)}
                  disabled={disabled}
                  placeholder="Category Tag"
                />
              </div>

              <h3
                className={
                  isEditorial ?
                    "font-serif font-medium text-xl text-[var(--text-main)]"
                  : "font-semibold text-xs uppercase tracking-wider text-[var(--text-main)]"
                }
              >
                <EditableText
                  value={col.title}
                  onChange={(val) => onUpdateCategoryTitle(cIdx, val)}
                  disabled={disabled}
                />
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {col.items.map((item, iIdx) => (
                <div key={iIdx} className="group/item relative pr-5">
                  {!disabled && col.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveItem(cIdx, iIdx)}
                      className="absolute right-0 top-0.5 p-0.5 text-[var(--text-faint)] hover:text-red-600 rounded opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 cursor-pointer no-print z-20"
                      title="Remove skill item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <div
                    className={
                      isEditorial ?
                        "font-serif font-medium text-base text-[var(--text-main)] leading-snug"
                      : "font-semibold text-xs text-[var(--text-main)] leading-snug"
                    }
                  >
                    <EditableText
                      value={item.name}
                      onChange={(val) => onUpdateItemName(cIdx, iIdx, val)}
                      disabled={disabled}
                    />
                  </div>

                  <div
                    className={`pt-0.5 text-[var(--text-muted)] ${
                      isEditorial ?
                        "font-serif text-sm leading-relaxed"
                      : "text-[11.5px] leading-relaxed"
                    }`}
                  >
                    <EditableText
                      value={item.detail}
                      onChange={(val) => onUpdateItemDetail(cIdx, iIdx, val)}
                      allowMarkdown={true}
                      disabled={disabled}
                    />
                  </div>
                </div>
              ))}

              {!disabled && (
                <div className="pt-2 no-print">
                  <button
                    type="button"
                    onClick={() => onAddItem(cIdx)}
                    className="text-[11px] font-mono text-[var(--text-faint)] hover:text-[var(--accent-base)] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title={`Add competency to ${col.title}`}
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Add Competency</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
