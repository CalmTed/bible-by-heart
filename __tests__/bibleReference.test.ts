import { bibleReference } from "../src/bibleReference";

// The KJV numbering is a published fact, so the whole table can be held to its
// three totals rather than to a copy of itself.
const KJV_BOOKS = 66;
const KJV_CHAPTERS = 1189;
const KJV_VERSES = 31102;

const chaptersOf = (bookIndex: number) => bibleReference[bookIndex].chapters;

describe("the shipped KJV table", () => {
  it("has every book, chapter and verse the KJV has", () => {
    expect(bibleReference).toHaveLength(KJV_BOOKS);
    expect(
      bibleReference.reduce((total, book) => total + book.chapters.length, 0)
    ).toBe(KJV_CHAPTERS);
    expect(
      bibleReference.reduce(
        (total, book) => total + book.chapters.reduce((sum, n) => sum + n, 0),
        0
      )
    ).toBe(KJV_VERSES);
  });

  it("gives every chapter at least one verse", () => {
    const empty = bibleReference.flatMap((book, bookIndex) =>
      book.chapters
        .map((verses, chapterIndex) => ({ verses, chapterIndex }))
        .filter((chapter) => chapter.verses < 1)
        .map((chapter) => `${book.longTitle} ${chapter.chapterIndex + 1}`)
    );
    expect(empty).toEqual([]);
  });

  it.each([
    ["Genesis", 0, 50, 44, 34],
    ["Exodus", 1, 40, 40, 38],
    ["Esther", 16, 10, 10, 3],
    ["Psalms", 18, 150, 119, 176],
    ["Zechariah", 37, 14, 14, 21],
    ["John", 42, 21, 3, 36],
    ["Acts", 43, 28, 28, 31],
  ])(
    "ends %s at chapter %i and gives its chapter %i all %i verses",
    (_book, bookIndex, chapters, chapter, verses) => {
      // the books the hand-typed table used to get wrong - Genesis lost chapter
      // 44 entirely, Exodus carried five chapters it does not have, and John
      // simply stopped at 17, so those four could not be addressed at all
      expect(chaptersOf(bookIndex)).toHaveLength(chapters);
      expect(chaptersOf(bookIndex)[chapter - 1]).toBe(verses);
    }
  );

  it("keeps no second table of its own", () => {
    // a translation numbers its own chapters now, so the one alternative psalm
    // split that used to live here has nowhere left to hide
    for (const book of bibleReference) {
      expect(Object.keys(book)).toEqual(["titleShort", "longTitle", "chapters"]);
    }
  });
});
