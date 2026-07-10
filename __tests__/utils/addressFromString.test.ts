import { LANGCODE } from "../../src/constants";
import addressFromString from "../../src/utils/addressFromString";

describe("address from string", () => {
  it("parsing data", () => {
    const addressObject = addressFromString("Gen 1:2-2:3");
    expect(addressObject).not.toBe(false);
    if (addressObject !== false) {
      expect(addressObject.language).toBe(LANGCODE.en);
      expect(addressObject.address).toMatchObject({
        bookIndex: 0,
        startChapterNum: 0,
        endChapterNum: 1,
        startVerseNum: 1,
        endVerseNum: 2
      });
    }
  });

  it("parses upper-cased book titles (case-insensitive)", () => {
    const addressObject = addressFromString("GENESIS 1:2-2:3");
    expect(addressObject).not.toBe(false);
    if (addressObject !== false) {
      expect(addressObject.language).toBe(LANGCODE.en);
      expect(addressObject.address).toMatchObject({
        bookIndex: 0,
        startChapterNum: 0,
        endChapterNum: 1,
        startVerseNum: 1,
        endVerseNum: 2
      });
    }
  });

  it("leaves end fields null for a single-verse address", () => {
    const addressObject = addressFromString("Gen 1:2");
    expect(addressObject).not.toBe(false);
    if (addressObject !== false) {
      expect(addressObject.address).toMatchObject({
        bookIndex: 0,
        startChapterNum: 0,
        startVerseNum: 1,
        endChapterNum: null,
        endVerseNum: null
      });
    }
  });
});
