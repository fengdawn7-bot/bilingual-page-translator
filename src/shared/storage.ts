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
      apiKey: config.apiKey.trim(),
      baseURL: config.baseURL.trim().replace(/\/+$/, ""),
      model: config.model.trim(),
      targetLanguage: config.targetLanguage.trim() || DEFAULT_CONFIG.targetLanguage
    }
  });
}
