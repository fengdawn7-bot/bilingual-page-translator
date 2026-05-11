import { describe, expect, test, vi } from "vitest";
import { testDeepLConnection, translateWithDeepL } from "../src/background/deeplClient";
import type { TranslatorConfig } from "../src/shared/types";

const config: TranslatorConfig = {
  provider: "deepl",
  apiKey: "deepl-key",
  baseURL: "https://api-free.deepl.com",
  model: "gpt-4o-mini",
  targetLanguage: "ZH-HANS",
  batchSize: 32,
  concurrency: 3,
  maxBlocks: 300,
  translateUIText: false
};

describe("deeplClient", () => {
  test("translates a batch using DeepL JSON API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: [{ text: "first" }, { text: "second" }]
      })
    });

    const result = await translateWithDeepL({
      config,
      texts: ["First paragraph.", "Second paragraph."],
      fetchImpl: fetchMock
    });

    expect(result).toEqual(["first", "second"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-free.deepl.com/v2/translate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "DeepL-Auth-Key deepl-key",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          text: ["First paragraph.", "Second paragraph."],
          target_lang: "ZH-HANS",
          model_type: "latency_optimized",
          preserve_formatting: true
        })
      })
    );
  });

  test("throws a clear error when DeepL returns a different translation count", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "first" }] })
    });

    await expect(
      translateWithDeepL({
        config,
        texts: ["First paragraph.", "Second paragraph."],
        fetchImpl: fetchMock
      })
    ).rejects.toThrow("DeepL returned a different number of translations than requested");
  });

  test("tests connection with a one-item request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "connection ok" }] })
    });

    await expect(testDeepLConnection(config, fetchMock)).resolves.toBeUndefined();
  });
});
