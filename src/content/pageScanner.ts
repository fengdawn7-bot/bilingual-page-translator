import type { TextBlock } from "../shared/types";

const SKIP_ANCESTOR_SELECTOR = [
  "input",
  "textarea",
  "select",
  "option",
  "script",
  "style",
  "pre",
  "code",
  "[contenteditable='true']",
  ".bpt-translation"
].join(",");
const TRANSLATION_TARGET_SELECTOR = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "blockquote",
  "figcaption",
  "td",
  "th",
  "dt",
  "dd",
  "button",
  "a",
  "label",
  "[role='button']",
  "[role='link']",
  "[role='listitem']",
  "span",
  "div"
].join(",");
const MIN_TEXT_LENGTH = 2;
const MAX_TEXT_LENGTH = 900;
const MAX_BLOCKS = 220;

export function collectTranslatableBlocks(root: Document = document): TextBlock[] {
  if (!root.body) return [];

  const seen = new Set<string>();
  const seenElements = new Set<HTMLElement>();
  const blocks: TextBlock[] = [];
  const walker = root.createTreeWalker(root.body, NodeFilter.SHOW_TEXT);

  let node = walker.nextNode();
  while (node && blocks.length < MAX_BLOCKS) {
    const textNode = node;
    node = walker.nextNode();

    const parent = textNode.parentElement;
    if (!parent) continue;

    const element = findTranslationTarget(parent);
    if (!element || seenElements.has(element)) continue;

    const text = normalizeText(textNode.textContent ?? "");
    if (!isTranslatableElement(element, text)) continue;
    if (seen.has(text)) continue;

    seen.add(text);
    seenElements.add(element);
    const id = element.dataset.bptId || `bpt-${Date.now()}-${blocks.length}`;
    element.dataset.bptId = id;
    element.dataset.bptStatus = "pending";
    blocks.push({ id, text });
  }

  return blocks;
}

export function findBlockElement(id: string, root: Document = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-bpt-id="${CSS.escape(id)}"]`);
}

function isTranslatableElement(element: HTMLElement, text: string): boolean {
  if (element.closest("[data-bpt-status='done']")) return false;
  if (element.closest(SKIP_ANCESTOR_SELECTOR)) return false;
  if (text.length < MIN_TEXT_LENGTH) return false;
  if (text.length > MAX_TEXT_LENGTH) return false;
  if (!hasMeaningfulLetters(text)) return false;
  if (!isVisible(element)) return false;
  return true;
}

function findTranslationTarget(element: HTMLElement): HTMLElement | null {
  const target = element.closest<HTMLElement>(TRANSLATION_TARGET_SELECTOR);
  if (!target || target === document.body || target === document.documentElement) return null;
  return target;
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden) return false;
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function hasMeaningfulLetters(text: string): boolean {
  return /[A-Za-z\u00C0-\u024F\u0400-\u04FF]/.test(text);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
