import { createCacheKey, type TranslationCache } from "./translationCache";
import { translateBatch, type TranslateBatchOptions } from "./openaiClient";
import type { TextBlock, TranslationItem, TranslatorConfig } from "../shared/types";

interface PendingItem extends TextBlock {
  key: string;
  order: number;
}

export interface TranslateItemsOptions {
  config: TranslatorConfig;
  pageUrl: string;
  items: TextBlock[];
  cache: TranslationCache;
  translateBatch?: (options: TranslateBatchOptions) => Promise<string[]>;
  batchSize?: number;
  concurrency?: number;
}

export async function translateItems({
  config,
  pageUrl,
  items,
  cache,
  translateBatch: translate = translateBatch,
  batchSize = 32,
  concurrency = 3
}: TranslateItemsOptions): Promise<TranslationItem[]> {
  const results = new Array<TranslationItem | undefined>(items.length);
  const pending: PendingItem[] = [];

  await Promise.all(
    items.map(async (item, order) => {
      const key = await createCacheKey({
        pageUrl,
        text: item.text,
        targetLanguage: config.targetLanguage,
        model: config.model
      });
      const cached = await cache.get(key);
      if (cached) {
        results[order] = { ...item, translation: cached };
      } else {
        pending.push({ ...item, key, order });
      }
    })
  );

  const batches = chunk(pending.sort((a, b) => a.order - b.order), batchSize);
  await runWithConcurrency(batches, concurrency, async (batch) => {
    const translations = await translate({
      config,
      texts: batch.map((item) => item.text)
    });

    await Promise.all(
      batch.map(async (item, translationIndex) => {
        const translation = translations[translationIndex] ?? "";
        await cache.set(item.key, translation);
        results[item.order] = { id: item.id, text: item.text, translation };
      })
    );
  });

  return results.filter((item): item is TranslationItem => Boolean(item));
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      await worker(item);
    }
  });
  await Promise.all(workers);
}
