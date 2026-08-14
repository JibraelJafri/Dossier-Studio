import { useState, useEffect, useMemo, RefObject } from "react";

export function useSheetMetrics(
  sheetRef: RefObject<HTMLElement | null>,
  dependencies: unknown[],
  isPreviewMode: boolean,
  previewScale: "actual" | "fit",
) {
  const [sheetDimensions, setSheetDimensions] = useState<{ width: number; height: number }>({
    width: 896,
    height: 1200,
  });

  const [viewportHeight, setViewportHeight] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 900,
  );

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const measure = () => {
      if (!sheetRef.current) return;
      setSheetDimensions({
        width: sheetRef.current.offsetWidth,
        height: sheetRef.current.offsetHeight,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    if (sheetRef.current) observer.observe(sheetRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetRef, ...dependencies]);

  const a4Height =
    sheetDimensions.width > 0 ? Math.round(sheetDimensions.width * (297 / 210)) : 1267;

  const fitScale = useMemo(() => {
    if (!isPreviewMode || previewScale !== "fit") return 1;
    const availableHeight = viewportHeight - 160;
    const targetHeight = sheetDimensions.height || 1200;
    return Math.min(1, Math.max(0.4, Number((availableHeight / targetHeight).toFixed(3))));
  }, [isPreviewMode, previewScale, viewportHeight, sheetDimensions.height]);

  return {
    sheetDimensions,
    a4Height,
    fitScale,
  };
}
