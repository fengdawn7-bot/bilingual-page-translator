# Bilingual Page Translator

A self-hosted Chrome Manifest V3 extension for bilingual webpage translation with DeepL or an OpenAI-compatible API.

## Features

- Manual translation for the current tab.
- Bilingual display by inserting translations below source text.
- Local settings for provider, API key, base URL, model, and target language.
- DeepL provider for faster normal webpage translation.
- OpenAI-compatible Chat Completions API support, including DeepSeek-style endpoints.
- Local translation cache keyed by page URL, source text, target language, and model.
- Broader visible text scanning for article pages and app-like pages such as GitHub.
- Larger concurrent translation batches for faster page translation.
- Progressive insertion with popup progress while the page is still translating.
- Configurable batch size, concurrency, per-page limit, and UI text translation.

## Development

```bash
npm install
npm test
npm run build
```

Load the generated `dist` directory in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select the `dist` folder.

## API Configuration

Open the extension options page and set:

- `Provider`: `DeepL` for speed, or `OpenAI Compatible` for complex content.
- `API Key`: your provider key.
- `Base URL`: for DeepL Free, use `https://api-free.deepl.com`; for DeepL Pro, use `https://api.deepl.com`; for DeepSeek, use `https://api.deepseek.com`.
- `Model`: disabled for DeepL; for DeepSeek, `deepseek-v4-flash` is a current OpenAI-compatible option.
- `Target language`: default is `ZH-HANS` for DeepL and `Simplified Chinese` for OpenAI-compatible providers.
- `Batch size`: default is `32`.
- `Concurrency`: default is `3`.
- `Max blocks per page`: default is `300`.
- `Translate UI text`: disabled by default to avoid translating navigation chrome and app data; enable it for app-like pages if needed.

The API key is stored locally in Chrome storage. This project does not include a backend proxy.

## Scope

This MVP supports ordinary webpages. It does not support PDF translation, video subtitles, automatic site rules, or multi-user billing.

## License

MIT
