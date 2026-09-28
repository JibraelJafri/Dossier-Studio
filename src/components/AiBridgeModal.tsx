import React, { useState, useEffect, useRef } from "react";
import { DossierData, HistorySnapshot } from "../types.ts";
import { validateAndSanitizeDossierData } from "../utils/schemaValidator.ts";
import { safeStorage } from "../utils/storage.ts";
import {
  Sparkles,
  X,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Layers,
  FileText,
  Activity,
  Download,
  Upload,
  ClipboardPaste,
  AlertTriangle,
} from "lucide-react";

interface AiBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossierData: DossierData;
  onApplyData: (newData: DossierData) => void;
}

type SyncScope = "full" | "statement" | "benchmarks";

function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const AiBridgeModal: React.FC<AiBridgeModalProps> = ({
  isOpen,
  onClose,
  dossierData,
  onApplyData,
}) => {
  const [activeTab, setActiveTab] = useState<"sync" | "history">("sync");
  const [syncScope, setSyncScope] = useState<SyncScope>("full");
  const [jobContext, setJobContext] = useState("");
  const [pastedInput, setPastedInput] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    sanitizedData: DossierData;
    changes: string[];
    warnings: string[];
  } | null>(null);

  const [history, setHistory] = useState<HistorySnapshot[]>(() => {
    const stored = safeStorage.getItem("studio_dossier_history_v1");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setPastedInput("");
    setPendingChanges(null);

    const prevActive = document.activeElement as HTMLElement | null;
    modalContainerRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalContainerRef.current) {
        const focusable = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      prevActive?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const saveSnapshot = (dataToSnapshot: DossierData, label: string) => {
    const snap: HistorySnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: Date.now(),
      studio: dataToSnapshot.target.studio || "Generalized",
      role: dataToSnapshot.target.role || "Executive Dossier",
      summary: label,
      data: JSON.parse(JSON.stringify(dataToSnapshot)),
    };
    setHistory((prev) => {
      const updated = [snap, ...prev].slice(0, 20);
      safeStorage.setItem("studio_dossier_history_v1", JSON.stringify(updated));
      return updated;
    });
  };

  const generatePrompt = () => {
    const candidateName = dossierData.applicant.name || "Candidate";
    const candidateTitle = dossierData.applicant.title || "Technical Artist & Systems TD";

    const basePrompt = `You are an elite Principal Technical Director and Studio Technical Art Hiring Lead.
Your objective is to author an authoritative, versatile, generalized executive technical dossier and cover letter for:
- Candidate: ${candidateName}
- Professional Discipline / Focus: ${candidateTitle}
${jobContext.trim() ? `\nADDITIONAL TECHNICAL SPECIALTIES / DOMAIN FOCUS:\n${jobContext.trim()}\n` : ""}

CRITICAL OPERATIONAL CONSTRAINT — GENERALIZED TECHNICAL PROFILE:
Do NOT lock or tailor this content to any specific company, employer, studio name, or requisition ID. The copy must be generalized, universally compelling, and production-credible across all top-tier AAA game development and real-time interactive technology studios. Highlight technical architecture, procedural world generation, shader pipelines, low-level frametime budgets, and pipeline automation.`;

    if (syncScope === "statement") {
      return `${basePrompt}

TASK: Author a generalized Statement of Intent (executive technical cover letter prose).
Requirements:
1. Deliver a compelling statement of intent emphasizing technical depth: sub-millisecond frametime budgets, custom shader instruction culling, procedural generation graphs, and bridging artistic ambition with engine engineering.
2. Keep the salutation generalized (e.g. "Dear Technical Art Leads & Hiring Team,").
3. Do NOT target any single specific employer or company.

CURRENT PROSE JSON SCHEMA:
\`\`\`json
${JSON.stringify({ letter: dossierData.letter }, null, 2)}
\`\`\`

REQUIREMENT: Output ONLY a valid JSON object matching the schema above wrapped in a single \`\`\`json \`\`\` code block. No conversational filler or explanations.`;
    }

    if (syncScope === "benchmarks") {
      return `${basePrompt}

TASK: Generate 3 verified technical telemetry benchmarks and 3 core architecture competency columns.
Requirements:
1. Provide measurable, generalized production performance achievements (e.g., draw-call reduction, automation cook throughput, procedural territory scale, VRAM streaming).
2. Competency columns must represent core pillars: Shading & GPU Core, Procedural & Engine Systems, and Pipelines & Automation Toolchains.
3. Keep all metrics and competency categories generalized and applicable across premier real-time engines.

CURRENT BENCHMARKS & TAXONOMY:
\`\`\`json
${JSON.stringify(
  {
    metricsHeader: dossierData.metricsHeader,
    metrics: dossierData.metrics,
    taxonomyHeader: dossierData.taxonomyHeader,
    taxonomy: dossierData.taxonomy,
  },
  null,
  2,
)}
\`\`\`

REQUIREMENT: Output ONLY a valid JSON object matching the schema above wrapped in a single \`\`\`json \`\`\` code block. No conversational filler.`;
    }

    return `${basePrompt}

TASK: Generate a complete generalized executive technical dossier.
Requirements:
1. Target and requisition metadata fields must remain generalized (e.g., attention to "Technical Art & Systems Leadership", studio identifier as "Premier AAA Studio / Interactive Tech", track as "Core Engine, Worldbuilding & Pipelines").
2. The statement prose, 3 telemetry benchmark cards, and 3 taxonomy competency columns must be generalized, high-impact, and universally persuasive.
3. Retain the candidate's personal contact details in applicant and signoff.

CURRENT MASTER DOSSIER:
\`\`\`json
${JSON.stringify(dossierData, null, 2)}
\`\`\`

REQUIREMENT: Output ONLY the valid JSON object wrapped in a single \`\`\`json \`\`\` code block. No commentary.`;
  };

  const handleCopyPrompt = async () => {
    const promptText = generatePrompt();
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      if (textareaRef.current) {
        textareaRef.current.value = promptText;
        textareaRef.current.select();
        document.execCommand("copy");
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
      }
    }
  };

  const parseAndVerifyInput = (text: string) => {
    let clean = text.trim();

    const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      clean = fenceMatch[1].trim();
    } else {
      clean = clean
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      const firstBrace = clean.indexOf("{");
      const lastBrace = clean.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
      }
    }

    try {
      const parsed = JSON.parse(clean);
      const validation = validateAndSanitizeDossierData(parsed, dossierData);
      setPendingChanges({
        sanitizedData: validation.data,
        changes: validation.changes,
        warnings: validation.warnings,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid syntax";
      setPendingChanges({
        sanitizedData: dossierData,
        changes: [],
        warnings: [
          `Failed to parse JSON: ${message}. Please ensure model output contains a valid JSON payload.`,
        ],
      });
    }
  };

  const handleApply = () => {
    if (!pendingChanges) return;
    saveSnapshot(dossierData, "Pre-sync checkpoint");
    onApplyData(pendingChanges.sanitizedData);
    saveSnapshot(
      pendingChanges.sanitizedData,
      pendingChanges.changes.length > 0 ?
        pendingChanges.changes.join(" · ")
      : "AI generalized update",
    );
    onClose();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPastedInput(text);
      parseAndVerifyInput(text);
    } catch {
      textareaRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-100 flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-sync-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-(--bg-sheet) border border-(--border-sheet) rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto text-xs focus:outline-none"
      >
        <header className="px-5 py-4 border-b border-(--border-sheet) flex items-center justify-between bg-(--bg-subtle) shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-(--accent-soft) flex items-center justify-center text-(--accent-base) shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="ai-sync-modal-title"
                className="font-bold text-sm text-(--text-main) leading-tight"
              >
                AI Dossier Assistant (Generalized Workflow)
              </h3>
              <p className="text-[11px] text-(--text-muted)">
                Synthesize versatile, high-impact technical copy for ChatGPT, Claude, Gemini, or
                DeepSeek.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-main) p-1.5 rounded-lg border border-(--border-sheet) hover:border-(--accent-base) cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <nav className="flex border-b border-(--border-sheet) bg-(--bg-sheet) px-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("sync")}
            className={`py-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sync" ?
                "border-(--accent-base) text-(--accent-base)"
              : "border-transparent text-(--text-muted) hover:text-(--text-main)"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workflow Bridge</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-2.5 px-3 font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history" ?
                "border-(--accent-base) text-(--accent-base)"
              : "border-transparent text-(--text-muted) hover:text-(--text-main)"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Version History ({history.length})</span>
          </button>
        </nav>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === "sync" && (
            <>
              <section className="p-4 rounded-xl border border-(--border-sheet) bg-(--bg-subtle)/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-(--accent-base) text-white font-mono text-[10px] flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="font-bold text-xs uppercase font-mono tracking-wider text-(--text-main)">
                      Copy Generalized AI Prompt
                    </span>
                  </div>
                  <span className="text-[11px] text-(--text-faint)">Step 1 of 2</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSyncScope("full")}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      syncScope === "full" ?
                        "bg-(--accent-soft) border-(--accent-border) text-(--accent-base) font-semibold"
                      : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) hover:text-(--text-main)"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 mb-1" />
                    <div className="font-semibold text-[11px]">Full Dossier</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyncScope("statement")}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      syncScope === "statement" ?
                        "bg-(--accent-soft) border-(--accent-border) text-(--accent-base) font-semibold"
                      : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) hover:text-(--text-main)"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 mb-1" />
                    <div className="font-semibold text-[11px]">Statement Prose</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyncScope("benchmarks")}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      syncScope === "benchmarks" ?
                        "bg-(--accent-soft) border-(--accent-border) text-(--accent-base) font-semibold"
                      : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) hover:text-(--text-main)"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 mb-1" />
                    <div className="font-semibold text-[11px]">Metrics & Skills</div>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={jobContext}
                  onChange={(e) => setJobContext(e.target.value)}
                  placeholder="Optional: Highlight technical specialties or engine domains (e.g. 'Emphasize Unreal Engine 5.4 PCG, compute HLSL, and Maya/Python pipelines')..."
                  className="w-full text-xs font-mono p-2.5 rounded-lg bg-(--bg-sheet) border border-(--border-sheet) text-(--text-main) focus:outline-none focus:border-(--accent-base)"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-(--text-muted)">
                    Compatible with ChatGPT, Claude, Gemini &amp; DeepSeek
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-4 py-1.5 bg-(--accent-base) hover:opacity-95 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedPrompt ?
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Prompt Copied!</span>
                      </>
                    : <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    }
                  </button>
                </div>
              </section>

              <section className="p-4 rounded-xl border border-(--border-sheet) bg-(--bg-subtle)/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-(--accent-base) text-white font-mono text-[10px] flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="font-bold text-xs uppercase font-mono tracking-wider text-(--text-main)">
                      Apply AI Output
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[11px] font-mono text-(--accent-base) hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Clipboard</span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={3}
                  value={pastedInput}
                  onChange={(e) => {
                    setPastedInput(e.target.value);
                    if (e.target.value.trim()) {
                      parseAndVerifyInput(e.target.value);
                    } else {
                      setPendingChanges(null);
                    }
                  }}
                  placeholder="Paste the generated JSON response here..."
                  className="w-full text-xs font-mono p-2.5 rounded-lg bg-(--bg-sheet) border border-(--border-sheet) text-(--text-main) focus:outline-none focus:border-(--accent-base)"
                />

                {pendingChanges && (
                  <div className="space-y-2">
                    {pendingChanges.changes.length > 0 ?
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Verified Updates Ready to Apply:</span>
                        </div>
                        <ul className="list-disc list-inside font-mono text-[11px] opacity-90">
                          {pendingChanges.changes.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    : pendingChanges.warnings.length === 0 ?
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px]">
                        Payload verified against schema. All fields match current document state.
                      </div>
                    : null}

                    {pendingChanges.warnings.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Validation Notice:</span>
                        </div>
                        <ul className="list-disc list-inside font-mono text-[11px] opacity-90">
                          {pendingChanges.warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(pendingChanges.changes.length > 0 ||
                      pendingChanges.warnings.length === 0) && (
                      <button
                        type="button"
                        onClick={handleApply}
                        className="w-full py-2 bg-(--accent-base) hover:opacity-95 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.99]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply Updates to Document &amp; Archive Snapshot</span>
                      </button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-(--border-sheet)">
                <span className="font-bold text-[11px] uppercase tracking-wider text-(--text-muted)">
                  Archived Document Snapshots
                </span>
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Clear snapshot history?")) {
                        setHistory([]);
                        safeStorage.removeItem("studio_dossier_history_v1");
                      }
                    }}
                    className="text-[11px] text-(--text-faint) hover:text-red-500 cursor-pointer"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {history.length === 0 ?
                <div className="text-center py-8 text-(--text-muted)">
                  No snapshots recorded yet. Updates applied via AI or manual saves are tracked
                  here.
                </div>
              : <div className="space-y-2">
                  {history.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 rounded-xl border border-(--border-sheet) bg-(--bg-subtle)/50 flex items-center justify-between gap-3 hover:bg-(--bg-subtle) transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-(--text-main) truncate">
                          {snap.studio} · {snap.role}
                        </div>
                        <div className="text-[11px] text-(--accent-base) truncate font-mono">
                          {snap.summary}
                        </div>
                        <div className="text-[10px] text-(--text-faint) font-mono">
                          {formatRelativeTime(snap.timestamp)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onApplyData(snap.data);
                          onClose();
                        }}
                        className="px-3 py-1 rounded-lg border border-(--border-sheet) bg-(--bg-sheet) hover:border-(--accent-base) text-(--text-main) font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-(--border-sheet) bg-(--bg-subtle) flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([JSON.stringify(dossierData, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `dossier_${(dossierData.applicant.name || "master").toLowerCase().replace(/[^a-z0-9]/g, "_")}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-[11px] text-(--text-muted) hover:text-(--text-main) flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="text-[11px] text-(--text-muted) hover:text-(--text-main) flex items-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const parsed = JSON.parse(ev.target?.result as string);
                      const valid = validateAndSanitizeDossierData(parsed, dossierData);
                      saveSnapshot(dossierData, "Pre-import checkpoint");
                      onApplyData(valid.data);
                      saveSnapshot(valid.data, `Imported JSON: ${file.name}`);
                      onClose();
                    } catch {
                      alert("Invalid JSON file.");
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-(--border-sheet) bg-(--bg-sheet) hover:bg-(--bg-muted) text-(--text-main) font-semibold text-xs cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};
