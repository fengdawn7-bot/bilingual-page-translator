import { describe, expect, test, vi } from "vitest";
import { testProviderConnection, translateWithProvider } from "../src/background/provider";
import type { TranslatorConfig } from "../src/shared/types";

const baseConfig: TranslatorConfig = {
  provider: "deepl",
  apiKey: "key",
  baseURL: "https://api-free.deepl.com",
  model: "gpt-4o-mini",
  targetLanguage: "ZH-HANS",
  batchSize: 32,
  concurrency: 3,
  maxBlocks: 300,
  translateUIText: false
};

describe("provider router", () => {
  test("uses DeepL provider when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "translated" }] })
    });

    await expect(
      translateWithProvider({
        config: baseConfig,
        texts: ["source"],
        fetchImpl: fetchMock
      })
    ).resolves.toEqual(["translated"]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api-free.deepl.com/v2/translate");
  });

  test("uses OpenAI-compatible provider when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(["translated"]) } }]
      })
    });

    await expect(
      translateWithProvider({
        config: {
          ...baseConfig,
          provider: "openai-compatible",
          baseURL: "https://api.example.com/v1",
          targetLanguage: "Simplified Chinese"
        },
        texts: ["source"],
        fetchImpl: fetchMock
      })
    ).resolves.toEqual(["translated"]);

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.example.com/v1/chat/completions");
  });

  test("tests the selected provider connection", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: "ok" }] })
    });

    await expect(testProviderConnection(baseConfig, fetchMock)).resolves.toBeUndefined();
  });
});
