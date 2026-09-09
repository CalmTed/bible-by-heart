import { LANGCODE } from "../src/constants";

// `createAppState` reads the phone's locale once, at call time, so the mock has
// to be in place before the module is imported - hence the isolated require
// rather than a top-level import.
const mockLanguageCode = jest.fn<string | null, []>();
jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: mockLanguageCode() }]
}));

const langCodeFor = (phoneLanguage: string | null): LANGCODE => {
  mockLanguageCode.mockReturnValue(phoneLanguage);
  let langCode = LANGCODE.en;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createAppState } = require("../src/initials");
    langCode = createAppState().settings.langCode;
  });
  return langCode;
};

describe("the language a fresh install opens in", () => {
  it("opens a Ukrainian phone in Ukrainian", () => {
    expect(langCodeFor("uk")).toBe(LANGCODE.ua);
  });

  it("opens a Russian phone in Ukrainian, not in English", () => {
    // there is no Russian interface and there deliberately never will be -
    // `LANGCODE` is what builds the interface picker - but Ukrainian serves a
    // Russian speaker far better than English does
    expect(langCodeFor("ru")).toBe(LANGCODE.ua);
  });

  it("opens everything else in English", () => {
    expect(langCodeFor("en")).toBe(LANGCODE.en);
    expect(langCodeFor("de")).toBe(LANGCODE.en);
    expect(langCodeFor("pl")).toBe(LANGCODE.en);
  });

  it("opens in English when the phone names no language at all", () => {
    expect(langCodeFor(null)).toBe(LANGCODE.en);
  });
});
