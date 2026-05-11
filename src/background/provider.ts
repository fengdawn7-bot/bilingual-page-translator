import { testDeepLConnection, translateWithDeepL } from "./deeplClient";
import { testConnection as testOpenAIConnection, translateBatch } from "./openaiClient";
import type { TranslatorConfig } from "../shared/types";

export interface ProviderTranslateOptions {
  config: TranslatorConfig;
  texts: string[];
  fetchImpl?: typeof fetch;
}

export async function translateWithProvider({
  config,
  texts,
  fetchImpl = fetch
}: ProviderTranslateOptions): Promise<string[]> {
  if (config.provider === "deepl") {
    return translateWithDeepL({ config, texts, fetchImpl });
  }

  return translateBatch({ config, texts, fetchImpl });
}

export async function testProviderConnection(
  config: TranslatorConfig,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  if (config.provider === "deepl") {
    await testDeepLConnection(config, fetchImpl);
    return;
  }

  await testOpenAIConnection(config, fetchImpl);
}
