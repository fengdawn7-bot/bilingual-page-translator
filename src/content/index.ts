import { collectTranslatableBlocks, findBlockElement } from "./pageScanner";
import { clearTranslations, insertTranslation, setTranslationsVisible } from "./translationDom";
import type { RuntimeRequest, TabRequest, TranslationItem, TranslationProgress } from "../shared/types";

const MARKER = "__BPT_CONTENT_SCRIPT_READY__";
const CONFIG_STORAGE_KEY = "bpt-translator-config";
const DEFAULT_CONTENT_CONFIG = {
  batchSize: 32,
  concurrency: 3,
  maxBlocks: 300,
  translateUIText: false
};

declare global {
  interface Window {
    [MARKER]?: boolean;
  }
}

if (!window[MARKER]) {
  window[MARKER] = true;
  chrome.runtime.onMessage.addListener((message: TabRequest, _sender, sendResponse) => {
    handleTabMessage(message)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Unknown content script error"
        });
      });
    return true;
  });
}

async function handleTabMessage(message: TabRequest): Promise<unknown> {
  if (message.type === "BPT_PING") {
    return { ready: true };
  }

  if (message.type === "BPT_CLEAR_TRANSLATIONS") {
    clearTranslations(document);
    return { cleared: true };
  }

  if (message.type === "BPT_SET_TRANSLATIONS_VISIBLE") {
    setTranslationsVisible(document, message.visible);
    return { visible: message.visible };
  }

  if (message.type === "BPT_TRANSLATE_PAGE") {
    const config = await getContentConfig();
    const blocks = collectTranslatableBlocks(document, {
      maxBlocks: config.maxBlocks,
      translateUIText: config.translateUIText
    });
    let translatedCount = 0;
    let failedCount = 0;

    sendProgress({
      type: "BPT_TRANSLATION_PROGRESS",
      phase: "scanned",
      total: blocks.length,
      translated: 0,
      failed: 0
    });

    if (blocks.length > 0) {
      const requestWindowSize = config.batchSize * config.concurrency;
      for (let index = 0; index < blocks.length; index += requestWindowSize) {
        const batch = blocks.slice(index, index + requestWindowSize);
        const response = await sendRuntimeMessage<TranslationItem[]>({
          type: "BPT_TRANSLATE_BATCH",
          pageUrl: location.href,
          items: batch
        });

        failedCount += batch.length - response.length;

        for (const item of response) {
          const element = findBlockElement(item.id, document);
          if (element) {
            insertTranslation(element, item.translation);
            translatedCount += 1;
          }
        }

        sendProgress({
          type: "BPT_TRANSLATION_PROGRESS",
          phase: "batch-complete",
          total: blocks.length,
          translated: translatedCount,
          failed: failedCount
        });
      }
    }

    sendProgress({
      type: "BPT_TRANSLATION_PROGRESS",
      phase: "complete",
      total: blocks.length,
      translated: translatedCount,
      failed: failedCount
    });

    return { translatedCount, failedCount, total: blocks.length };
  }

  throw new Error("Unsupported tab message");
}

async function getContentConfig() {
  const stored = await chrome.storage.local.get(CONFIG_STORAGE_KEY);
  return {
    ...DEFAULT_CONTENT_CONFIG,
    ...(stored[CONFIG_STORAGE_KEY] ?? {})
  };
}

function sendProgress(progress: TranslationProgress): void {
  chrome.runtime.sendMessage(progress).catch(() => {
    // The popup may have closed; translation should continue on the page.
  });
}

function sendRuntimeMessage<T>(message: RuntimeRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response?: { ok: boolean; data?: T; error?: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "Runtime request failed"));
        return;
      }
      resolve(response.data as T);
    });
  });
}
