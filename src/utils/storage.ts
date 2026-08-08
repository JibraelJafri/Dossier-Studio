/**
 * Result of an attempted write operation to SafeStorage.
 *
 * - `accepted`: true if the value was successfully placed into the active in-memory session cache.
 *               In-session reads will return this value.
 * - `durable`: true ONLY if the value was successfully written to persistent disk storage (localStorage).
 *              If false, the value exists only for the lifetime of the current session/tab.
 * - `error`: specific failure reason when `durable === false`.
 */
export interface StorageWriteResult {
  accepted: boolean;
  durable: boolean;
  error?: "quota" | "security" | "unavailable" | "unknown";
}

type ExternalStorageListener = (key: string | null, newValue: string | null) => void;

class SafeStorage {
  private memoryCache = new Map<string, string>();
  private durableKeys = new Set<string>();
  private externalListeners = new Set<ExternalStorageListener>();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event: StorageEvent) => {
        // Handle localStorage.clear() in another tab
        if (event.key === null) {
          this.memoryCache.clear();
          this.durableKeys.clear();
          this.notifyExternal(null, null);
          return;
        }

        // Handle specific key update or removal in another tab
        if (event.newValue === null) {
          this.memoryCache.delete(event.key);
          this.durableKeys.delete(event.key);
        } else {
          this.memoryCache.set(event.key, event.newValue);
          this.durableKeys.add(event.key);
        }

        this.notifyExternal(event.key, event.newValue);
      });
    }
  }

  getItem(key: string): string | null {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) ?? null;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          this.memoryCache.set(key, val);
          this.durableKeys.add(key);
          return val;
        }
      } catch {
        // Storage access restricted / SecurityError
      }
    }

    return null;
  }

  setItem(key: string, value: string): StorageWriteResult {
    this.memoryCache.set(key, value);

    if (typeof window === "undefined" || !window.localStorage) {
      this.durableKeys.delete(key);
      return { accepted: true, durable: false, error: "unavailable" };
    }

    try {
      window.localStorage.setItem(key, value);
      this.durableKeys.add(key);
      return { accepted: true, durable: true };
    } catch (e) {
      this.durableKeys.delete(key);
      let errorType: "quota" | "security" | "unknown" = "unknown";
      if (e instanceof DOMException) {
        if (e.name === "QuotaExceededError" || e.code === 22) {
          errorType = "quota";
        } else if (e.name === "SecurityError") {
          errorType = "security";
        }
      }
      return { accepted: true, durable: false, error: errorType };
    }
  }

  removeItem(key: string): boolean {
    this.memoryCache.delete(key);
    this.durableKeys.delete(key);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  clearAll(keys: readonly string[]): void {
    for (const key of keys) {
      this.removeItem(key);
    }
  }

  subscribeExternal(listener: ExternalStorageListener): () => void {
    this.externalListeners.add(listener);
    return () => {
      this.externalListeners.delete(listener);
    };
  }

  private notifyExternal(key: string | null, newValue: string | null) {
    this.externalListeners.forEach((listener) => {
      try {
        listener(key, newValue);
      } catch {
        // Consumer callback safety
      }
    });
  }
}

export const safeStorage = new SafeStorage();