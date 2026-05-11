export interface CacheKeyInput {
  pageUrl: string;
  text: string;
  targetLanguage: string;
  model: string;
}

export interface TranslationCache {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string): Promise<void>;
}

const CACHE_PREFIX = "bpt-cache-v1:";

export async function createCacheKey(input: CacheKeyInput): Promise<string> {
  const normalized = JSON.stringify({
    pageUrl: input.pageUrl,
    text: input.text,
    targetLanguage: input.targetLanguage,
    model: input.model
  });
  return `${CACHE_PREFIX}${await digest(normalized)}`;
}

export class MemoryTranslationCache implements TranslationCache {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

export class ChromeStorageTranslationCache implements TranslationCache {
  async get(key: string): Promise<string | undefined> {
    const stored = await chrome.storage.local.get(key);
    return typeof stored[key] === "string" ? stored[key] : undefined;
  }

  async set(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  if (globalThis.crypto?.subtle) {
    const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
