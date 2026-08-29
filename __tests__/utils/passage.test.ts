import { Passage } from "../../src/utils/passage";
import { LANGCODE } from "../../src/constants";
import { PassageModel, TranslationModel } from "../../src/models";
import { makeLevelPassage } from "../fixtures/levelPassages";

const THREE_SENTENCES =
  "In the beginning was the Word. And the Word was with God! Was the Word God?";

describe("Passage.getSentences", () => {
  it("keeps the punctuation that ends each sentence", () => {
    expect(Passage.getSentences(THREE_SENTENCES)).toEqual([
      "In the beginning was the Word.",
      "And the Word was with God!",
      "Was the Word God?"
    ]);
  });

  it("joins back into readable text — the old split did not", () => {
    expect(
      Passage.joinSentences(Passage.getSentences(THREE_SENTENCES))
    ).toBe(THREE_SENTENCES);
  });

  it("drops empty pieces, and punctuation alone is not a sentence", () => {
    expect(Passage.getSentences("")).toEqual([]);
    expect(Passage.getSentences("   ")).toEqual([]);
    expect(Passage.getSentences("...")).toEqual([]);
    expect(Passage.getSentences("A.  B.")).toEqual(["A.", "B."]);
  });

  it("counts a passage with no closing punctuation as one sentence", () => {
    expect(Passage.getSentences("no full stop here")).toHaveLength(1);
  });
});

describe("Passage.getRangeText", () => {
  it("returns the sentences the range points at", () => {
    expect(Passage.getRangeText(THREE_SENTENCES, [1, 3])).toBe(
      "And the Word was with God! Was the Word God?"
    );
  });

  it("returns the whole passage with no range, an empty one, or a partial one", () => {
    expect(Passage.getRangeText(THREE_SENTENCES)).toBe(THREE_SENTENCES);
    expect(Passage.getRangeText(THREE_SENTENCES, [])).toBe(THREE_SENTENCES);
    expect(Passage.getRangeText(THREE_SENTENCES, [1])).toBe(THREE_SENTENCES);
  });
});

describe("Passage.getRangeDisplayText", () => {
  it("marks with ... the sides the passage continues on", () => {
    expect(Passage.getRangeDisplayText(THREE_SENTENCES, [1, 2])).toBe(
      "...And the Word was with God!..."
    );
  });

  it("marks neither side when the range is the whole passage", () => {
    expect(Passage.getRangeDisplayText(THREE_SENTENCES, [0, 3])).toBe(
      THREE_SENTENCES
    );
  });

  it("shows everything when there is no range", () => {
    expect(Passage.getRangeDisplayText(THREE_SENTENCES, [])).toBe(
      THREE_SENTENCES
    );
  });
});

describe("Passage.getContextBefore / getContextAfter", () => {
  const FIVE = "One. Two. Three. Four. Five.";

  it("has no context outside a range", () => {
    expect(Passage.getContextBefore(FIVE, [0, 2], 3)).toBeNull();
    expect(Passage.getContextAfter(FIVE, [0, 5], 3)).toBeNull();
    expect(Passage.getContextBefore(FIVE, undefined, 3)).toBeNull();
  });

  it("gives the sentences on each side, untruncated when they all fit", () => {
    expect(Passage.getContextBefore(FIVE, [2, 3], 3)).toEqual({
      text: "One. Two.",
      truncated: false
    });
    expect(Passage.getContextAfter(FIVE, [2, 3], 3)).toEqual({
      text: "Four. Five.",
      truncated: false
    });
  });

  it("says so when it had to leave some out", () => {
    expect(Passage.getContextBefore("A. B. C. D. E. F.", [4, 5], 3)).toEqual({
      text: "B. C. D.",
      truncated: true
    });
  });
});

describe("Passage.getWords", () => {
  it("collapses runs of whitespace, so a word index means one thing", () => {
    expect(Passage.getWords("all  things   work together")).toEqual([
      "all",
      "things",
      "work",
      "together"
    ]);
  });

  it("has no words for empty text", () => {
    expect(Passage.getWords("")).toEqual([]);
    expect(Passage.getWords("  ")).toEqual([]);
  });
});

describe("Passage.getFirstWords", () => {
  it("takes the opening words and keeps the trailing space", () => {
    expect(Passage.getFirstWords("a b c d e f", 3)).toBe("a b c ");
  });
});

describe("Passage.countEnglishVerses", () => {
  const translations = [
    { id: 1, addressLanguage: LANGCODE.en },
    { id: 2, addressLanguage: LANGCODE.ua }
  ] as TranslationModel[];

  it("counts only the verses held in an English translation", () => {
    const passages: PassageModel[] = [
      { ...makeLevelPassage(1), verseTranslation: 1 },
      { ...makeLevelPassage(2), verseTranslation: 2 },
      { ...makeLevelPassage(3), verseTranslation: null }
    ];
    expect(Passage.countEnglishVerses(translations, passages)).toBe(1);
  });
});
