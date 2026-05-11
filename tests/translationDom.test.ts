import { describe, expect, test } from "vitest";
import { clearTranslations, insertTranslation, setTranslationsVisible } from "../src/content/translationDom";

describe("translation DOM helpers", () => {
  test("inserts one bilingual translation block after the source element", () => {
    document.body.innerHTML = `<main><p id="source">Original paragraph with enough text to translate.</p></main>`;
    const source = document.querySelector("#source") as HTMLElement;

    insertTranslation(source, "这是一段译文。");
    insertTranslation(source, "这是一段译文。");

    const translations = document.querySelectorAll(".bpt-translation");
    expect(translations).toHaveLength(1);
    expect(translations[0]?.textContent).toBe("这是一段译文。");
    expect(source.dataset.bptStatus).toBe("done");
  });

  test("can hide, show, and clear inserted translations", () => {
    document.body.innerHTML = `<main><p id="source">Original paragraph with enough text to translate.</p></main>`;
    const source = document.querySelector("#source") as HTMLElement;

    insertTranslation(source, "这是一段译文。");
    setTranslationsVisible(document, false);

    expect((document.querySelector(".bpt-translation") as HTMLElement).hidden).toBe(true);

    setTranslationsVisible(document, true);
    expect((document.querySelector(".bpt-translation") as HTMLElement).hidden).toBe(false);

    clearTranslations(document);
    expect(document.querySelector(".bpt-translation")).toBeNull();
    expect(source.dataset.bptStatus).toBeUndefined();
  });
});
