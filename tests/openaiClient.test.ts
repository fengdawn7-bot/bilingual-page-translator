import { describe, expect, test, vi } from "vitest";
import { translateBatch, testConnection } from "../src/background/openaiClient";
import type { TranslatorConfig } from "../src/shared/types";

const config: TranslatorConfig = {
  apiKey: "test-key",
  baseURL: "https://api.example.com/v1",
  model: "test-model",
  targetLanguage: "Simplified Chinese"
};

describe("openaiClient", () => {
  test("translates a batch using OpenAI-compatible chat completions JSON output", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(["第一段译文", "第二段译文"])
            }
          }
        ]
      })
    });

    const result = await translateBatch({
      config,
      texts: ["First paragraph.", "Second paragraph."],
      fetchImpl: fetchMock
    });

    expect(result).toEqual(["第一段译文", "第二段译文"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json"
        })
      })
    );
  });

  test("throws a clear error when the model returns invalid translation JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "not json" } }]
      })
    });

    await expect(
      translateBatch({ config, texts: ["First paragraph."], fetchImpl: fetchMock })
    ).rejects.toThrow("Model returned invalid translation JSON");
  });

  test("tests connection with a one-item translation request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(["连接成功"]) } }]
      })
    });

    await expect(testConnection(config, fetchMock)).resolves.toBeUndefined();
  });

  test("times out when the translation API does not respond", async () => {
    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    await expect(
      translateBatch({
        config,
        texts: ["First paragraph."],
        fetchImpl: fetchMock,
        timeoutMs: 5
      })
    ).rejects.toThrow("Translation API request timed out");
  });
});
