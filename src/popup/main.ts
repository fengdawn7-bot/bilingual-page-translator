import "../styles/app.css";
import type { TabRequest } from "../shared/types";

let translationsVisible = true;

const translateButton = document.querySelector<HTMLButtonElement>("#translate-page");
const clearButton = document.querySelector<HTMLButtonElement>("#clear-page");
const toggleButton = document.querySelector<HTMLButtonElement>("#toggle-visible");
const optionsButton = document.querySelector<HTMLButtonElement>("#open-options");
const statusElement = document.querySelector<HTMLElement>("#status");

translateButton?.addEventListener("click", async () => {
  await runWithStatus("正在翻译当前页...", async () => {
    const result = await sendToActiveTab<{ translatedCount: number }>({ type: "BPT_TRANSLATE_PAGE" });
    setStatus(`已插入 ${result.translatedCount} 条译文`);
  });
});

clearButton?.addEventListener("click", async () => {
  await runWithStatus("正在清除译文...", async () => {
    await sendToActiveTab({ type: "BPT_CLEAR_TRANSLATIONS" });
    setStatus("已清除当前页译文");
  });
});

toggleButton?.addEventListener("click", async () => {
  translationsVisible = !translationsVisible;
  await runWithStatus(translationsVisible ? "正在显示译文..." : "正在隐藏译文...", async () => {
    await sendToActiveTab({ type: "BPT_SET_TRANSLATIONS_VISIBLE", visible: translationsVisible });
    toggleButton.textContent = translationsVisible ? "隐藏译文" : "显示译文";
    setStatus(translationsVisible ? "译文已显示" : "译文已隐藏");
  });
});

optionsButton?.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

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

async function sendToActiveTab<T = unknown>(message: TabRequest): Promise<T> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("没有可用的当前标签页");

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tab.id!, message, (response?: { ok: boolean; data?: T; error?: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response?.ok) {
        reject(new Error(response?.error ?? "页面脚本响应失败"));
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
