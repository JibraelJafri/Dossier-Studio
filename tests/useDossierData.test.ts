import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useDossierData,
  STORAGE_KEY,
  TOMBSTONE_KEY,
} from "../src/hooks/useDossierData.ts";
import { safeStorage } from "../src/utils/storage.ts";
import { DEFAULT_DATA } from "../src/constants.ts";

describe("useDossierData hook", () => {
  beforeEach(() => {
    localStorage.clear();
    safeStorage.clearAll([STORAGE_KEY, TOMBSTONE_KEY]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with DEFAULT_DATA when storage is empty", () => {
    const { result } = renderHook(() => useDossierData());
    expect(result.current.data.applicant.name).toBe(DEFAULT_DATA.applicant.name);
    expect(result.current.saveStatus).toBe("Autosaved");
  });

  it("immediately saves synchronous next-state to storage when immediate flag is true", () => {
    const { result } = renderHook(() => useDossierData());

    act(() => {
      result.current.updateData((prev) => ({
        ...prev,
        applicant: { ...prev.applicant, name: "Lead Graphics Engineer" },
      }), true);
    });

    expect(result.current.data.applicant.name).toBe("Lead Graphics Engineer");
    const stored = safeStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.applicant.name).toBe("Lead Graphics Engineer");
  });

  it("debounces persistence when immediate flag is false", () => {
    const { result } = renderHook(() => useDossierData());

    act(() => {
      result.current.updateData((prev) => ({
        ...prev,
        applicant: { ...prev.applicant, title: "Principal Pipeline Architect" },
      }), false);
    });

    expect(result.current.data.applicant.title).toBe("Principal Pipeline Architect");
    expect(result.current.saveStatus).toBe("Saving...");

    // Fast forward debounce timer
    act(() => {
      vi.advanceTimersByTime(350);
    });

    const stored = safeStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.applicant.title).toBe("Principal Pipeline Architect");
  });

  it("resets to defaults and writes tombstone", () => {
    const { result } = renderHook(() => useDossierData());

    act(() => {
      result.current.updateData((prev) => ({
        ...prev,
        applicant: { ...prev.applicant, name: "Custom Name" },
      }), true);
    });

    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.data.applicant.name).toBe(DEFAULT_DATA.applicant.name);
    expect(safeStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(safeStorage.getItem(TOMBSTONE_KEY)).not.toBeNull();
    expect(result.current.saveStatus).toBe("Reset to Defaults");
  });

  it("synchronizes updates received from another browser tab", () => {
    const { result } = renderHook(() => useDossierData());

    const externalUpdate = {
      ...DEFAULT_DATA,
      target: {
        ...DEFAULT_DATA.target,
        studio: "Criterion Games",
      },
    };

    act(() => {
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(externalUpdate),
      });
      window.dispatchEvent(storageEvent);
    });

    expect(result.current.data.target.studio).toBe("Criterion Games");
    expect(result.current.saveStatus).toBe("Synced from another tab");
  });

  it("migrates legacy key to primary key and clears legacy record", () => {
    const customLegacyData = {
      ...DEFAULT_DATA,
      applicant: {
        ...DEFAULT_DATA.applicant,
        name: "Migrated Legacy Candidate",
      },
    };
    safeStorage.setItem("studio_dossier_data_v15", JSON.stringify(customLegacyData));

    const { result } = renderHook(() => useDossierData());
    expect(result.current.data.applicant.name).toBe("Migrated Legacy Candidate");
    expect(safeStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(safeStorage.getItem("studio_dossier_data_v15")).toBeNull();
  });

  it("respects reset tombstone over existing legacy entries", () => {
    const customLegacyData = {
      ...DEFAULT_DATA,
      applicant: {
        ...DEFAULT_DATA.applicant,
        name: "Ghost Legacy Candidate",
      },
    };
    safeStorage.setItem("cover_letter_dossier", JSON.stringify(customLegacyData));
    safeStorage.setItem(TOMBSTONE_KEY, String(Date.now()));

    const { result } = renderHook(() => useDossierData());
    expect(result.current.data.applicant.name).toBe(DEFAULT_DATA.applicant.name);
    expect(safeStorage.getItem("cover_letter_dossier")).toBeNull();
  });

  it("preserves dirty local edits and ignores external storage updates", () => {
    const { result } = renderHook(() => useDossierData());

    act(() => {
      result.current.updateData((prev) => ({
        ...prev,
        applicant: {
          ...prev.applicant,
          name: "Local Active Unsaved Edit",
        },
      }), false);
    });

    expect(result.current.saveStatus).toBe("Saving...");

    // Simulate external storage event arriving while local edits are pending save
    const externalPayload = {
      ...DEFAULT_DATA,
      applicant: {
        ...DEFAULT_DATA.applicant,
        name: "Remote External Conflict",
      },
    };

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: JSON.stringify(externalPayload),
        }),
      );
    });

    // Verification: Local active edit MUST NOT be stomped
    expect(result.current.data.applicant.name).toBe("Local Active Unsaved Edit");

    // Advance debouncer
    act(() => {
      vi.advanceTimersByTime(350);
    });

    expect(result.current.saveStatus).toBe("Saved");
    const persisted = JSON.parse(safeStorage.getItem(STORAGE_KEY) || "{}");
    expect(persisted.applicant.name).toBe("Local Active Unsaved Edit");
  });
});
