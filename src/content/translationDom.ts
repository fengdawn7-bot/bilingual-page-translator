const TRANSLATION_CLASS = "bpt-translation";
const STYLE_ID = "bpt-translation-style";

export function insertTranslation(source: HTMLElement, translation: string): void {
  ensureStyles(document);
  const existing = source.nextElementSibling;
  if (existing?.classList.contains(TRANSLATION_CLASS)) {
    existing.textContent = translation;
    source.dataset.bptStatus = "done";
    return;
  }

  const translationElement = document.createElement("div");
  translationElement.className = TRANSLATION_CLASS;
  translationElement.textContent = translation;
  source.insertAdjacentElement("afterend", translationElement);
  source.dataset.bptStatus = "done";
}

export function setTranslationsVisible(root: Document, visible: boolean): void {
  root.querySelectorAll<HTMLElement>(`.${TRANSLATION_CLASS}`).forEach((element) => {
    element.hidden = !visible;
  });
}

export function clearTranslations(root: Document): void {
  root.querySelectorAll(`.${TRANSLATION_CLASS}`).forEach((element) => element.remove());
  root.querySelectorAll<HTMLElement>("[data-bpt-status]").forEach((element) => {
    delete element.dataset.bptStatus;
  });
}

function ensureStyles(root: Document): void {
  if (root.getElementById(STYLE_ID)) return;
  const style = root.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${TRANSLATION_CLASS} {
      margin: 0.35em 0 0.9em;
      padding: 0.55em 0.75em;
      border-left: 3px solid #2563eb;
      background: rgba(37, 99, 235, 0.08);
      color: #1f2937;
      font-size: 0.95em;
      line-height: 1.65;
      white-space: pre-wrap;
    }
  `;
  root.head.append(style);
}
