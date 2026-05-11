import { describe, expect, test } from "vitest";
import { collectTranslatableBlocks } from "../src/content/pageScanner";

describe("collectTranslatableBlocks", () => {
  test("collects visible article paragraphs and skips code", () => {
    document.body.innerHTML = `
      <main>
        <article>
          <h1>A useful heading about browser translation</h1>
          <p>Chrome extensions can improve reading workflows when they keep the original paragraph visible.</p>
          <p>Short.</p>
          <pre>const message = "do not translate code";</pre>
        </article>
      </main>
    `;

    const blocks = collectTranslatableBlocks(document);

    expect(blocks.map((block) => block.text)).toEqual([
      "A useful heading about browser translation",
      "Chrome extensions can improve reading workflows when they keep the original paragraph visible.",
      "Short."
    ]);
  });

  test("collects GitHub-style UI text from divs, links, spans, buttons, and nav labels", () => {
    document.body.innerHTML = `
      <nav><a>Repositories</a><button>Save</button></nav>
      <main>
        <div role="listitem">
          <h3><a>dhruv9499/Google-Drive-BULK-Access-remover</a></h3>
          <div>Automatically removes specified email addresses from ALL Google Drive files accessible by your account.</div>
          <span>JavaScript</span>
        </div>
      </main>
    `;

    const blocks = collectTranslatableBlocks(document);

    expect(blocks.map((block) => block.text)).toEqual([
      "Repositories",
      "Save",
      "dhruv9499/Google-Drive-BULK-Access-remover",
      "Automatically removes specified email addresses from ALL Google Drive files accessible by your account.",
      "JavaScript"
    ]);
  });

  test("does not collect elements that were already translated", () => {
    document.body.innerHTML = `
      <main>
        <p data-bpt-status="done">This paragraph has already been processed and must not be collected again.</p>
        <p>This new paragraph should be collected because it has not been processed yet.</p>
      </main>
    `;

    const blocks = collectTranslatableBlocks(document);

    expect(blocks.map((block) => block.text)).toEqual([
      "This new paragraph should be collected because it has not been processed yet."
    ]);
  });
});
