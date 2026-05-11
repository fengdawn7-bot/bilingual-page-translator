import type { TranslatorConfig } from "../shared/types";

export interface TranslateBatchOptions {
  config: TranslatorConfig;
  texts: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const SYSTEM_PROMPT =
  "You are a precise translation engine. Translate only. Do not explain. Preserve numbers, names, code-like tokens, and link text meaning.";

export async function translateBatch({
  config,
  texts,
  fetchImpl = fetch,
  timeoutMs = 30_000
}: TranslateBatchOptions): Promise<string[]> {
  validateConfig(config);

  if (texts.length === 0) return [];

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetchImpl(`${normalizeBaseURL(config.baseURL)}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: [
              `Translate each item to ${config.targetLanguage}.`,
              "Return only a JSON array of strings in the same order as the input.",
              JSON.stringify(texts)
            ].join("\n")
          }
        ]
      })
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Translation API request timed out after 30 seconds");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const details = await readErrorDetails(response);
    throw new Error(`Translation API request failed (${response.status}): ${details}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Translation API response did not include message content");
  }

  const translations = parseTranslationArray(content);
  if (translations.length !== texts.length) {
    throw new Error("Model returned a different number of translations than requested");
  }

  return translations;
}

export async function testConnection(
  config: TranslatorConfig,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  await translateBatch({
    config,
    texts: ["Connection test"],
    fetchImpl
  });
}

function validateConfig(config: TranslatorConfig): void {
  if (!config.apiKey.trim()) throw new Error("API Key is required");
  if (!config.baseURL.trim()) throw new Error("Base URL is required");
  if (!config.model.trim()) throw new Error("Model is required");
  if (!config.targetLanguage.trim()) throw new Error("Target language is required");
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.trim().replace(/\/+$/, "");
}

function parseTranslationArray(content: string): string[] {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
      throw new Error("not a string array");
    }
    return parsed;
  } catch {
    throw new Error("Model returned invalid translation JSON");
  }
}

async function readErrorDetails(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText || "unknown error";
  }
}
