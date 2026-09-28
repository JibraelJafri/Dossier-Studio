import React, { useState } from "react";
import { LetterInfo, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { Trash2, Plus } from "lucide-react";

interface StatementSectionProps {
  letter: LetterInfo;
  typographyStyle: TypographyStyle;
  paragraphGap: number;
  onChangeParagraphGap?: (newGap: number) => void;
  onUpdateLetterMeta: <K extends keyof LetterInfo>(field: K, val: LetterInfo[K]) => void;
  onUpdateSalutation: (val: string) => void;
  onUpdateParagraph: (index: number, val: string) => void;
  onAddParagraph: () => void;
  onRemoveParagraph: (index: number) => void;
  disabled?: boolean;
}

export const StatementSection: React.FC<StatementSectionProps> = ({
  letter,
  typographyStyle,
  paragraphGap,
  onChangeParagraphGap,
  onUpdateLetterMeta,
  onUpdateSalutation,
  onUpdateParagraph,
  onAddParagraph,
  onRemoveParagraph,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";
  const [activeGapIdx, setActiveGapIdx] = useState<number | null>(null);

  return (
    <section className="transition-colors duration-200" aria-label="Statement of Intent">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-2 mb-4">
        <h2 className="flex items-baseline gap-2 shrink-0">
          <span
            className={
              isEditorial ?
                "font-serif italic text-lg text-(--accent-base)"
              : "font-mono text-xs font-bold text-(--accent-base)"
            }
          >
            <EditableText
              value={letter.sectionNumber || "01."}
              onChange={(val) => onUpdateLetterMeta("sectionNumber", val)}
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
              value={letter.sectionTitle || "Statement of Intent"}
              onChange={(val) => onUpdateLetterMeta("sectionTitle", val)}
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
            value={letter.sectionSubtitle || "Technical Manifesto & Systems Approach"}
            onChange={(val) => onUpdateLetterMeta("sectionSubtitle", val)}
            disabled={disabled}
          />
        </span>
      </div>

      <div className="mb-4">
        <EditableText
          as="p"
          value={letter.salutation}
          onChange={onUpdateSalutation}
          allowMarkdown={true}
          disabled={disabled}
          className={
            isEditorial ?
              "font-serif italic text-xl sm:text-2xl text-(--text-main)"
            : "font-sans font-semibold text-base text-(--text-main)"
          }
        />
      </div>

      {/* Paragraphs with Structural Spacing Preserved in Preview and PDF */}
      <div
        className={
          isEditorial ?
            "font-serif text-[18px] sm:text-[19px] leading-[1.82] text-(--text-body) tracking-normal"
          : "font-sans text-[15px] sm:text-[15.5px] leading-[1.72] text-(--text-body)"
        }
      >
        {letter.paragraphs.map((p, idx) => (
          <React.Fragment key={idx}>
            <div className="group/para relative">
              <EditableText
                as="p"
                value={p.content}
                onChange={(val) => onUpdateParagraph(idx, val)}
                allowMarkdown={true}
                showMarkdownToolbar={true}
                disabled={disabled}
                className="block cursor-text"
              />

              {!disabled && letter.paragraphs.length > 1 && (
                <div className="absolute -right-7 top-0 bottom-0 w-8 flex items-start pt-1.5 pl-2 z-20 opacity-0 group-hover/para:opacity-100 pointer-events-none group-hover/para:pointer-events-auto transition-all duration-150 ease-out delay-150 group-hover/para:delay-0 no-print">
                  <button
                    type="button"
                    onClick={() => onRemoveParagraph(idx)}
                    className="p-1 rounded text-(--text-faint) hover:text-red-600 hover:bg-(--bg-subtle) cursor-pointer relative before:absolute before:-inset-2 before:content-['']"
                    title="Remove paragraph"
                    aria-label={`Remove paragraph ${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {idx < letter.paragraphs.length - 1 && (
              <div
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={`Paragraph gap between paragraphs ${idx + 1} and ${idx + 2}`}
                aria-valuenow={paragraphGap}
                aria-valuemin={8}
                aria-valuemax={36}
                style={{ height: `${paragraphGap}px` }}
                className={`relative w-full transition-colors flex items-center justify-center outline-none ${
                  !disabled ?
                    "cursor-ns-resize group/pargap focus-visible:ring-1 focus-visible:ring-(--accent-base) rounded-xs"
                  : ""
                } ${activeGapIdx === idx ? "bg-(--accent-base)/10" : ""}`}
                onKeyDown={(e) => {
                  if (disabled || !onChangeParagraphGap) return;
                  if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                    e.preventDefault();
                    onChangeParagraphGap(Math.min(36, paragraphGap + (e.shiftKey ? 4 : 1)));
                  } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    onChangeParagraphGap(Math.max(8, paragraphGap - (e.shiftKey ? 4 : 1)));
                  } else if (e.key === "Home") {
                    e.preventDefault();
                    onChangeParagraphGap(8);
                  } else if (e.key === "End") {
                    e.preventDefault();
                    onChangeParagraphGap(36);
                  }
                }}
                onPointerDown={(e) => {
                  if (disabled || !onChangeParagraphGap) return;
                  e.preventDefault();
                  setActiveGapIdx(idx);
                  const startY = e.clientY;
                  const startVal = paragraphGap;

                  const handleMove = (ev: PointerEvent) => {
                    const delta = ev.clientY - startY;
                    const next = Math.max(8, Math.min(36, startVal + delta));
                    onChangeParagraphGap(ev.shiftKey ? Math.round(next / 4) * 4 : next);
                  };

                  const handleUp = () => {
                    setActiveGapIdx(null);
                    window.removeEventListener("pointermove", handleMove);
                    window.removeEventListener("pointerup", handleUp);
                  };

                  window.addEventListener("pointermove", handleMove);
                  window.addEventListener("pointerup", handleUp);
                }}
                onDoubleClick={() => !disabled && onChangeParagraphGap && onChangeParagraphGap(18)}
              >
                {!disabled && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none no-print"
                    data-pdf-remove="true"
                  >
                    <div className="w-full border-t border-dashed border-(--border-subtle) opacity-0 group-hover/pargap:opacity-60 transition-opacity" />
                    <span className="absolute px-1.5 py-0.2 rounded-full text-[8px] font-mono bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) opacity-0 group-hover/pargap:opacity-100 shadow-2xs transition-opacity">
                      ↕ {paragraphGap}px
                    </span>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {!disabled && (
        <div className="mt-4 pt-1 no-print flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onAddParagraph}
            className="text-xs font-mono text-(--text-faint) hover:text-(--accent-base) inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-dashed border-(--border-sheet) hover:border-(--accent-base) transition-colors cursor-pointer"
            title="Add a new paragraph to the statement"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Strategic Paragraph</span>
          </button>

          <span className="text-[11px] font-mono text-(--text-faint) select-none hidden sm:inline-block">
            Markdown active: <span className="text-(--text-muted) font-semibold">**bold**</span> ·{" "}
            <span className="text-(--text-muted) italic">*italic*</span> ·{" "}
            <span className="text-(--accent-base) underline">[link](url)</span> ·{" "}
            <span className="text-(--accent-base) font-mono">`code`</span>
          </span>
        </div>
      )}
    </section>
  );
};
