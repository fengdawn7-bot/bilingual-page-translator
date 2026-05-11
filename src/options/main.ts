import "../styles/app.css";
import { DEFAULT_CONFIG } from "../shared/defaults";
import { getConfig, saveConfig } from "../shared/storage";
import type { RuntimeRequest, TranslatorConfig } from "../shared/types";

const form = document.querySelector<HTMLFormElement>("#settings-form");
const apiKeyInput = document.querySelector<HTMLInputElement>("#api-key");
const baseURLInput = document.querySelector<HTMLInputElement>("#base-url");
const modelInput = document.querySelector<HTMLInputElement>("#model");
const targetLanguageInput = document.querySelector<HTMLInputElement>("#target-language");
const batchSizeInput = document.querySelector<HTMLInputElement>("#batch-size");
const concurrencyInput = document.querySelector<HTMLInputElement>("#concurrency");
const maxBlocksInput = document.querySelector<HTMLInputElement>("#max-blocks");
const translateUITextInput = document.querySelector<HTMLInputElement>("#translate-ui-text");
const testButton = document.querySelector<HTMLButtonElement>("#test-connection");
const statusElement = document.querySelector<HTMLElement>("#status");

void load();

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runWithStatus("正在保存...", async () => {
    await saveConfig(readForm());
    setStatus("设置已保存");
  });
});

testButton?.addEventListener("click", async () => {
  await runWithStatus("正在测试连接...", async () => {
    const config = readForm();
    await saveConfig(config);
    await sendRuntimeMessage({ type: "BPT_TEST_CONNECTION", config });
    setStatus("连接测试成功");
  });
});

async function load(): Promise<void> {
  const config = await getConfig();
  if (apiKeyInput) apiKeyInput.value = config.apiKey;
  if (baseURLInput) baseURLInput.value = config.baseURL;
  if (modelInput) modelInput.value = config.model;
  if (targetLanguageInput) targetLanguageInput.value = config.targetLanguage;
  if (batchSizeInput) batchSizeInput.value = String(config.batchSize);
  if (concurrencyInput) concurrencyInput.value = String(config.concurrency);
  if (maxBlocksInput) maxBlocksInput.value = String(config.maxBlocks);
  if (translateUITextInput) translateUITextInput.checked = config.translateUIText;
}

function readForm(): TranslatorConfig {
  return {
    apiKey: apiKeyInput?.value.trim() ?? "",
    baseURL: baseURLInput?.value.trim() || DEFAULT_CONFIG.baseURL,
    model: modelInput?.value.trim() || DEFAULT_CONFIG.model,
    targetLanguage: targetLanguageInput?.value.trim() || DEFAULT_CONFIG.targetLanguage,
    batchSize: readNumber(batchSizeInput, DEFAULT_CONFIG.batchSize),
    concurrency: readNumber(concurrencyInput, DEFAULT_CONFIG.concurrency),
    maxBlocks: readNumber(maxBlocksInput, DEFAULT_CONFIG.maxBlocks),
    translateUIText: translateUITextInput?.checked ?? DEFAULT_CONFIG.translateUIText
  };
}

function readNumber(input: HTMLInputElement | null, fallback: number): number {
  if (!input) return fallback;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

async function runWithStatus(message: string, action: () => Promise<void>): Promise<void> {
  try {
    setStatus(message);
    setControlsDisabled(true);
    await action();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "操作失败");
  } finally {
    setControlsDisabled(false);
  }
}

function sendRuntimeMessage<T>(message: RuntimeRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response?: { ok: boolean; data?: T; error?: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "请求失败"));
        return;
      }
      resolve(response.data as T);
    });
  });
}

function setStatus(message: string): void {
  if (statusElement) statusElement.textContent = message;
}

function setControlsDisabled(disabled: boolean): void {
  document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.disabled = disabled;
  });
}
