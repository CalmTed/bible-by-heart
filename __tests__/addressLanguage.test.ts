import { bibleReference } from "../src/bibleReference";
import { ADDRESS_LANGS, LANGCODE } from "../src/constants";
import {
  createAddressT,
  getAddressLangName,
  getBookSpellings
} from "../src/addressLanguage";
import { Address } from "../src/utils/address";

// The language an address is written in is not the language the app is in. The
// Синодальний names its books in Russian whatever the interface says, and
// Russian is deliberately NOT an interface language - so these hold the two
// apart.

describe("the languages an address may be written in", () => {
  it("is a superset of the interface languages", () => {
    Object.values(LANGCODE).forEach((language) => {
      expect(ADDRESS_LANGS).toContain(language);
    });
    expect(ADDRESS_LANGS).toContain("ru");
    expect(ADDRESS_LANGS.length).toBe(Object.values(LANGCODE).length + 1);
  });

  it("names each of them in itself, so a picker can offer them", () => {
    ADDRESS_LANGS.forEach((language) => {
      expect(getAddressLangName(language).length).toBeGreaterThan(1);
    });
    expect(getAddressLangName(LANGCODE.en)).toContain("English");
    expect(getAddressLangName("ru")).toContain("Русский");
  });
});

describe("book titles in a language the interface does not speak", () => {
  const ruT = createAddressT("ru");

  it("has a Russian long title for every one of the 66 books", () => {
    const missing = bibleReference
      .filter((book) => ruT(book.longTitle) === createAddressT(LANGCODE.en)(book.longTitle))
      .map((book) => book.longTitle);
    expect(missing).toEqual([]);
  });

  it("formats an address with them", () => {
    expect(
      Address.format(
        {
          bookIndex: 42,
          startChapterNum: 2,
          startVerseNum: 15,
          endChapterNum: null,
          endVerseNum: null
        },
        ruT
      )
    ).toBe("Иоанна 3:16");
  });

  it("reads one back, and says which language it was in", () => {
    const parsed = Address.parse("Иоанна 3:16");
    expect(parsed).not.toBe(false);
    if (parsed !== false) {
      expect(parsed.address.bookIndex).toBe(42);
      expect(parsed.address.startVerseNum).toBe(15);
      expect(parsed.language).toBe("ru");
    }
  });

  it("still reads the interface languages it always did", () => {
    const en = Address.parse("John 3:16");
    const ua = Address.parse("Івана 3:16");
    expect(en !== false && en.language).toBe(LANGCODE.en);
    expect(ua !== false && ua.language).toBe(LANGCODE.ua);
  });
});

describe("a spelling names one book, whatever language it is read in", () => {
  // The per-language version of this rule lives with the alias table. This is
  // the cross-language one, and it is what caught the Синодальний's "1 Цар":
  // its abbreviation for 1 Samuel is already the app's Ukrainian short title
  // for 1 Kings, because the two number the four books differently.
  const owners = new Map<string, Set<string>>();
  ADDRESS_LANGS.forEach((language) =>
    bibleReference.forEach((book) =>
      getBookSpellings(book, language).forEach((spelling) => {
        const key = spelling.trim().toLowerCase();
        const owner = owners.get(key) ?? new Set<string>();
        owner.add(book.longTitle);
        owners.set(key, owner);
      })
    )
  );

  it("lets no spelling name two different books", () => {
    const clashes = [...owners.entries()]
      .filter(([, books]) => books.size > 1)
      .map(([spelling, books]) => `${spelling}: ${[...books].join(", ")}`);
    expect(clashes).toEqual([]);
  });

  const bookNamed = (longTitle: string) =>
    bibleReference[bibleReference.findIndex((b) => b.longTitle === longTitle)];

  it("keeps the app's own title and drops the foreign abbreviation", () => {
    expect(getBookSpellings(bookNamed("b1KinLong"), LANGCODE.ua)).toContain(
      "1 Цар"
    );
    expect(getBookSpellings(bookNamed("b1SamLong"), "ru")).not.toContain(
      "1 Цар"
    );
    // the long title is still there, so 1 Samuel is reachable in Russian
    expect(getBookSpellings(bookNamed("b1SamLong"), "ru")).toContain(
      "1 Царств"
    );
  });

  it("borrows no English spelling for a book Russian does not name", () => {
    // an English abbreviation registered as a Russian one would answer an
    // English share with a Russian language, and hand it the wrong translation
    expect(getBookSpellings(bookNamed("b1SamLong"), "ru")).not.toContain(
      "1 Sam"
    );
  });
});
