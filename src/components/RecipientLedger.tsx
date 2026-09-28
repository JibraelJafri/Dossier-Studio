import React from "react";
import { TargetInfo, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { EyeOff } from "lucide-react";

interface RecipientLedgerProps {
  target: TargetInfo;
  typographyStyle?: TypographyStyle;
  onUpdateTarget: <K extends keyof TargetInfo>(field: K, val: TargetInfo[K]) => void;
  onHide?: () => void;
  disabled?: boolean;
}

export const RecipientLedger: React.FC<RecipientLedgerProps> = ({
  target,
  typographyStyle = "editorial",
  onUpdateTarget,
  onHide,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";

  return (
    <section
      className="group/ledger relative py-3.5 sm:py-4 px-5 sm:px-6 bg-[var(--bg-subtle)]/60 rounded-2xl text-xs transition-colors duration-200"
      aria-label="Submission Record Ledger"
    >
      {!disabled && onHide && (
        <div className="absolute -top-2.5 -right-2.5 z-30 transition-all duration-150 ease-out delay-150 opacity-0 pointer-events-none group-hover/ledger:opacity-100 group-hover/ledger:pointer-events-auto group-hover/ledger:delay-0 no-print">
          <button
            type="button"
            onClick={onHide}
            className="p-1.5 rounded-md bg-[var(--bg-sheet)]/95 backdrop-blur-xs border border-[var(--border-sheet)] shadow-xs text-[var(--text-faint)] hover:text-[var(--text-main)] hover:border-[var(--accent-base)] cursor-pointer flex items-center justify-center relative before:absolute before:-inset-2 before:content-['']"
            title="Hide Recipient Ledger"
            aria-label="Hide Recipient Ledger"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Strict 4-column ledger matching the 896px sheet without multi-row collapsing */}
      <div className="grid grid-cols-4 gap-4 sm:gap-6 items-start">
        <div className="space-y-1 min-w-0">
          <div
            className={
              isEditorial ?
                "font-serif italic text-xs text-[var(--text-faint)]"
              : "text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]"
            }
          >
            <EditableText
              value={target.attentionLabel || "Attention"}
              onChange={(val) => onUpdateTarget("attentionLabel", val)}
              disabled={disabled}
            />
          </div>
          <div
            className={
              isEditorial ?
                "font-serif font-medium text-base text-[var(--text-main)] leading-snug break-words"
              : "font-semibold text-xs text-[var(--text-main)] leading-snug break-words"
            }
          >
            <EditableText
              value={target.recipientTitle}
              onChange={(val) => onUpdateTarget("recipientTitle", val)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div
            className={
              isEditorial ?
                "font-serif italic text-xs text-[var(--text-faint)]"
              : "text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]"
            }
          >
            <EditableText
              value={target.departmentLabel || "Studio Group"}
              onChange={(val) => onUpdateTarget("departmentLabel", val)}
              disabled={disabled}
            />
          </div>
          <div
            className={
              isEditorial ?
                "font-serif text-sm font-medium text-[var(--text-body)] leading-snug break-words"
              : "text-xs text-[var(--text-body)] font-medium leading-snug break-words"
            }
          >
            <EditableText
              value={target.department}
              onChange={(val) => onUpdateTarget("department", val)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div
            className={
              isEditorial ?
                "font-serif italic text-xs text-[var(--text-faint)]"
              : "text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]"
            }
          >
            <EditableText
              value={target.studioLabel || "Target Studio"}
              onChange={(val) => onUpdateTarget("studioLabel", val)}
              disabled={disabled}
            />
          </div>
          <div
            className={
              isEditorial ?
                "font-serif text-sm font-medium text-[var(--text-body)] leading-snug break-words"
              : "text-xs text-[var(--text-body)] font-medium leading-snug break-words"
            }
          >
            <EditableText
              value={target.studio}
              onChange={(val) => onUpdateTarget("studio", val)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-1 min-w-0">
          <div
            className={
              isEditorial ?
                "font-serif italic text-xs text-[var(--text-faint)]"
              : "text-[10px] font-mono uppercase tracking-wider text-[var(--text-faint)]"
            }
          >
            <EditableText
              value={target.dateLabel || "Submission Date"}
              onChange={(val) => onUpdateTarget("dateLabel", val)}
              disabled={disabled}
            />
          </div>
          <div
            className={
              isEditorial ?
                "font-serif text-sm font-medium text-[var(--text-body)] leading-snug break-words"
              : "text-xs text-[var(--text-body)] font-medium leading-snug break-words"
            }
          >
            <EditableText
              value={target.date}
              onChange={(val) => onUpdateTarget("date", val)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
