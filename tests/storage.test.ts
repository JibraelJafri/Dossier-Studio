import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeStorage } from "../src/utils/storage.ts";

describe("SafeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fulfills the { accepted, durable } contract on successful writes", () => {
    const result = safeStorage.setItem("test_key", "test_value");
    expect(result.accepted).toBe(true);
    expect(result.durable).toBe(true);
    expect(result.error).toBeUndefined();
    expect(safeStorage.getItem("test_key")).toBe("test_value");
    expect(localStorage.getItem("test_key")).toBe("test_value");
  });

  it("handles quota exceeded errors by keeping data in session memory cache", () => {
    const setItemSpy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      const err = new DOMException("QuotaExceededError", "QuotaExceededError");
      throw err;
    });

    const result = safeStorage.setItem("overflow_key", "heavy_payload");
    expect(result.accepted).toBe(true);
    expect(result.durable).toBe(false);
    expect(result.error).toBe("quota");

    // Still accessible in session memory
    expect(safeStorage.getItem("overflow_key")).toBe("heavy_payload");

    setItemSpy.mockRestore();
  });

  it("removes items and handles batch clearAll", () => {
    safeStorage.setItem("k1", "v1");
    safeStorage.setItem("k2", "v2");
    safeStorage.removeItem("k1");

    expect(safeStorage.getItem("k1")).toBeNull();
    expect(safeStorage.getItem("k2")).toBe("v2");

    safeStorage.clearAll(["k2"]);
    expect(safeStorage.getItem("k2")).toBeNull();
  });

  it("notifies external subscribers when storage events fire", () => {
    const listener = vi.fn();
    const unsubscribe = safeStorage.subscribeExternal(listener);

    // Simulate cross-tab storage event
    const event = new StorageEvent("storage", {
      key: "synced_key",
      newValue: "synced_val",
    });
    window.dispatchEvent(event);

    expect(listener).toHaveBeenCalledWith("synced_key", "synced_val");
    expect(safeStorage.getItem("synced_key")).toBe("synced_val");

    unsubscribe();
  });

  it("handles storage.clear() cross-tab event by clearing cache", () => {
    safeStorage.setItem("persist", "val");

    const listener = vi.fn();
    const unsubscribe = safeStorage.subscribeExternal(listener);

    localStorage.clear();
    // key is null when localStorage.clear() is invoked
    const clearEvent = new StorageEvent("storage", {
      key: null,
      newValue: null,
    });
    window.dispatchEvent(clearEvent);

    expect(listener).toHaveBeenCalledWith(null, null);
    expect(safeStorage.getItem("persist")).toBeNull();

    unsubscribe();
  });
});
