import type { TranslatorConfig } from "./types";

export const DEFAULT_CONFIG: TranslatorConfig = {
  apiKey: "",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  targetLanguage: "Simplified Chinese",
  batchSize: 32,
  concurrency: 3,
  maxBlocks: 300,
  translateUIText: false
};

export const CONFIG_STORAGE_KEY = "bpt-translator-config";
