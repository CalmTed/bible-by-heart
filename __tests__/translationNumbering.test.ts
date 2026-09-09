import { bibleReference } from "../src/bibleReference";
import { BUNDLED_TRANSLATION_SOURCES } from "../src/constants";
import {
  getChapterNumbers,
  getChapterVerses,
  getTranslationNumbering,
  SHIPPED_TRANSLATION_NUMBERING
} from "../src/translationNumbering";

const CHR2 = 13;
const PS = 18;
const JER = 23;
const JOEL = 28;
const MAL = 38;
const DAN = 26;
const ESTH = 16;

const numbering = (sourceId: string) => SHIPPED_TRANSLATION_NUMBERING[sourceId];

describe("what ships with the app", () => {
  it("numbers every bundled translation the app can offer offline", () => {
    const offline = BUNDLED_TRANSLATION_SOURCES.filter(
      (source) => !source.isRemote
    ).map((source) => source.sourceId);
    for (const sourceId of offline) {
      expect(`${sourceId} ${typeof numbering(sourceId)}`).toBe(
        `${sourceId} object`
      );
    }
  });

  it("leaves the proxied source to the KJV table", () => {
    // ESV stores no text at the API to count, and its numbering is the KJV one
    expect(numbering("esv")).toBeUndefined();
  });

  it.each(Object.keys(SHIPPED_TRANSLATION_NUMBERING))(
    "%s covers all 66 books, every chapter with a verse in it",
    (sourceId) => {
      const { chapters } = numbering(sourceId);
      expect(chapters).toHaveLength(bibleReference.length);
      const empty = chapters.flatMap((book, bookIndex) =>
        book
          .map((verses, chapterIndex) => ({ verses, chapterIndex }))
          .filter((chapter) => chapter.verses < 1)
          .map(
            (chapter) =>
              `${bibleReference[bookIndex].longTitle} ${chapter.chapterIndex + 1}`
          )
      );
      expect(empty).toEqual([]);
    }
  );

  it.each([
    // chapters, as the file the API serves counts them; every one of those files
    // carries the 66 canonical books and nothing else, so ukr-ogi is the only
    // one that differs and it is Joel's fourth chapter that does it
    ["ukr-turk", 1189],
    ["ukr-hom", 1189],
    ["ukr-kul", 1189],
    ["ukr-ogi", 1190],
    ["rus-syn", 1189]
  ])("%s has the %i chapters its file has", (sourceId, chapters) => {
    expect(
      numbering(sourceId).chapters.reduce((total, book) => total + book.length, 0)
    ).toBe(chapters);
  });

  it.each(Object.keys(SHIPPED_TRANSLATION_NUMBERING))(
    "%s numbers no chapter standing outside the canon",
    (sourceId) => {
      const { chapters } = numbering(sourceId);
      // Ps 151, Esther 11, Daniel 13-14 and the Prayer of Manasseh that ukr-turk
      // carried as 2 Chronicles 37 are gone from the files themselves, so there
      // is nothing here to leave out
      expect(`${sourceId} Ps ${chapters[PS].length}`).toBe(`${sourceId} Ps 150`);
      expect(`${sourceId} Esth ${chapters[ESTH].length}`).toBe(
        `${sourceId} Esth 10`
      );
      expect(`${sourceId} Dan ${chapters[DAN].length}`).toBe(
        `${sourceId} Dan 12`
      );
      expect(`${sourceId} 2Chr ${chapters[CHR2].length}`).toBe(
        `${sourceId} 2Chr 36`
      );
    }
  );
});

describe("a translation numbers its own chapters", () => {
  it("splits Joel into as many chapters as its own file does", () => {
    expect(numbering("ukr-kul").chapters[JOEL]).toHaveLength(3);
    expect(numbering("rus-syn").chapters[JOEL]).toHaveLength(3);
    expect(numbering("ukr-ogi").chapters[JOEL]).toHaveLength(4);
  });

  it("ends Malachi where its own file ends it", () => {
    expect(numbering("ukr-ogi").chapters[MAL]).toHaveLength(4);
    expect(numbering("ukr-turk").chapters[MAL]).toHaveLength(3);
  });

  it("keeps ukr-turk's Greek ordering of Jeremiah", () => {
    expect(numbering("ukr-turk").chapters[JER][28]).toBe(7);
    expect(numbering("ukr-ogi").chapters[JER][28]).toBe(32);
  });

  it("disagrees with the KJV table, which is the reason it exists", () => {
    // Daniel 3 runs to 100 verses in the Синодальний where the KJV has 30 -
    // that chapter in that translation, not an error to be trimmed
    expect(bibleReference[DAN].chapters[2]).toBe(30);
    expect(numbering("rus-syn").chapters[DAN][2]).toBe(100);
  });
});

describe("what an address is allowed to name", () => {
  it("answers with the KJV table when no translation can", () => {
    // a translation the user typed themselves, ESV, nothing chosen yet
    const kjv = getTranslationNumbering(null);
    expect(kjv.chapters.map((book) => book.length)).toEqual(
      bibleReference.map((book) => book.chapters.length)
    );
    expect(getTranslationNumbering("esv")).toBe(kjv);
    expect(getTranslationNumbering(undefined)).toBe(kjv);
  });

  it("offers every chapter the translation has, because they are all canonical", () => {
    expect(getChapterNumbers(numbering("ukr-turk"), PS)).toHaveLength(150);
    expect(getChapterNumbers(numbering("rus-syn"), DAN)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ]);
  });

  it("numbers the chapters it offers, rather than counting them", () => {
    // an offered chapter carries its own number, so a translation that has one
    // chapter more than another could never renumber the ones after it
    expect(getChapterNumbers(numbering("ukr-ogi"), JOEL)).toEqual([0, 1, 2, 3]);
  });

  it("gives a chapter the translation does not have no verses at all", () => {
    // one answer for both sides: no verse button, and a reference that fails
    expect(getChapterVerses(numbering("ukr-turk"), PS, 150)).toBe(0);
    expect(getChapterVerses(numbering("ukr-turk"), PS, 149)).toBe(6);
    expect(getChapterVerses(numbering("rus-syn"), DAN, 12)).toBe(0);
    // ukr-turk stops Malachi at 3, so the chapter ukr-ogi has is not there
    expect(getChapterVerses(numbering("ukr-turk"), MAL, 3)).toBe(0);
    expect(getChapterVerses(numbering("ukr-ogi"), MAL, 3)).toBe(6);
  });

  it("keeps every verse of a chapter the translation does have", () => {
    // Daniel 3 runs to 100 verses in the Синодальний - that chapter in that
    // translation, not an error to be trimmed
    expect(getChapterVerses(numbering("rus-syn"), DAN, 2)).toBe(100);
  });

  it("has nothing to say about a book or chapter that does not exist", () => {
    expect(getChapterNumbers(numbering("ukr-ogi"), NaN)).toEqual([]);
    expect(getChapterVerses(numbering("ukr-ogi"), 0, 99)).toBe(0);
  });
});
