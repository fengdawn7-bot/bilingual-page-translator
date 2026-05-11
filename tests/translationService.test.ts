import { describe, expect, test, vi } from "vitest";
import { translateItems } from "../src/background/translationService";
import type { TranslatorConfig } from "../src/shared/types";

const config: TranslatorConfig = {
  apiKey: "test-key",
  baseURL: "https://api.example.com/v1",
  model: "test-model",
  targetLanguage: "Simplified Chinese"
};

describe("translateItems", () => {
  test("translates uncached items in larger concurrent API batches", async () => {
    const translateBatch = vi.fn(async ({ texts }: { texts: string[] }) =>
      texts.map((text) => `译文:${text}`)
    );
    const cache = new Map<string, string>();
    const items = Array.from({ length: 65 }, (_, index) => ({
      id: `id-${index}`,
      text: `Visible text ${index}`
    }));

    const result = await translateItems({
      config,
      pageUrl: "https://github.com/search?q=Google+email",
      items,
      cache: {
        get: async (key) => cache.get(key),
        set: async (key, value) => {
          cache.set(key, value);
        }
      },
      translateBatch,
      batchSize: 32,
      concurrency: 3
    });

    expect(result).toHaveLength(65);
    expect(translateBatch).toHaveBeenCalledTimes(3);
    expect(translateBatch.mock.calls.map(([call]) => call.texts.length)).toEqual([32, 32, 1]);
  });
});
