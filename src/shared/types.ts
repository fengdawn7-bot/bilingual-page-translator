export interface TranslatorConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  targetLanguage: string;
  batchSize: number;
  concurrency: number;
  maxBlocks: number;
  translateUIText: boolean;
}

export interface TextBlock {
  id: string;
  text: string;
}

export interface TranslationItem extends TextBlock {
  translation: string;
}

export type RuntimeRequest =
  | {
      type: "BPT_TRANSLATE_BATCH";
      pageUrl: string;
      items: TextBlock[];
    }
  | {
      type: "BPT_TEST_CONNECTION";
      config: TranslatorConfig;
    };

export type TabRequest =
  | { type: "BPT_TRANSLATE_PAGE" }
  | { type: "BPT_CLEAR_TRANSLATIONS" }
  | { type: "BPT_SET_TRANSLATIONS_VISIBLE"; visible: boolean };

export type ProgressPhase = "scanned" | "batch-complete" | "complete" | "error";

export interface TranslationProgress {
  type: "BPT_TRANSLATION_PROGRESS";
  phase: ProgressPhase;
  total: number;
  translated: number;
  failed: number;
  message?: string;
}
