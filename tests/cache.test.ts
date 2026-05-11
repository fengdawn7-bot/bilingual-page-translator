import { describe, expect, test } from "vitest";
import { createCacheKey, MemoryTranslationCache } from "../src/background/translationCache";

describe("translation cache", () => {
  test("keys cached translations by page URL, source text, target language, and model", async () => {
    const cache = new MemoryTranslationCache();
    const key = await createCacheKey({
      pageUrl: "https://example.com/article",
      text: "A paragraph to translate",
      targetLanguage: "Simplified Chinese",
      model: "gpt-4o-mini"
    });

    await cache.set(key, "一段译文");

    expect(await cache.get(key)).toBe("一段译文");
    expect(
      await cache.get(
        await createCacheKey({
          pageUrl: "https://example.com/article",
          text: "A paragraph to translate",
          targetLanguage: "Japanese",
          model: "gpt-4o-mini"
        })
      )
    ).toBeUndefined();
  });
});
