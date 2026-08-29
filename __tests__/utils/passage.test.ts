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

/**
 * L3's word bank answers by the letters of a word, not by its exact characters:
 * "good." and "good" are the same word to read and to type, so tapping either
 * has to answer either.
 */
describe("Passage.sameWord", () => {
  it("ignores the punctuation hanging off a word", () => {
    expect(Passage.sameWord("good.", "good")).toBe(true);
    expect(Passage.sameWord("good,", "good.")).toBe(true);
    expect(Passage.sameWord('"good"', "good!")).toBe(true);
    expect(Passage.sameWord("(good)", "good")).toBe(true);
  });

  it("ignores case, in both alphabets", () => {
    expect(Passage.sameWord("Good", "good")).toBe(true);
    expect(Passage.sameWord("Даниїла", "даниїла")).toBe(true);
  });

  it("is equality of letters, not similarity — a misspelling is still wrong", () => {
    expect(Passage.sameWord("good", "god")).toBe(false);
    expect(Passage.sameWord("things", "thing")).toBe(false);
    expect(Passage.sameWord("Даниїла", "Даниила")).toBe(false);
  });

  it("keeps digits, which is what a verse number is made of", () => {
    expect(Passage.sameWord("123", "123")).toBe(true);
    expect(Passage.sameWord("123", "124")).toBe(false);
  });

  it("never calls two pieces of pure punctuation the same word", () => {
    expect(Passage.sameWord("-", "...")).toBe(false);
    expect(Passage.sameWord("...", "...")).toBe(false);
    expect(Passage.sameWord("", "")).toBe(false);
  });
});

// A code point by number, so nothing in this file is an invisible byte and a
// Cyrillic "a" can never be mistaken for a Latin one while reading it.
const chr = (code: number) => String.fromCharCode(code);

describe("Passage.typedEquals — the L5 tolerance", () => {
  // [what the stored passage may carry, what the phone keyboard produces].
  // One test per pair: a passage holding the left character must be answerable
  // by typing the right one, or that passage is unlearnable at level 5.
  const PAIRS: [name: string, stored: string, typed: string][] = [
    ["hyphen U+2010", chr(0x2010), "-"],
    ["non-breaking hyphen U+2011", chr(0x2011), "-"],
    ["figure dash U+2012", chr(0x2012), "-"],
    ["en dash U+2013", chr(0x2013), "-"],
    ["em dash U+2014", chr(0x2014), "-"],
    ["horizontal bar U+2015", chr(0x2015), "-"],
    ["minus sign U+2212", chr(0x2212), "-"],
    ["left curly double quote U+201C", chr(0x201c), '"'],
    ["right curly double quote U+201D", chr(0x201d), '"'],
    ["low double quote U+201E", chr(0x201e), '"'],
    ["high-reversed double quote U+201F", chr(0x201f), '"'],
    ["opening guillemet U+00AB", chr(0x00ab), '"'],
    ["closing guillemet U+00BB", chr(0x00bb), '"'],
    ["double prime U+2033", chr(0x2033), '"'],
    ["left curly single quote U+2018", chr(0x2018), "'"],
    ["right curly single quote U+2019", chr(0x2019), "'"],
    ["low single quote U+201A", chr(0x201a), "'"],
    ["high-reversed single quote U+201B", chr(0x201b), "'"],
    ["prime U+2032", chr(0x2032), "'"],
    ["acute accent U+00B4", chr(0x00b4), "'"],
    ["backtick U+0060", chr(0x0060), "'"],
    ["no-break space U+00A0", chr(0x00a0), " "],
    ["narrow no-break space U+202F", chr(0x202f), " "],
    ["thin space U+2009", chr(0x2009), " "],
    ["figure space U+2007", chr(0x2007), " "],
    ["tab U+0009", chr(0x0009), " "],
    ["Cyrillic a U+0430", chr(0x0430), "a"],
    ["Cyrillic A U+0410", chr(0x0410), "A"],
    ["Cyrillic es U+0441", chr(0x0441), "c"],
    ["Cyrillic Es U+0421", chr(0x0421), "C"],
    ["Cyrillic ie U+0435", chr(0x0435), "e"],
    ["Cyrillic Ie U+0415", chr(0x0415), "E"],
    ["Ukrainian i U+0456", chr(0x0456), "i"],
    ["Ukrainian I U+0406", chr(0x0406), "I"],
    ["Cyrillic o U+043E", chr(0x043e), "o"],
    ["Cyrillic O U+041E", chr(0x041e), "O"],
    ["Cyrillic er U+0440", chr(0x0440), "p"],
    ["Cyrillic Er U+0420", chr(0x0420), "P"],
    ["Cyrillic ha U+0445", chr(0x0445), "x"],
    ["Cyrillic Ha U+0425", chr(0x0425), "X"],
    ["Cyrillic u U+0443", chr(0x0443), "y"],
    ["Cyrillic U U+0423", chr(0x0423), "Y"]
  ];

  it.each(PAIRS)("forgives %s", (_name, stored, typed) => {
    expect(Passage.typedEquals(`one${typed}two`, `one${stored}two`)).toBe(true);
    // and the other way round: the OCR damage in the bundled translations put
    // Latin letters inside Cyrillic words, so the stored side is the typeable
    // one and the user types the lookalike
    expect(Passage.typedEquals(`one${stored}two`, `one${typed}two`)).toBe(true);
  });

  it("forgives the ellipsis, which three dots cannot spell as one character", () => {
    expect(
      Passage.typedEquals("He said... and left", `He said${chr(0x2026)} and left`)
    ).toBe(true);
  });

  it("forgives a decomposed letter written as base + combining mark", () => {
    // Ukrainian "yi" (U+0457) is also reachable as "i" (U+0456) + a combining
    // diaeresis, and no keyboard offers the choice between the two
    const precomposed = chr(0x0457);
    const decomposed = chr(0x0456) + chr(0x0308);
    expect(Passage.typedEquals(decomposed, precomposed)).toBe(true);
    expect(Passage.typedEquals(precomposed, decomposed)).toBe(true);
  });

  it("does not ask the user to reproduce whitespace or a line break", () => {
    expect(Passage.typedEquals("one two", "one\ntwo")).toBe(true);
    expect(Passage.typedEquals("one two", "one   two")).toBe(true);
    expect(Passage.typedEquals(" one two ", "one two")).toBe(true);
  });

  it("still ignores the punctuation level 5 has never graded", () => {
    expect(Passage.typedEquals("In the beginning", "In the beginning,")).toBe(
      true
    );
    expect(Passage.typedEquals("God said: let", "God said, let")).toBe(true);
  });

  it("is not widened to real misspellings", () => {
    expect(Passage.typedEquals("in the begining", "in the beginning")).toBe(
      false
    );
    expect(Passage.typedEquals("word", "words")).toBe(false);
  });

  it("never folds two different Ukrainian letters onto each other", () => {
    // i / yi and i / y are separate letters, and telling them apart is exactly
    // what learning Ukrainian scripture by heart means
    expect(Passage.typedEquals(chr(0x0456), chr(0x0457))).toBe(false);
    expect(Passage.typedEquals(chr(0x0456), chr(0x0438))).toBe(false);
    // a Cyrillic "te" is not a Latin "t": its lowercase looks like nothing
    // Latin, so it is deliberately absent from the table
    expect(Passage.typedEquals("t", chr(0x0442))).toBe(false);
  });
});

describe("Passage.foldTypeable / typedPrefixLength", () => {
  it("keeps the string the same length, which the prefix repair depends on", () => {
    const source = `a${chr(0x2014)}b${chr(0x2019)}c${chr(0x00a0)}d${chr(0x0430)}`;
    expect(Passage.foldTypeable(source)).toHaveLength(source.length);
    expect(Passage.foldTypeable(source)).toBe("a-b'c da");
  });

  it("leaves a character it has no opinion about alone", () => {
    expect(Passage.foldTypeable("Book 3:16")).toBe("Book 3:16");
    // Cyrillic zhe / te / ve are absent from the table, so they stay themselves
    const untouched = chr(0x0436) + chr(0x0442) + chr(0x0432);
    expect(Passage.foldTypeable(untouched)).toBe(untouched);
  });

  it("counts a lookalike as typed right rather than throwing the rest away", () => {
    const stored = `God${chr(0x2019)}s word`;
    // the curly apostrophe used to end the match at index 3
    expect(Passage.typedPrefixLength("God's word", stored)).toBe(stored.length);
  });

  it("ignores case, so a capital does not cost the user their answer", () => {
    expect(Passage.typedPrefixLength("in the", "In the")).toBe(6);
  });

  it("stops at the first character that is genuinely different", () => {
    expect(Passage.typedPrefixLength("In the bxginning", "In the beginning")).toBe(
      8
    );
    expect(Passage.typedPrefixLength("", "In the beginning")).toBe(0);
    expect(Passage.typedPrefixLength("Xn", "In the beginning")).toBe(0);
  });
});
