import React, { useState, useRef, useEffect, useCallback } from "react";
import { SpacingSettings } from "../types.ts";
import { DEFAULT_SPACING } from "../constants.ts";

interface InteractiveSpacingOverlayProps {
  spacing: SpacingSettings;
  onChangeSpacing: (newSpacing: SpacingSettings) => void;
  active: boolean;
}

type DragTarget = "padding-top" | "padding-bottom" | "padding-left" | "padding-right" | null;

export const InteractiveSpacingOverlay: React.FC<InteractiveSpacingOverlayProps> = ({
  spacing,
  onChangeSpacing,
  active,
}) => {
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [hoverTarget, setHoverTarget] = useState<DragTarget>(null);
  const [liveValue, setLiveValue] = useState<number>(0);

  const startCoordRef = useRef<number>(0);
  const startValRef = useRef<number>(0);
  const activeTargetRef = useRef<DragTarget>(null);
  const spacingRef = useRef(spacing);

  spacingRef.current = spacing;

  const handlePointerDown = (
    e: React.PointerEvent,
    target: NonNullable<DragTarget>,
    initialVal: number,
    isVertical: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    activeTargetRef.current = target;
    setDragTarget(target);
    startCoordRef.current = isVertical ? e.clientY : e.clientX;
    startValRef.current = initialVal;
    setLiveValue(initialVal);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const target = activeTargetRef.current;
      if (!target) return;

      const deltaY = e.clientY - startCoordRef.current;
      const deltaX = e.clientX - startCoordRef.current;
      const isShift = e.shiftKey;
      const step = isShift ? 4 : 1;

      if (target === "padding-top") {
        let next = Math.max(12, Math.min(120, startValRef.current + deltaY));
        if (isShift) next = Math.round(next / step) * step;
        setLiveValue(next);
        onChangeSpacing({ ...spacingRef.current, sheetPaddingY: next });
      } else if (target === "padding-bottom") {
        let next = Math.max(12, Math.min(120, startValRef.current - deltaY));
        if (isShift) next = Math.round(next / step) * step;
        setLiveValue(next);
        onChangeSpacing({ ...spacingRef.current, sheetPaddingY: next });
      } else if (target === "padding-left") {
        let next = Math.max(16, Math.min(120, startValRef.current + deltaX));
        if (isShift) next = Math.round(next / step) * step;
        setLiveValue(next);
        onChangeSpacing({ ...spacingRef.current, sheetPaddingX: next });
      } else if (target === "padding-right") {
        let next = Math.max(16, Math.min(120, startValRef.current - deltaX));
        if (isShift) next = Math.round(next / step) * step;
        setLiveValue(next);
        onChangeSpacing({ ...spacingRef.current, sheetPaddingX: next });
      }
    },
    [onChangeSpacing],
  );

  const handlePointerUp = useCallback(() => {
    activeTargetRef.current = null;
    setDragTarget(null);
  }, []);

  useEffect(() => {
    if (dragTarget) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = "";
    };
  }, [dragTarget, handlePointerMove, handlePointerUp]);

  if (!active) return null;

  const currentDisplay = dragTarget || hoverTarget;
  const isDragging = dragTarget !== null;

  return (
    <div
      className="absolute inset-0 pointer-events-none no-print select-none z-20 overflow-visible"
      data-pdf-remove="true"
    >
      {/* 1. TOP MARGIN HANDLE */}
      <div
        style={{ height: `${spacing.sheetPaddingY}px`, touchAction: "none" }}
        role="slider"
        tabIndex={0}
        aria-label="Canvas Top Padding"
        aria-valuenow={spacing.sheetPaddingY}
        aria-valuemin={12}
        aria-valuemax={120}
        className={`absolute top-0 inset-x-0 transition-colors pointer-events-auto cursor-ns-resize group focus:outline-none focus:ring-1 focus:ring-(--accent-base) ${
          currentDisplay === "padding-top" ? "bg-(--accent-base)/10" : ""
        }`}
        onPointerEnter={() => !isDragging && setHoverTarget("padding-top")}
        onPointerLeave={() => !isDragging && setHoverTarget(null)}
        onPointerDown={(e) => handlePointerDown(e, "padding-top", spacing.sheetPaddingY, true)}
        onDoubleClick={() =>
          onChangeSpacing({ ...spacing, sheetPaddingY: DEFAULT_SPACING.sheetPaddingY })
        }
        onKeyDown={(e) => {
          const step = e.shiftKey ? 4 : 1;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: Math.min(120, spacing.sheetPaddingY + step) });
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: Math.max(12, spacing.sheetPaddingY - step) });
          } else if (e.key === "Home") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: DEFAULT_SPACING.sheetPaddingY });
          }
        }}
        title="Top margin (Drag, Arrow keys, Shift for 4px snap, double-click to reset)"
      >
        <div
          className={`absolute bottom-0 inset-x-0 border-b border-dashed transition-all ${
            currentDisplay === "padding-top"
              ? "border-(--accent-base) opacity-100"
              : "border-(--accent-base)/30 opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
          <div
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold tracking-tight shadow-md flex items-center gap-1 transition-all ${
              currentDisplay === "padding-top"
                ? "bg-(--accent-base) text-white scale-105"
                : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) opacity-0 group-hover:opacity-100 scale-95"
            }`}
          >
            <span>
              ↕ {currentDisplay === "padding-top" && isDragging ? liveValue : spacing.sheetPaddingY}px
            </span>
            <span className="text-[8px] opacity-60">Top Margin</span>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM MARGIN HANDLE */}
      <div
        style={{ height: `${spacing.sheetPaddingY}px`, touchAction: "none" }}
        role="slider"
        tabIndex={0}
        aria-label="Canvas Bottom Padding"
        aria-valuenow={spacing.sheetPaddingY}
        aria-valuemin={12}
        aria-valuemax={120}
        className={`absolute bottom-0 inset-x-0 transition-colors pointer-events-auto cursor-ns-resize group focus:outline-none focus:ring-1 focus:ring-(--accent-base) ${
          currentDisplay === "padding-bottom" ? "bg-(--accent-base)/10" : ""
        }`}
        onPointerEnter={() => !isDragging && setHoverTarget("padding-bottom")}
        onPointerLeave={() => !isDragging && setHoverTarget(null)}
        onPointerDown={(e) => handlePointerDown(e, "padding-bottom", spacing.sheetPaddingY, true)}
        onDoubleClick={() =>
          onChangeSpacing({ ...spacing, sheetPaddingY: DEFAULT_SPACING.sheetPaddingY })
        }
        onKeyDown={(e) => {
          const step = e.shiftKey ? 4 : 1;
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: Math.min(120, spacing.sheetPaddingY + step) });
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: Math.max(12, spacing.sheetPaddingY - step) });
          } else if (e.key === "Home") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingY: DEFAULT_SPACING.sheetPaddingY });
          }
        }}
        title="Bottom margin (Drag, Arrow keys, Shift for 4px snap, double-click to reset)"
      >
        <div
          className={`absolute top-0 inset-x-0 border-t border-dashed transition-all ${
            currentDisplay === "padding-bottom"
              ? "border-(--accent-base) opacity-100"
              : "border-(--accent-base)/30 opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div
            className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold tracking-tight shadow-md flex items-center gap-1 transition-all ${
              currentDisplay === "padding-bottom"
                ? "bg-(--accent-base) text-white scale-105"
                : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) opacity-0 group-hover:opacity-100 scale-95"
            }`}
          >
            <span>
              ↕ {currentDisplay === "padding-bottom" && isDragging ? liveValue : spacing.sheetPaddingY}px
            </span>
            <span className="text-[8px] opacity-60">Bottom Margin</span>
          </div>
        </div>
      </div>

      {/* 3. LEFT MARGIN HANDLE */}
      <div
        style={{ width: `${spacing.sheetPaddingX}px`, touchAction: "none" }}
        role="slider"
        tabIndex={0}
        aria-label="Canvas Left Padding"
        aria-valuenow={spacing.sheetPaddingX}
        aria-valuemin={16}
        aria-valuemax={120}
        className={`absolute inset-y-0 left-0 transition-colors pointer-events-auto cursor-ew-resize group focus:outline-none focus:ring-1 focus:ring-(--accent-base) ${
          currentDisplay === "padding-left" ? "bg-(--accent-base)/10" : ""
        }`}
        onPointerEnter={() => !isDragging && setHoverTarget("padding-left")}
        onPointerLeave={() => !isDragging && setHoverTarget(null)}
        onPointerDown={(e) => handlePointerDown(e, "padding-left", spacing.sheetPaddingX, false)}
        onDoubleClick={() =>
          onChangeSpacing({ ...spacing, sheetPaddingX: DEFAULT_SPACING.sheetPaddingX })
        }
        onKeyDown={(e) => {
          const step = e.shiftKey ? 4 : 1;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: Math.min(120, spacing.sheetPaddingX + step) });
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: Math.max(16, spacing.sheetPaddingX - step) });
          } else if (e.key === "Home") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: DEFAULT_SPACING.sheetPaddingX });
          }
        }}
        title="Left margin (Drag, Arrow keys, Shift for 4px snap, double-click to reset)"
      >
        <div
          className={`absolute inset-y-0 right-0 border-r border-dashed transition-all ${
            currentDisplay === "padding-left"
              ? "border-(--accent-base) opacity-100"
              : "border-(--accent-base)/30 opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
          <div
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight shadow-md flex items-center gap-0.5 transition-all ${
              currentDisplay === "padding-left"
                ? "bg-(--accent-base) text-white scale-105"
                : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) opacity-0 group-hover:opacity-100 scale-95"
            }`}
          >
            <span>↔ {currentDisplay === "padding-left" && isDragging ? liveValue : spacing.sheetPaddingX}px</span>
          </div>
        </div>
      </div>

      {/* 4. RIGHT MARGIN HANDLE */}
      <div
        style={{ width: `${spacing.sheetPaddingX}px`, touchAction: "none" }}
        role="slider"
        tabIndex={0}
        aria-label="Canvas Right Padding"
        aria-valuenow={spacing.sheetPaddingX}
        aria-valuemin={16}
        aria-valuemax={120}
        className={`absolute inset-y-0 right-0 transition-colors pointer-events-auto cursor-ew-resize group focus:outline-none focus:ring-1 focus:ring-(--accent-base) ${
          currentDisplay === "padding-right" ? "bg-(--accent-base)/10" : ""
        }`}
        onPointerEnter={() => !isDragging && setHoverTarget("padding-right")}
        onPointerLeave={() => !isDragging && setHoverTarget(null)}
        onPointerDown={(e) => handlePointerDown(e, "padding-right", spacing.sheetPaddingX, false)}
        onDoubleClick={() =>
          onChangeSpacing({ ...spacing, sheetPaddingX: DEFAULT_SPACING.sheetPaddingX })
        }
        onKeyDown={(e) => {
          const step = e.shiftKey ? 4 : 1;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: Math.min(120, spacing.sheetPaddingX + step) });
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: Math.max(16, spacing.sheetPaddingX - step) });
          } else if (e.key === "Home") {
            e.preventDefault();
            onChangeSpacing({ ...spacing, sheetPaddingX: DEFAULT_SPACING.sheetPaddingX });
          }
        }}
        title="Right margin (Drag, Arrow keys, Shift for 4px snap, double-click to reset)"
      >
        <div
          className={`absolute inset-y-0 left-0 border-l border-dashed transition-all ${
            currentDisplay === "padding-right"
              ? "border-(--accent-base) opacity-100"
              : "border-(--accent-base)/30 opacity-0 group-hover:opacity-100"
          }`}
        />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center">
          <div
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-tight shadow-md flex items-center gap-0.5 transition-all ${
              currentDisplay === "padding-right"
                ? "bg-(--accent-base) text-white scale-105"
                : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) opacity-0 group-hover:opacity-100 scale-95"
            }`}
          >
            <span>↔ {currentDisplay === "padding-right" && isDragging ? liveValue : spacing.sheetPaddingX}px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface InterSectionGapProps {
  gap: number;
  seamKey: string;
  onChangeGap?: (seamKey: string, newGap: number, syncAll: boolean) => void;
  onResetGap?: (seamKey: string) => void;
  label?: string;
  isCustom?: boolean;
  disabled?: boolean;
}

export const InterSectionGap: React.FC<InterSectionGapProps> = ({
  gap,
  seamKey,
  onChangeGap,
  onResetGap,
  label = "Section Rhythm",
  isCustom = false,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [liveVal, setLiveVal] = useState(gap);
  const [isSyncModifier, setIsSyncModifier] = useState(false);

  const startYRef = useRef(0);
  const startValRef = useRef(gap);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = gap;
    setLiveVal(gap);
    setIsSyncModifier(e.altKey || e.ctrlKey || e.metaKey);
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !onChangeGap) return;

      const syncAll = e.altKey || e.ctrlKey || e.metaKey;
      setIsSyncModifier(syncAll);

      const deltaY = e.clientY - startYRef.current;
      const isShift = e.shiftKey;
      const step = isShift ? 4 : 1;

      let next = Math.max(4, Math.min(120, startValRef.current + deltaY));
      if (isShift) next = Math.round(next / step) * step;

      setLiveVal(next);
      onChangeGap(seamKey, next, syncAll);
    },
    [isDragging, onChangeGap, seamKey],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsSyncModifier(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey || e.ctrlKey || e.metaKey) setIsSyncModifier(true);
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) setIsSyncModifier(false);
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      document.body.style.userSelect = "none";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
        document.body.style.userSelect = "";
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      style={{ height: `${gap}px`, touchAction: disabled ? "auto" : "none" }}
      role={disabled ? undefined : "slider"}
      tabIndex={disabled ? -1 : 0}
      aria-label={`${label} seam spacing`}
      aria-valuenow={gap}
      aria-valuemin={4}
      aria-valuemax={120}
      className={`relative w-full select-none transition-colors flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-(--accent-base) ${
        !disabled ? "cursor-ns-resize group/gap" : ""
      } ${!disabled && (isHovered || isDragging) ? "bg-(--accent-base)/8" : ""}`}
      onPointerEnter={() => !disabled && setIsHovered(true)}
      onPointerLeave={() => !disabled && !isDragging && setIsHovered(false)}
      onPointerDown={!disabled ? handlePointerDown : undefined}
      onDoubleClick={!disabled && onResetGap ? () => onResetGap(seamKey) : undefined}
      onKeyDown={(e) => {
        if (disabled || !onChangeGap) return;
        const step = e.shiftKey ? 4 : 1;
        const syncAll = e.altKey || e.ctrlKey || e.metaKey;
        // W3C ARIA Slider Pattern: ArrowUp/Right increments, ArrowDown/Left decrements
        if (e.key === "ArrowUp" || e.key === "ArrowRight") {
          e.preventDefault();
          onChangeGap(seamKey, Math.min(120, gap + step), syncAll);
        } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
          e.preventDefault();
          onChangeGap(seamKey, Math.max(4, gap - step), syncAll);
        } else if (e.key === "Home" && onResetGap) {
          e.preventDefault();
          onResetGap(seamKey);
        }
      }}
      title={
        !disabled
          ? "Drag or use Arrow keys to adjust gap. Hold Ctrl/Alt to sync all gaps. Double-click to reset."
          : undefined
      }
    >
      {!disabled && (
        <div
          className="absolute inset-0 flex items-center justify-center no-print pointer-events-none"
          data-pdf-remove="true"
        >
          <div
            className={`w-full border-t border-dashed transition-all ${
              isHovered || isDragging
                ? "border-(--accent-base) opacity-100"
                : isCustom
                ? "border-(--accent-base)/40 opacity-70"
                : "border-(--border-subtle) opacity-0 group-hover/gap:opacity-60"
            }`}
          />
          <div
            className={`absolute px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-md flex items-center gap-1.5 transition-all ${
              isHovered || isDragging
                ? "bg-(--accent-base) text-white scale-100 opacity-100"
                : isCustom
                ? "bg-(--accent-soft) text-(--accent-base) border border-(--accent-border) opacity-85 scale-95"
                : "bg-(--bg-sheet) border border-(--border-sheet) text-(--text-muted) scale-90 opacity-0 group-hover/gap:opacity-100"
            }`}
          >
            <span>↕ {isDragging ? liveVal : gap}px</span>
            <span className="opacity-40">·</span>
            {isSyncModifier ? (
              <span className="text-amber-200 font-semibold flex items-center gap-0.5">
                <span>Sync All Gaps 🔗</span>
              </span>
            ) : isCustom ? (
              <span className="font-semibold text-[8px] opacity-90">Custom Seam</span>
            ) : (
              <span className="text-[8px] opacity-75 font-normal">{label}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
