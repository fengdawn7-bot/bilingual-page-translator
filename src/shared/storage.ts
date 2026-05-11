import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from "./defaults";
import type { TranslatorConfig } from "./types";

export async function getConfig(): Promise<TranslatorConfig> {
  const stored = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
  return {
    ...DEFAULT_CONFIG,
    ...(stored[CONFIG_STORAGE_KEY] ?? {})
  };
}

export async function saveConfig(config: TranslatorConfig): Promise<void> {
  await chrome.storage.local.set({
    [CONFIG_STORAGE_KEY]: {
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      baseURL: config.baseURL.trim().replace(/\/+$/, ""),
      model: config.model.trim(),
      targetLanguage: config.targetLanguage.trim() || DEFAULT_CONFIG.targetLanguage,
      batchSize: clampInteger(config.batchSize, 4, 50, DEFAULT_CONFIG.batchSize),
      concurrency: clampInteger(config.concurrency, 1, 6, DEFAULT_CONFIG.concurrency),
      maxBlocks: clampInteger(config.maxBlocks, 20, 1000, DEFAULT_CONFIG.maxBlocks),
      translateUIText: Boolean(config.translateUIText)
    }
  });
}

function clampInteger(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
