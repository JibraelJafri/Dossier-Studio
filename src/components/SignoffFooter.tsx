import React, { useState, useRef, useEffect } from "react";
import { ApplicantInfo, SignoffInfo, SignoffMeta, TypographyStyle } from "../types.ts";
import { EditableText } from "./EditableText.tsx";
import { DossierQrCode } from "./DossierQrCode.tsx";
import { EyeOff, Pencil, ExternalLink, Check, X } from "lucide-react";

interface SignoffFooterProps {
  signoff: SignoffInfo;
  applicant: ApplicantInfo;
  signoffMeta?: SignoffMeta;
  typographyStyle?: TypographyStyle;
  showSignoffMeta: boolean;
  onToggleSignoffMeta: () => void;
  showFooterStamp: boolean;
  onToggleFooterStamp: () => void;
  onUpdateSignoff: <K extends keyof SignoffInfo>(field: K, val: SignoffInfo[K]) => void;
  onUpdateSignoffMeta: <K extends keyof SignoffMeta>(field: K, val: SignoffMeta[K]) => void;
  onUpdateApplicant?: <K extends keyof ApplicantInfo>(field: K, val: ApplicantInfo[K]) => void;
  disabled?: boolean;
}

export const SignoffFooter: React.FC<SignoffFooterProps> = ({
  signoff,
  applicant,
  signoffMeta = {
    recordBadge: "RECORD VERIFIED / 2026",
    portfolioLabel: "Full Portfolio & Architecture Breakdown",
    directChannelLabel: "Direct Engineering Channel",
    footerSpecNote: "Verified Systems Spec",
    footerPageNote: "1-PAGE CALIBRATED DOSSIER",
  },
  typographyStyle = "editorial",
  showSignoffMeta,
  onToggleSignoffMeta,
  showFooterStamp,
  onToggleFooterStamp,
  onUpdateSignoff,
  onUpdateSignoffMeta,
  onUpdateApplicant,
  disabled = false,
}) => {
  const isEditorial = typographyStyle === "editorial";

  const currentQrTarget =
    applicant.qrUrl?.trim() ||
    applicant.website?.trim() ||
    applicant.artstation?.trim() ||
    "portfolio.example.com";

  const normalizedQrUrl =
    (
      currentQrTarget.startsWith("http://") ||
      currentQrTarget.startsWith("https://") ||
      currentQrTarget.startsWith("mailto:")
    ) ?
      currentQrTarget
    : `https://${currentQrTarget}`;

  const cleanDisplayHost = normalizedQrUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "");

  const [isEditingQr, setIsEditingQr] = useState(false);
  const [editUrl, setEditUrl] = useState(currentQrTarget);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditingQr) {
      setEditUrl(currentQrTarget);
    }
  }, [currentQrTarget, isEditingQr]);

  useEffect(() => {
    if (!isEditingQr) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsEditingQr(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditingQr(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingQr]);

  const handleSaveQr = (urlToSave?: string) => {
    const val = (urlToSave !== undefined ? urlToSave : editUrl).trim();
    if (val && onUpdateApplicant) {
      onUpdateApplicant("qrUrl", val);
    }
    setIsEditingQr(false);
  };

  return (
    <footer className="pt-1 pb-1 space-y-5 sm:space-y-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pt-1">
        {/* Left Signature Block */}
        <div className="space-y-1 min-w-0">
          <EditableText
            as="p"
            value={signoff.valediction}
            onChange={(val) => onUpdateSignoff("valediction", val)}
            disabled={disabled}
            className={
              isEditorial ?
                "font-serif italic text-base sm:text-lg text-(--text-muted) leading-tight"
              : "text-[10.5px] font-semibold uppercase tracking-wider text-(--text-faint) leading-tight"
            }
          />

          <EditableText
            as="p"
            value={signoff.name}
            onChange={(val) => onUpdateSignoff("name", val)}
            disabled={disabled}
            className={
              isEditorial ?
                "font-serif italic text-3xl sm:text-4xl text-(--text-main) font-normal tracking-wide leading-none py-1"
              : "text-2xl sm:text-[28px] font-bold tracking-tight text-(--text-main) leading-none py-1"
            }
          />

          <EditableText
            as="p"
            value={signoff.roleTitle}
            onChange={(val) => onUpdateSignoff("roleTitle", val)}
            disabled={disabled}
            className={
              isEditorial ?
                "font-serif text-[14px] sm:text-base tracking-wide text-(--accent-base) leading-tight font-medium mt-1.5 block"
              : "text-[12.5px] sm:text-[13px] font-medium tracking-tight text-(--accent-base) leading-tight mt-1.5 block"
            }
          />
        </div>

        {/* Right QR Block */}
        {showSignoffMeta && (
          <div className="group/qr-anchor relative shrink-0 sm:self-end">
            {!disabled && !isEditingQr && (
              <div className="absolute bottom-full right-0 pb-2 pt-1 px-1 -mr-1 z-30 transition-all duration-150 ease-out delay-150 opacity-0 pointer-events-none group-hover/qr-anchor:opacity-100 group-hover/qr-anchor:pointer-events-auto group-hover/qr-anchor:delay-0 no-print flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditUrl(currentQrTarget);
                    setIsEditingQr(true);
                  }}
                  className="p-1 rounded bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) text-(--text-faint) hover:text-(--accent-base) shadow-2xs transition-colors cursor-pointer"
                  title="Edit QR link destination"
                >
                  <Pencil className="w-3 h-3" />
                </button>

                <a
                  href={normalizedQrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) text-(--text-faint) hover:text-(--accent-base) shadow-2xs transition-colors cursor-pointer"
                  title={`Open: ${currentQrTarget}`}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={onToggleSignoffMeta}
                  className="p-1 rounded bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) text-(--text-faint) hover:text-(--text-main) shadow-2xs transition-colors cursor-pointer"
                  title="Hide QR code"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>
            )}

            <a
              href={normalizedQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!disabled) {
                  e.preventDefault();
                  setEditUrl(currentQrTarget);
                  setIsEditingQr(true);
                }
              }}
              className="block cursor-pointer hover:opacity-90 transition-opacity"
              title={
                disabled ?
                  `Visit ${cleanDisplayHost}`
                : `Click to configure URL or scan: ${cleanDisplayHost}`
              }
            >
              <DossierQrCode
                value={normalizedQrUrl}
                size={67}
                className="text-(--text-main) block"
                eyeColor="var(--accent-base)"
              />
            </a>

            {isEditingQr && !disabled && (
              <div
                ref={popoverRef}
                className="absolute right-0 bottom-full mb-2.5 z-50 w-72 p-3 bg-(--bg-sheet) border border-(--border-sheet) rounded-xl shadow-xl space-y-2.5 text-xs no-print text-left"
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-(--border-sheet)">
                  <span className="font-mono text-[10.5px] uppercase font-semibold text-(--text-main)">
                    Configure QR Destination
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingQr(false)}
                    className="p-0.5 rounded text-(--text-faint) hover:text-(--text-main) cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-(--text-faint) block">
                    Target URL
                  </label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveQr();
                      if (e.key === "Escape") setIsEditingQr(false);
                    }}
                    placeholder="portfolio.example.com"
                    autoFocus
                    className="w-full px-2.5 py-1.5 bg-(--bg-subtle) border border-(--border-sheet) rounded-lg text-xs font-mono text-(--text-main) outline-none focus:border-(--accent-base)"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9.5px] font-mono text-(--text-faint) truncate max-w-[130px]">
                    {cleanDisplayHost}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingQr(false)}
                      className="px-2 py-1 text-[11px] text-(--text-muted) hover:text-(--text-main) cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveQr()}
                      className="px-2.5 py-1 bg-(--accent-base) text-white text-[11px] font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showFooterStamp && (
        <div className="group/stamp relative pt-3 flex flex-col sm:flex-row items-center sm:items-baseline justify-between text-[11px] text-(--text-faint) gap-2">
          {!disabled && (
            <div className="absolute -top-3 right-0 z-30 pb-1.5 transition-all duration-150 ease-out delay-150 opacity-0 pointer-events-none group-hover/stamp:opacity-100 group-hover/stamp:pointer-events-auto group-hover/stamp:delay-0 no-print">
              <button
                type="button"
                onClick={onToggleFooterStamp}
                className="p-1 rounded-md bg-(--bg-sheet)/95 backdrop-blur-xs border border-(--border-sheet) shadow-xs text-(--text-faint) hover:text-(--text-main) hover:border-(--accent-base) cursor-pointer flex items-center justify-center"
                title="Hide footer note"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1">
            <span className={isEditorial ? "font-serif italic" : ""}>Candidate Dossier</span>
            <span className="text-(--text-faint) select-none" aria-hidden="true">
              ·
            </span>
            <span
              className={
                isEditorial ?
                  "font-serif font-medium text-(--text-body)"
                : "font-medium text-(--text-body)"
              }
            >
              {applicant.name}
            </span>
            <span className="text-(--text-faint) select-none" aria-hidden="true">
              ·
            </span>
            <EditableText
              value={signoffMeta.footerSpecNote || "Verified Systems Spec"}
              onChange={(val) => onUpdateSignoffMeta("footerSpecNote", val)}
              disabled={disabled}
              className={isEditorial ? "font-serif italic" : ""}
            />
          </div>

          <div className="font-mono text-[10px] tracking-wider uppercase text-right">
            <EditableText
              value={signoffMeta.footerPageNote || "1-PAGE CALIBRATED DOSSIER"}
              onChange={(val) => onUpdateSignoffMeta("footerPageNote", val)}
              disabled={disabled}
              className="text-right"
            />
          </div>
        </div>
      )}
    </footer>
  );
};
