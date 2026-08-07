import React, { useMemo } from "react";
import QRCode from "qrcode";

interface DossierQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  eyeColor?: string;
}

export const DossierQrCode: React.FC<DossierQrCodeProps> = ({
  value,
  size = 62,
  className = "",
  fgColor = "currentColor",
  eyeColor,
}) => {
  const qrData = useMemo(() => {
    try {
      const cleanVal = value?.trim() || "https://artstation.com";
      const url =
        (
          cleanVal.startsWith("http://") ||
          cleanVal.startsWith("https://") ||
          cleanVal.startsWith("mailto:")
        ) ?
          cleanVal
        : `https://${cleanVal}`;

      const qr = QRCode.create(url, {
        errorCorrectionLevel: "M",
      });
      const moduleCount = qr.modules.size;
      const modules = qr.modules;

      // Identify the 3 corner 7x7 finder patterns
      const isFinder = (r: number, c: number): boolean => {
        if (r < 7 && c < 7) return true; // Top-Left
        if (r < 7 && c >= moduleCount - 7) return true; // Top-Right
        if (r >= moduleCount - 7 && c < 7) return true; // Bottom-Left
        return false;
      };

      const dataDots: { r: number; c: number }[] = [];
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (modules.get(r, c) && !isFinder(r, c)) {
            dataDots.push({ r, c });
          }
        }
      }

      return { moduleCount, dataDots };
    } catch (e) {
      console.warn("QR code generation failed:", e);
      return null;
    }
  }, [value]);

  if (!qrData) return null;

  const { moduleCount, dataDots } = qrData;
  const padding = 1.5;
  const viewBoxSize = moduleCount + padding * 2;
  const activeEyeColor = eyeColor || fgColor;

  return (
    <svg
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width={size}
      height={size}
      className={`shrink-0 block ${className}`}
      aria-hidden="true"
    >
      <rect width="100%" height="100%" fill="transparent" />
      <g transform={`translate(${padding}, ${padding})`}>
        {/* Top-Left Finder Eye */}
        <rect
          x={0.5}
          y={0.5}
          width={6}
          height={6}
          rx={1.75}
          fill="none"
          stroke={fgColor}
          strokeWidth={1}
        />
        <rect x={2} y={2} width={3} height={3} rx={0.9} fill={activeEyeColor} />

        {/* Top-Right Finder Eye */}
        <rect
          x={moduleCount - 7 + 0.5}
          y={0.5}
          width={6}
          height={6}
          rx={1.75}
          fill="none"
          stroke={fgColor}
          strokeWidth={1}
        />
        <rect x={moduleCount - 7 + 2} y={2} width={3} height={3} rx={0.9} fill={activeEyeColor} />

        {/* Bottom-Left Finder Eye */}
        <rect
          x={0.5}
          y={moduleCount - 7 + 0.5}
          width={6}
          height={6}
          rx={1.75}
          fill="none"
          stroke={fgColor}
          strokeWidth={1}
        />
        <rect x={2} y={moduleCount - 7 + 2} width={3} height={3} rx={0.9} fill={activeEyeColor} />

        {/* Rounded Data Modules */}
        {dataDots.map(({ r, c }) => (
          <rect
            key={`${r}-${c}`}
            x={c + 0.08}
            y={r + 0.08}
            width={0.84}
            height={0.84}
            rx={0.28}
            fill={fgColor}
          />
        ))}
      </g>
    </svg>
  );
};
