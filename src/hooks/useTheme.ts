import { useState, useEffect, useCallback, useRef } from "react";
import { ThemePalette } from "../types.ts";
import { safeStorage } from "../utils/storage.ts";

const DARK_STORAGE_KEY = "studio_dossier_dark_v16";
const PALETTE_STORAGE_KEY = "studio_dossier_palette_v16";

const ALL_PALETTES: ThemePalette[] = [
  "theme-amber",
  "theme-cobalt",
  "theme-emerald",
  "theme-slate",
];

export function useTheme(dossierThemePalette?: ThemePalette) {
  const [themePalette, setThemePaletteState] = useState<ThemePalette>(() => {
    const saved = safeStorage.getItem(PALETTE_STORAGE_KEY);
    if (saved !== null && (saved === "" || ALL_PALETTES.includes(saved as ThemePalette))) {
      return saved as ThemePalette;
    }
    return dossierThemePalette || "";
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = safeStorage.getItem(DARK_STORAGE_KEY);
    if (saved !== null) {
      return saved === "true";
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const initialMountRef = useRef(true);
  const prevDossierPaletteRef = useRef(dossierThemePalette);

  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      prevDossierPaletteRef.current = dossierThemePalette;
      return;
    }

    if (
      dossierThemePalette !== undefined &&
      dossierThemePalette !== prevDossierPaletteRef.current &&
      dossierThemePalette !== themePalette
    ) {
      prevDossierPaletteRef.current = dossierThemePalette;
      setThemePaletteState(dossierThemePalette);
    }
  }, [dossierThemePalette, themePalette]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (isDark) {
      htmlEl.classList.add("dark");
      bodyEl.classList.add("dark");
      htmlEl.setAttribute("data-theme", "dark");
      safeStorage.setItem(DARK_STORAGE_KEY, "true");
    } else {
      htmlEl.classList.remove("dark");
      bodyEl.classList.remove("dark");
      htmlEl.setAttribute("data-theme", "light");
      safeStorage.setItem(DARK_STORAGE_KEY, "false");
    }
  }, [isDark]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    bodyEl.classList.remove(...ALL_PALETTES);
    htmlEl.classList.remove(...ALL_PALETTES);

    if (themePalette) {
      bodyEl.classList.add(themePalette);
      htmlEl.classList.add(themePalette);
    }
    safeStorage.setItem(PALETTE_STORAGE_KEY, themePalette);
  }, [themePalette]);

  const setThemePalette = useCallback((newPalette: ThemePalette) => {
    prevDossierPaletteRef.current = newPalette;
    setThemePaletteState(newPalette);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return {
    isDark,
    toggleDark,
    themePalette,
    setThemePalette,
  };
}