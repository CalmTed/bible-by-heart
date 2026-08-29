// The HOST is read at module load, so the mock has to be in place before the
// service is imported - jest hoists this above the imports below.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { extra: { HOST: "https://api.test/" } } }
}));

import { BUNDLED_TRANSLATION_SOURCES, LANGCODE } from "../../src/constants";
import { AddressType } from "../../src/models";
import {
  fetchPassageText,
  fetchTranslationCatalogue
} from "../../src/services/fetchPassageText";

// One call for every translation. The client holds no key and knows no
// translation-specific request: which text source is wanted is one parameter,
// and a source that cannot answer leaves the app working, just textless.

const johnThreeSixteen: AddressType = {
  bookIndex: 42,
  startChapterNum: 2,
  startVerseNum: 15,
  endChapterNum: null,
  endVerseNum: null
};

const answer: (body: unknown, ok?: boolean, status?: number) => jest.Mock = (
  body,
  ok = true,
  status = 200
) =>
  jest.fn(async () => ({
    ok,
    status,
    json: async () => body
  }));

describe("fetchPassageText", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks the API for the address as it is, in the named translation", async () => {
    const fetchMock = answer({ text: "For God so loved the world" });
    global.fetch = fetchMock as unknown as typeof fetch;

    const text = await fetchPassageText(johnThreeSixteen, "ukr-ogi");

    expect(text).toBe("For God so loved the world");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("https://api.test/api/translation/getPassage?");
    expect(url).toContain("translationId=ukr-ogi");
    //zero-based on both sides of the wire, exactly as the app addresses
    expect(url).toContain("bookIndex=42");
    expect(url).toContain("startChapterNum=2");
    expect(url).toContain("startVerseNum=15");
  });

  it("leaves the end of a one-verse address out of the query", async () => {
    const fetchMock = answer({ text: "a verse" });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchPassageText(johnThreeSixteen, "esv");

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).not.toContain("endChapterNum");
    expect(url).not.toContain("endVerseNum");
  });

  it("sends the end of a range when there is one", async () => {
    const fetchMock = answer({ text: "several verses" });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchPassageText(
      { ...johnThreeSixteen, endChapterNum: 2, endVerseNum: 17 },
      "esv"
    );

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("endChapterNum=2");
    expect(url).toContain("endVerseNum=17");
  });

  it("carries no authorization of its own - the key is the server's", async () => {
    const fetchMock = answer({ text: "a verse" });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchPassageText(johnThreeSixteen, "esv");

    const init = fetchMock.mock.calls[0][1] as { headers?: unknown };
    expect(init.headers).toBeUndefined();
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toMatch(/token/i);
  });

  it("rejects when the source has nothing to give, rather than half-text", async () => {
    global.fetch = answer(
      { error: "Text source is unavailable" },
      false,
      502
    ) as unknown as typeof fetch;

    await expect(fetchPassageText(johnThreeSixteen, "esv")).rejects.toThrow();
  });

  it("rejects on an empty body, so no passage is saved with no text", async () => {
    global.fetch = answer({ text: "" }) as unknown as typeof fetch;

    await expect(fetchPassageText(johnThreeSixteen, "esv")).rejects.toThrow();
  });
});

describe("fetchTranslationCatalogue", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reads the live catalogue, mapping the API's language code to the app's", async () => {
    global.fetch = answer({
      translations: [
        { id: "ukr-ogi", title: "Переклад Огієнка", language: "uk" },
        { id: "esv", title: "ESV®", language: "en", isRemote: true }
      ]
    }) as unknown as typeof fetch;

    const catalogue = await fetchTranslationCatalogue();

    expect(catalogue).toEqual([
      {
        sourceId: "ukr-ogi",
        title: "Переклад Огієнка",
        language: LANGCODE.ua,
        isRemote: false
      },
      {
        sourceId: "esv",
        title: "ESV®",
        language: LANGCODE.en,
        isRemote: true
      }
    ]);
  });

  it("falls back to the shipped list when the server cannot be reached", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;

    await expect(fetchTranslationCatalogue()).resolves.toEqual(
      BUNDLED_TRANSLATION_SOURCES
    );
  });

  it("falls back to the shipped list on a refusal or an empty answer", async () => {
    global.fetch = answer({}, false, 500) as unknown as typeof fetch;
    await expect(fetchTranslationCatalogue()).resolves.toEqual(
      BUNDLED_TRANSLATION_SOURCES
    );

    global.fetch = answer({ translations: [] }) as unknown as typeof fetch;
    await expect(fetchTranslationCatalogue()).resolves.toEqual(
      BUNDLED_TRANSLATION_SOURCES
    );
  });
});
