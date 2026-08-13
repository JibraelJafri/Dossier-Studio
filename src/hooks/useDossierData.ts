import { useState, useCallback, useRef, useEffect } from "react";
import { DossierData, SpacingSettings, VisibilitySettings } from "../types.ts";
import { DEFAULT_DATA, DEFAULT_SPACING } from "../constants.ts";
import { validateAndSanitizeDossierData } from "../utils/schemaValidator.ts";
import { safeStorage } from "../utils/storage.ts";

export const STORAGE_KEY = "studio_dossier_data_v16";
export const TOMBSTONE_KEY = "studio_dossier_tombstone_v16";
export const LEGACY_STORAGE_KEYS = [
  "cover_letter_dossier",
  "cls_draft_state",
  "dossier_data",
  "studio_dossier_data_v15"
] as const;

export function useDossierData() {
  const [data, setData] = useState<DossierData>(() => {
    try {
      const tombstone = safeStorage.getItem(TOMBSTONE_KEY);
      if (tombstone) {
        for (const legacyKey of LEGACY_STORAGE_KEYS) {
          safeStorage.removeItem(legacyKey);
        }
        return DEFAULT_DATA;
      }

      const stored = safeStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const { data: sanitized } = validateAndSanitizeDossierData(parsed, DEFAULT_DATA);
        return sanitized;
      }

      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyStored = safeStorage.getItem(legacyKey);
        if (legacyStored) {
          try {
            const parsed = JSON.parse(legacyStored);
            const { data: sanitized } = validateAndSanitizeDossierData(parsed, DEFAULT_DATA);
            safeStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            safeStorage.removeItem(legacyKey);
            return sanitized;
          } catch {
            // Corrupt legacy entry; continue
          }
        }
      }
    } catch (e) {
      console.warn("Storage fallback initiated:", e);
    }
    return DEFAULT_DATA;
  });

  const [saveStatus, setSaveStatus] = useState<string>("Autosaved");
  const debouncedSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef<DossierData>(data);
  const isPendingSaveRef = useRef<boolean>(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const persistToStorage = useCallback((dataset: DossierData) => {
    try {
      safeStorage.removeItem(TOMBSTONE_KEY);
      const res = safeStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
      isPendingSaveRef.current = false;
      if (res.durable) {
        setSaveStatus("Saved");
      } else {
        setSaveStatus("Session Cached (Storage Full)");
      }
      const t = setTimeout(() => setSaveStatus("Autosaved"), 1200);
      return () => clearTimeout(t);
    } catch (e) {
      console.warn("Storage write failed:", e);
      setSaveStatus("Save Failed");
    }
  }, []);

  const flushPending = useCallback(() => {
    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
      debouncedSaveTimer.current = null;
    }
    if (isPendingSaveRef.current) {
      persistToStorage(dataRef.current);
    }
  }, [persistToStorage]);

  // Lifecycle listeners for reliable flush on exit
  useEffect(() => {
    const handleBeforeUnload = () => flushPending();
    const handlePageHide = () => flushPending();
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        flushPending();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("pagehide", handlePageHide);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("pagehide", handlePageHide);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      flushPending();
    };
  }, [flushPending]);

  // Cross-tab conflict synchronization
  useEffect(() => {
    const unsubscribe = safeStorage.subscribeExternal((key, newValue) => {
      // Conflict Guard: If a local save is pending debounce, preserve dirty local edits and ignore external updates
      if (isPendingSaveRef.current) {
        return;
      }

      if (key === TOMBSTONE_KEY && newValue !== null) {
        dataRef.current = DEFAULT_DATA;
        setData(DEFAULT_DATA);
        setSaveStatus("Reset from another tab");
        return;
      }

      if (key === null) {
        // storage.clear() called elsewhere
        dataRef.current = DEFAULT_DATA;
        setData(DEFAULT_DATA);
        setSaveStatus("Cleared from another tab");
        return;
      }

      if (key === STORAGE_KEY && newValue) {
        try {
          const parsed = JSON.parse(newValue);
          const { data: sanitized } = validateAndSanitizeDossierData(parsed, DEFAULT_DATA);
          dataRef.current = sanitized;
          setData(sanitized);
          setSaveStatus("Synced from another tab");
        } catch {
          // parse error
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateData = useCallback(
    (updater: (prev: DossierData) => DossierData, immediate = false) => {
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);

      if (debouncedSaveTimer.current) {
        clearTimeout(debouncedSaveTimer.current);
        debouncedSaveTimer.current = null;
      }

      if (immediate) {
        persistToStorage(next);
      } else {
        isPendingSaveRef.current = true;
        setSaveStatus("Saving...");
        debouncedSaveTimer.current = setTimeout(() => {
          persistToStorage(dataRef.current);
          debouncedSaveTimer.current = null;
        }, 300);
      }
    },
    [persistToStorage],
  );

  const updateSpacing = useCallback(
    (newSpacing: SpacingSettings, immediate = false) => {
      updateData(
        (prev) => ({
          ...prev,
          spacing: newSpacing,
        }),
        immediate,
      );
    },
    [updateData],
  );

  const updateSeamGap = useCallback(
    (seamKey: string, newGap: number, syncAll: boolean) => {
      updateData(
        (prev) => {
          const currentSpacing = prev.spacing || DEFAULT_SPACING;
          if (syncAll) {
            return {
              ...prev,
              spacing: {
                ...currentSpacing,
                sectionGap: newGap,
                customGaps: {},
              },
            };
          }
          return {
            ...prev,
            spacing: {
              ...currentSpacing,
              customGaps: {
                ...(currentSpacing.customGaps || {}),
                [seamKey]: newGap,
              },
            },
          };
        },
        false,
      );
    },
    [updateData],
  );

  const resetSeamGap = useCallback(
    (seamKey: string) => {
      updateData((prev) => {
        const currentSpacing = prev.spacing || DEFAULT_SPACING;
        const nextCustom = { ...(currentSpacing.customGaps || {}) };
        delete nextCustom[seamKey];
        return {
          ...prev,
          spacing: {
            ...currentSpacing,
            customGaps: nextCustom,
          },
        };
      }, true);
    },
    [updateData],
  );

  const toggleVisibility = useCallback(
    (key: keyof VisibilitySettings) => {
      updateData(
        (prev) => ({
          ...prev,
          visibility: {
            ...prev.visibility,
            [key]: !prev.visibility[key],
          },
        }),
        true,
      );
    },
    [updateData],
  );

  const restoreAllSections = useCallback(() => {
    updateData(
      (prev) => ({
        ...prev,
        visibility: {
          headerKicker: true,
          targetCard: true,
          recipientBlock: true,
          metrics: true,
          taxonomy: true,
          availabilityBadge: true,
          signoffMeta: true,
          footerStamp: true,
        },
      }),
      true,
    );
  }, [updateData]);

  const resetToDefaults = useCallback(() => {
    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
      debouncedSaveTimer.current = null;
    }
    isPendingSaveRef.current = false;
    safeStorage.removeItem(STORAGE_KEY);
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      safeStorage.removeItem(legacyKey);
    }
    safeStorage.setItem(TOMBSTONE_KEY, String(Date.now()));
    dataRef.current = DEFAULT_DATA;
    setData(DEFAULT_DATA);
    setSaveStatus("Reset to Defaults");
  }, []);

  return {
    data,
    saveStatus,
    updateData,
    updateSpacing,
    updateSeamGap,
    resetSeamGap,
    toggleVisibility,
    restoreAllSections,
    resetToDefaults,
  };
}
