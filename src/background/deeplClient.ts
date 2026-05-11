import type { TranslatorConfig } from "../shared/types";

export interface DeepLTranslateOptions {
  config: TranslatorConfig;
  texts: string[];
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface DeepLResponse {
  translations?: Array<{
    text?: string;
  }>;
}

export async function translateWithDeepL({
  config,
  texts,
  fetchImpl = fetch,
  timeoutMs = 20_000
}: DeepLTranslateOptions): Promise<string[]> {
  validateConfig(config);
  if (texts.length === 0) return [];

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetchImpl(`${normalizeBaseURL(config.baseURL)}/v2/translate`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `DeepL-Auth-Key ${config.apiKey}`
      },
      body: JSON.stringify({
        text: texts,
        target_lang: config.targetLanguage,
        model_type: "latency_optimized",
        preserve_formatting: true
      })
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("DeepL API request timed out after 20 seconds");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const details = await readErrorDetails(response);
    throw new Error(`DeepL API request failed (${response.status}): ${details}`);
  }

  const data = (await response.json()) as DeepLResponse;
  const translations = data.translations?.map((item) => item.text ?? "") ?? [];
  if (translations.length !== texts.length) {
    throw new Error("DeepL returned a different number of translations than requested");
  }
  return translations;
}

export async function testDeepLConnection(
  config: TranslatorConfig,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  await translateWithDeepL({
    config,
    texts: ["Connection test"],
    fetchImpl
  });
}

function validateConfig(config: TranslatorConfig): void {
  if (!config.apiKey.trim()) throw new Error("API Key is required");
  if (!config.baseURL.trim()) throw new Error("Base URL is required");
  if (!config.targetLanguage.trim()) throw new Error("Target language is required");
}

function normalizeBaseURL(baseURL: string): string {
  return baseURL.trim().replace(/\/+$/, "");
}

async function readErrorDetails(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return response.statusText || "unknown error";
  }
}
