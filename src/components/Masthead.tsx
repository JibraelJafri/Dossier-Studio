import React from "react";
import { ApplicantInfo, TargetInfo, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { EyeOff } from "lucide-react";

interface MastheadProps {
  applicant: ApplicantInfo;
  target: TargetInfo;
  typographyStyle?: TypographyStyle;
  showHeaderKicker: boolean;
  onToggleHeaderKicker: () => void;
  showTargetCard: boolean;
  onToggleTargetCard: () => void;
  showAvailability: boolean;
  onToggleAvailability: () => void;
  onUpdateApplicant: <K extends keyof ApplicantInfo>(field: K, val: ApplicantInfo[K]) => void;
  onUpdateTarget: <K extends keyof TargetInfo>(field: K, val: TargetInfo[K]) => void;
  disabled?: boolean;
}

export const Masthead: React.FC<MastheadProps> = ({
  applicant,
  target,
  typographyStyle = "editorial",
  showHeaderKicker,
  onToggleHeaderKicker,
  showTargetCard,
  onToggleTargetCard,
  showAvailability,
  onToggleAvailability,
  onUpdateApplicant,
  onUpdateTarget,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";

  return (
    <header className="pt-1 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 lg:gap-8">
        {/* Left: Applicant Identity */}
        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
          {/* Header Kicker */}
          {showHeaderKicker && (
            <div className="group/kicker relative inline-flex items-center">
              <span
                className={`inline-block text-[11px] ${
                  isEditorial ?
                    "font-serif italic text-xs tracking-wide text-(--text-faint)"
                  : "font-mono uppercase tracking-wider text-(--text-faint)"
                }`}
              >
                <EditableText
                  value={
                    applicant.dossierKicker || "Candidate Dossier / Technical Art & Systems TD"
                  }
                  onChange={(val) => onUpdateApplicant("dossierKicker", val)}
                  disabled={disabled}
                  className="hover:text-(--text-main) transition-colors"
                />
              </span>

              {!disabled && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 pl-2 flex items-center z-30 transition-all duration-150 ease-out opacity-0 pointer-events-none group-hover/kicker:opacity-100 group-hover/kicker:pointer-events-auto no-print">
                  <button
                    type="button"
                    onClick={onToggleHeaderKicker}
                    className="p-1 rounded-md bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) shadow-xs text-(--text-faint) hover:text-(--text-main) hover:border-(--accent-base) cursor-pointer flex items-center justify-center"
                    title="Hide header kicker"
                    aria-label="Hide header kicker"
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <EditableText
              as="h1"
              value={applicant.name}
              onChange={(val) => onUpdateApplicant("name", val)}
              disabled={disabled}
              className={
                isEditorial ?
                  "font-serif text-4xl sm:text-5xl lg:text-[48px] font-normal tracking-tight text-(--text-main) leading-[1.08] block"
                : "font-sans text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-(--text-main) leading-[1.1] block"
              }
            />

            <EditableText
              as="p"
              value={applicant.title}
              onChange={(val) => onUpdateApplicant("title", val)}
              disabled={disabled}
              className={
                isEditorial ?
                  "font-serif italic text-lg sm:text-[21px] text-(--accent-base) tracking-normal mt-2.5 sm:mt-3 font-medium block"
                : "font-sans text-base sm:text-[18px] font-semibold text-(--accent-base) tracking-tight mt-2.5 sm:mt-3 block"
              }
            />
          </div>

          {/* Contact Details */}
          <div className="pt-2 text-[12px] text-(--text-muted) flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-normal">
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <EditableText
                value={applicant.location}
                onChange={(val) => onUpdateApplicant("location", val)}
                disabled={disabled}
              />
              <span className="text-(--text-faint) select-none opacity-60" aria-hidden="true">
                ·
              </span>
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <EditableText
                as="a"
                href={`tel:${applicant.phone.replace(/[^0-9+]/g, "")}`}
                value={applicant.phone}
                onChange={(val) => onUpdateApplicant("phone", val)}
                disabled={disabled}
                className="hover:text-(--text-main) transition-colors"
              />
              <span className="text-(--text-faint) select-none opacity-60" aria-hidden="true">
                ·
              </span>
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <EditableText
                as="a"
                href={`mailto:${applicant.email}`}
                value={applicant.email}
                onChange={(val) => onUpdateApplicant("email", val)}
                disabled={disabled}
                className="hover:text-(--accent-base) transition-colors"
              />
              <span className="text-(--text-faint) select-none opacity-60" aria-hidden="true">
                ·
              </span>
            </span>
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              <EditableText
                as="a"
                href={
                  (
                    applicant.artstation.startsWith("http://") ||
                    applicant.artstation.startsWith("https://")
                  ) ?
                    applicant.artstation
                  : `https://${applicant.artstation}`
                }
                target="_blank"
                value={applicant.artstation}
                onChange={(val) => onUpdateApplicant("artstation", val)}
                disabled={disabled}
                className="hover:text-(--text-main) hover:underline transition-colors"
              />
              <span className="text-(--text-faint) select-none opacity-60" aria-hidden="true">
                ·
              </span>
            </span>
            <span className="inline-flex items-center whitespace-nowrap">
              <EditableText
                as="a"
                href={
                  (
                    applicant.website.startsWith("http://") ||
                    applicant.website.startsWith("https://")
                  ) ?
                    applicant.website
                  : `https://${applicant.website}`
                }
                target="_blank"
                value={applicant.website}
                onChange={(val) => onUpdateApplicant("website", val)}
                disabled={disabled}
                className="font-medium text-(--accent-base) hover:underline transition-colors"
              />
            </span>
          </div>
        </div>

        {/* Right: Target Capsule */}
        {showTargetCard && (
          <aside
            className="group/target relative bg-(--bg-subtle)/80 dark:bg-(--bg-subtle)/60 border border-(--border-sheet)/80 dark:border-(--border-subtle) rounded-2xl p-4 sm:p-5 text-xs w-full max-w-[340px] md:w-[340px] shrink-0 space-y-3.5 shadow-2xs transition-all duration-200"
            aria-label="Target Requisition Metadata"
          >
            {!disabled && (
              <div className="absolute -top-2.5 -right-2.5 z-30 transition-all duration-150 ease-out opacity-0 pointer-events-none group-hover/target:opacity-100 group-hover/target:pointer-events-auto no-print">
                <button
                  type="button"
                  onClick={onToggleTargetCard}
                  className="p-1.5 rounded-md bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) shadow-xs text-(--text-faint) hover:text-(--text-main) hover:border-(--accent-base) cursor-pointer flex items-center justify-center"
                  title="Hide Target Card"
                  aria-label="Hide Target Card"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-(--text-faint)">
              <div className="min-w-0 flex-1 truncate mr-2">
                <EditableText
                  value={target.cardHeaderLabel || "Target Requisition"}
                  onChange={(val) => onUpdateTarget("cardHeaderLabel", val)}
                  disabled={disabled}
                  className={
                    isEditorial ?
                      "font-serif italic text-xs tracking-normal text-(--text-muted)"
                    : "font-mono text-[10px] font-semibold text-(--text-muted) tracking-wider"
                  }
                />
              </div>

              <div className="flex items-center shrink-0 ml-auto">
                <span className="font-mono text-[9px] uppercase tracking-wider bg-(--bg-sheet) border border-(--border-subtle) px-2 py-0.5 rounded-full text-(--text-faint) shadow-2xs select-none">
                  <EditableText
                    value={target.cardBadgeLabel || "CONFIDENTIAL"}
                    onChange={(val) => onUpdateTarget("cardBadgeLabel", val)}
                    disabled={disabled}
                  />
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-0.5">
              <div className="text-[9.5px] uppercase tracking-wider text-(--text-faint)">
                <EditableText
                  value={
                    target.statusLabel && target.statusLabel !== "Status" ?
                      target.statusLabel
                    : "Target Studio"
                  }
                  onChange={(val) => onUpdateTarget("statusLabel", val)}
                  disabled={disabled}
                  className={isEditorial ? "font-serif italic" : "font-mono"}
                />
              </div>
              <EditableText
                as="div"
                value={target.studio}
                onChange={(val) => onUpdateTarget("studio", val)}
                disabled={disabled}
                className={
                  isEditorial ?
                    "font-serif font-bold text-[20px] text-(--text-main) leading-snug tracking-tight block"
                  : "font-sans font-extrabold text-[17px] text-(--text-main) leading-snug tracking-tight block"
                }
              />
              <EditableText
                as="div"
                value={target.role}
                onChange={(val) => onUpdateTarget("role", val)}
                disabled={disabled}
                className={
                  isEditorial ?
                    "font-serif italic text-[14px] text-(--accent-base) font-medium leading-normal block mt-0.5"
                  : "font-sans text-[12.5px] font-semibold text-(--accent-base) tracking-tight leading-normal block mt-0.5"
                }
              />
            </div>

            <div className="pt-2.5 border-t border-(--border-sheet)/60">
              <div className="grid grid-cols-[105px_1fr] gap-3 text-[11px] items-start">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] text-(--text-faint) uppercase tracking-wider block font-mono">
                    <EditableText
                      value={target.dateLabel || "Date of Record"}
                      onChange={(val) => onUpdateTarget("dateLabel", val)}
                      disabled={disabled}
                      className={isEditorial ? "font-serif italic capitalize" : "font-mono"}
                    />
                  </span>
                  <div className="text-(--text-body) font-medium whitespace-nowrap">
                    <EditableText
                      value={target.date}
                      onChange={(val) => onUpdateTarget("date", val)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-0.5 min-w-0">
                  <span className="text-[9.5px] text-(--text-faint) uppercase tracking-wider block font-mono">
                    <EditableText
                      value={target.locationLabel || "Mobility & Notice"}
                      onChange={(val) => onUpdateTarget("locationLabel", val)}
                      disabled={disabled}
                      className={isEditorial ? "font-serif italic capitalize" : "font-mono"}
                    />
                  </span>
                  <div
                    className="text-(--text-body) font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                    title={target.location}
                  >
                    <EditableText
                      value={target.location}
                      onChange={(val) => onUpdateTarget("location", val)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {showAvailability && (
              <div className="group/avail relative inline-flex items-center pt-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-(--bg-sheet) border border-(--border-subtle) text-(--accent-base) shadow-2xs">
                  <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                    <span className="animate-ping availability-ping absolute inline-flex h-full w-full rounded-full bg-(--accent-base) opacity-40"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-(--accent-base)"></span>
                  </span>
                  <EditableText
                    value={target.availability}
                    onChange={(val) => onUpdateTarget("availability", val)}
                    disabled={disabled}
                    className="leading-none whitespace-nowrap"
                  />
                </div>

                {!disabled && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 pl-2 flex items-center z-30 transition-all duration-150 ease-out opacity-0 pointer-events-none group-hover/avail:opacity-100 group-hover/avail:pointer-events-auto no-print">
                    <button
                      type="button"
                      onClick={onToggleAvailability}
                      className="p-1 rounded-md bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) shadow-xs text-(--text-faint) hover:text-(--text-main) hover:border-(--accent-base) cursor-pointer flex items-center justify-center"
                      title="Hide availability badge"
                      aria-label="Hide availability badge"
                    >
                      <EyeOff className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </header>
  );
};
