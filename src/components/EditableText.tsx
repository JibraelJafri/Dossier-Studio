import React, { useState, useRef, useEffect, useCallback } from "react";
import { parseMarkdown, escapeHtml } from "../utils/markdown.ts";
import { isValidUrl } from "../utils/urlPolicy.ts";
import { Bold, Italic, Link as LinkIcon, Code, Check, HelpCircle } from "lucide-react";

export interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  allowMarkdown?: boolean;
  showMarkdownToolbar?: boolean;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p" | "a";
  href?: string;
  target?: string;
  placeholder?: string;
  dataPath?: string;
  multiline?: boolean;
  disabled?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = "",
  allowMarkdown = false,
  showMarkdownToolbar = false,
  as: Component = "span",
  href,
  target,
  placeholder = "Click to edit...",
  dataPath,
  multiline = false,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);

  const elementRef = useRef<HTMLElement | null>(null);
  const savedSelectionRange = useRef<Range | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const valueRef = useRef<string>(value);

  valueRef.current = value;

  // Initialize content and set cursor at end ONLY when entering edit mode
  useEffect(() => {
    if (isEditing && elementRef.current) {
      isCancelledRef.current = false;
      elementRef.current.textContent = valueRef.current || "";
      elementRef.current.focus();

      try {
        const selection = window.getSelection();
        if (selection && elementRef.current.childNodes.length > 0) {
          const range = document.createRange();
          range.selectNodeContents(elementRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch {
        // Caret placement fallback
      }
    }
  }, [isEditing]);

  const commitChanges = useCallback(() => {
    if (!elementRef.current) return;
    let newText = (elementRef.current.innerText || elementRef.current.textContent || "").trim();
    if (!multiline) {
      newText = newText.replace(/[\r\n]+/g, " ").trim();
    }
    if (newText !== valueRef.current) {
      onChange(newText);
    }
  }, [multiline, onChange]);

  const startEditing = useCallback(() => {
    if (disabled || isEditing) return;
    setIsEditing(true);
  }, [disabled, isEditing]);

  const handleBlur = (e: React.FocusEvent) => {
    if (!isEditing) return;

    const relatedTarget = e.relatedTarget as HTMLElement | null;
    if (relatedTarget && relatedTarget.closest(".markdown-toolbar-container")) {
      return;
    }

    setIsEditing(false);
    setShowLinkDialog(false);
    setShowSyntaxGuide(false);
    setLinkError(null);

    if (isCancelledRef.current) {
      isCancelledRef.current = false;
      return;
    }

    commitChanges();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    let plainText = e.clipboardData.getData("text/plain") || "";
    if (!multiline) {
      plainText = plainText.replace(/[\r\n]+/g, " ");
    }

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(plainText);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand("insertText", false, plainText);
    }
  };

  const applyFormatting = (format: "bold" | "italic" | "code") => {
    if (!elementRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!elementRef.current.contains(range.commonAncestorContainer)) return;

    const selectedText = range.toString();
    let replacement = "";

    if (format === "bold") {
      replacement =
        selectedText.startsWith("**") && selectedText.endsWith("**") && selectedText.length >= 4
          ? selectedText.slice(2, -2)
          : `**${selectedText || "bold text"}**`;
    } else if (format === "italic") {
      replacement =
        selectedText.startsWith("*") && selectedText.endsWith("*") && selectedText.length >= 2
          ? selectedText.slice(1, -1)
          : `*${selectedText || "italic text"}*`;
    } else if (format === "code") {
      replacement =
        selectedText.startsWith("`") && selectedText.endsWith("`") && selectedText.length >= 2
          ? selectedText.slice(1, -1)
          : `\`${selectedText || "code"}\``;
    }

    range.deleteContents();
    const textNode = document.createTextNode(replacement);
    range.insertNode(textNode);
    range.selectNode(textNode);
  };

  const handleOpenLinkDialog = () => {
    if (!elementRef.current) return;
    const selection = window.getSelection();
    let initialText = "";
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (elementRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRange.current = range.cloneRange();
        initialText = range.toString();
      }
    }
    setLinkText(initialText || "Link text");
    setLinkUrl("https://");
    setLinkError(null);
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!elementRef.current) return;
    const trimmedUrl = linkUrl.trim();

    if (!isValidUrl(trimmedUrl)) {
      setLinkError("Please enter a valid URL (http, https, mailto, tel)");
      return;
    }

    elementRef.current.focus();
    const formattedLink = `[${linkText.trim() || "Link"}](${trimmedUrl})`;

    if (savedSelectionRange.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRange.current);
        savedSelectionRange.current.deleteContents();
        const textNode = document.createTextNode(formattedLink);
        savedSelectionRange.current.insertNode(textNode);
        savedSelectionRange.current.collapse(false);
      }
    } else {
      document.execCommand("insertText", false, formattedLink);
    }

    setShowLinkDialog(false);
    setLinkError(null);
    savedSelectionRange.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isComposingRef.current) return;

    if (e.key === "Escape") {
      e.preventDefault();
      isCancelledRef.current = true;
      if (elementRef.current) {
        elementRef.current.textContent = valueRef.current || "";
      }
      setIsEditing(false);
      setShowLinkDialog(false);
      setShowSyntaxGuide(false);
      setLinkError(null);
      elementRef.current?.blur();
      return;
    }

    if (e.key === "Enter" && !multiline && Component !== "div" && Component !== "p") {
      e.preventDefault();
      elementRef.current?.blur();
      return;
    }

    if (allowMarkdown && isEditing) {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        applyFormatting("bold");
        return;
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === "i") {
        e.preventDefault();
        applyFormatting("italic");
        return;
      }
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenLinkDialog();
        return;
      }
      if (isCmdOrCtrl && (e.key.toLowerCase() === "e" || e.key === "`")) {
        e.preventDefault();
        applyFormatting("code");
        return;
      }
    }
  };

  const baseClassName = `outline-none transition-colors duration-150 rounded-xs focus-visible:ring-1 focus-visible:ring-[var(--accent-base)] ${
    !isEditing && !disabled ? "cursor-text" : ""
  } ${className}`;

  if (isEditing) {
    const editableElement = React.createElement(Component, {
      ref: elementRef,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: handleBlur,
      onPaste: handlePaste,
      onKeyDown: handleKeyDown,
      onCompositionStart: () => {
        isComposingRef.current = true;
      },
      onCompositionEnd: () => {
        isComposingRef.current = false;
      },
      "data-path": dataPath,
      className: baseClassName,
    });

    if (!allowMarkdown || !showMarkdownToolbar) {
      return editableElement;
    }

    return (
      <div className="relative group/editable-container">
        <div
          className="markdown-toolbar-container no-print absolute -top-11 left-0 z-40 flex items-center gap-1 px-2 py-1 bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-lg shadow-lg text-xs backdrop-blur-md"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            onClick={() => applyFormatting("bold")}
            className="p-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-base)] transition-colors cursor-pointer"
            title="Bold (**text**) · Ctrl+B"
            aria-label="Bold text"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("italic")}
            className="p-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-base)] transition-colors cursor-pointer"
            title="Italic (*text*) · Ctrl+I"
            aria-label="Italic text"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleOpenLinkDialog}
            className="p-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-base)] transition-colors cursor-pointer"
            title="Insert Link ([text](url)) · Ctrl+K"
            aria-label="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormatting("code")}
            className="p-1 rounded text-[var(--text-main)] hover:bg-[var(--bg-subtle)] hover:text-[var(--accent-base)] transition-colors cursor-pointer"
            title="Inline Code (`code`) · Ctrl+`"
            aria-label="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-[var(--border-sheet)] mx-0.5" />
          <button
            type="button"
            onClick={() => setShowSyntaxGuide(!showSyntaxGuide)}
            className="p-1 rounded text-[var(--text-faint)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title="Markdown syntax reference"
            aria-label="Markdown Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              commitChanges();
              setIsEditing(false);
              setShowLinkDialog(false);
              setShowSyntaxGuide(false);
              setLinkError(null);
            }}
            className="flex items-center gap-1 px-2 py-0.5 bg-[var(--accent-base)] text-white text-[11px] font-medium rounded hover:opacity-90 transition-opacity cursor-pointer ml-1"
            title="Finish editing"
          >
            <Check className="w-3 h-3" />
            <span>Done</span>
          </button>
        </div>

        {showSyntaxGuide && (
          <div
            className="markdown-toolbar-container no-print absolute -top-24 left-0 z-50 p-2.5 bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-xl shadow-xl text-[11px] space-y-1 min-w-[260px] text-[var(--text-muted)]"
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="font-semibold text-[var(--text-main)] pb-0.5 border-b border-[var(--border-sheet)]">
              Markdown Syntax Guide
            </div>
            <div>
              <code className="text-[var(--accent-base)]">**bold text**</code>
            </div>
            <div>
              <code className="text-[var(--accent-base)]">*italic text*</code>
            </div>
            <div>
              <code className="text-[var(--accent-base)]">[Link Label](https://url.com)</code>
            </div>
            <div>
              <code className="text-[var(--accent-base)]">`code / technical term`</code>
            </div>
          </div>
        )}

        {showLinkDialog && (
          <div
            className="markdown-toolbar-container no-print absolute -top-36 left-0 z-50 p-3 bg-[var(--bg-sheet)] border border-[var(--border-sheet)] rounded-xl shadow-2xl space-y-2 min-w-[280px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="text-[11px] font-bold text-[var(--text-main)] flex items-center justify-between">
              <span>Insert Hyperlink</span>
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkError(null);
                }}
                className="text-[var(--text-faint)] hover:text-[var(--text-main)] text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-[var(--text-faint)] block mb-0.5">
                Display Text
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInsertLink();
                }}
                placeholder="e.g. Project Portfolio"
                className="w-full text-xs px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-sheet)] rounded text-[var(--text-main)] outline-none focus:border-[var(--accent-base)]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-mono text-[var(--text-faint)] block mb-0.5">
                Destination URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  if (linkError) setLinkError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInsertLink();
                }}
                placeholder="https://example.com"
                className="w-full text-xs font-mono px-2 py-1 bg-[var(--bg-subtle)] border border-[var(--border-sheet)] rounded text-[var(--text-main)] outline-none focus:border-[var(--accent-base)]"
              />
              {linkError && (
                <span className="text-[10px] text-red-500 block pt-0.5">{linkError}</span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkError(null);
                }}
                className="px-2 py-0.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-3 py-1 bg-[var(--accent-base)] text-white text-xs font-medium rounded hover:opacity-90 cursor-pointer"
              >
                Apply Link
              </button>
            </div>
          </div>
        )}

        {editableElement}
      </div>
    );
  }

  // Preserve native landmark semantics: do not attach role="button" to headings/paragraphs
  const isLink = Component === "a";
  const elementProps: Record<string, unknown> = {
    ref: elementRef,
    contentEditable: false,
    suppressContentEditableWarning: true,
    tabIndex: disabled ? (isLink ? 0 : -1) : 0,
    title: !disabled ? "Click or press Enter to edit" : undefined,
    "aria-describedby": !disabled ? "editorial-keyboard-hint" : undefined,
    "aria-label": value && value.trim() ? undefined : placeholder,
    onClick: (e: React.MouseEvent) => {
      if (disabled || isEditing) return;

      if (isLink) {
        e.preventDefault();
        startEditing();
        return;
      }

      if ((e.target as HTMLElement)?.closest("a") && allowMarkdown) return;
      startEditing();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (disabled || isEditing) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startEditing();
      }
    },
    "data-path": dataPath,
    className: baseClassName,
  };

  if (isLink && href) {
    if (disabled) {
      elementProps.href = href;
      if (target) elementProps.target = target;
      if (target === "_blank") elementProps.rel = "noopener noreferrer";
    }
  }

  if (allowMarkdown) {
    elementProps.dangerouslySetInnerHTML = {
      __html:
        value && value.trim()
          ? parseMarkdown(value)
          : `<span class="opacity-40 italic">${escapeHtml(placeholder)}</span>`,
    };
    return React.createElement(Component, elementProps);
  }

  return React.createElement(
    Component,
    elementProps,
    value ? value : <span className="opacity-40 italic">{placeholder}</span>,
  );
};
