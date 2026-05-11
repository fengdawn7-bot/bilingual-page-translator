import type { TranslatorConfig } from "./types";

export const DEFAULT_CONFIG: TranslatorConfig = {
  provider: "deepl",
  apiKey: "",
  baseURL: "https://api-free.deepl.com",
  model: "latency_optimized",
  targetLanguage: "ZH-HANS",
  batchSize: 32,
  concurrency: 3,
  maxBlocks: 300,
  translateUIText: false
};

export const CONFIG_STORAGE_KEY = "bpt-translator-config";
