import { useEffect } from "react";

interface KeyboardShortcutOptions {
  isPreviewMode: boolean;
  onTogglePreview: (updater: (prev: boolean) => boolean) => void;
  isAiModalOpen: boolean;
  onCloseAiModal: () => void;
  isPdfModalOpen: boolean;
  onClosePdfModal: () => void;
}

export function useKeyboardShortcuts({
  isPreviewMode,
  onTogglePreview,
  isAiModalOpen,
  onCloseAiModal,
  isPdfModalOpen,
  onClosePdfModal,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAiModalOpen || isPdfModalOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          onCloseAiModal();
          onClosePdfModal();
        }
        return;
      }

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;

      const isActivelyEditing =
        Boolean(target) &&
        (target!.isContentEditable ||
          target!.tagName === "INPUT" ||
          target!.tagName === "TEXTAREA");

      if (e.key === "Escape" && isPreviewMode) {
        e.preventDefault();
        onTogglePreview(() => false);
        return;
      }

      if (isCmdOrCtrl && (e.key.toLowerCase() === "p" || e.key === "Enter")) {
        e.preventDefault();
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onTogglePreview((prev) => !prev);
        return;
      }

      if (!isCmdOrCtrl && !e.altKey && !isActivelyEditing && e.key.toLowerCase() === "p") {
        e.preventDefault();
        onTogglePreview((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isPreviewMode,
    onTogglePreview,
    isAiModalOpen,
    onCloseAiModal,
    isPdfModalOpen,
    onClosePdfModal,
  ]);
}
