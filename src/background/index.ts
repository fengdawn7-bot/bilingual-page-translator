import { testProviderConnection } from "./provider";
import { ChromeStorageTranslationCache } from "./translationCache";
import { translateItems } from "./translationService";
import { getConfig } from "../shared/storage";
import type { RuntimeRequest } from "../shared/types";

const cache = new ChromeStorageTranslationCache();

chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error: unknown) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown extension error"
      });
    });
  return true;
});

async function handleMessage(message: RuntimeRequest): Promise<unknown> {
  if (message.type === "BPT_TEST_CONNECTION") {
    await testProviderConnection(message.config);
    return undefined;
  }

  if (message.type === "BPT_TRANSLATE_BATCH") {
    const config = await getConfig();
    return translateItems({
      config,
      pageUrl: message.pageUrl,
      items: message.items,
      cache,
      batchSize: config.batchSize,
      concurrency: config.concurrency
    });
  }

  throw new Error("Unsupported runtime message");
}
