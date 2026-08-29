import { bibleReference } from "../../src/bibleReference";
import { LANGCODE } from "../../src/constants";
import { createT, WORD } from "../../src/l10n";
import { Address } from "../../src/utils/address";
import { bookAliases } from "../../src/utils/bookAliases";

// The book-name table, on the device. Every spelling in it has to do the one
// thing it exists for: turn a reference someone shared or typed into an
// address, with no network involved. So there is a case per spelling, generated
// from the table itself - adding an alias without a test is not possible here,
// and neither is keeping one that does not work.

const bookIndexOf: (longTitle: string) => number = (longTitle) =>
  bibleReference.findIndex((book) => book.longTitle === longTitle);

type AliasCaseModel = [string, string, LANGCODE, number];

const aliasCases: AliasCaseModel[] = Object.entries(bookAliases).flatMap(
  ([longTitle, byLanguage]) =>
    Object.entries(byLanguage ?? {}).flatMap(([language, aliases]) =>
      (aliases ?? []).map(
        (alias): AliasCaseModel => [
          longTitle,
          alias,
          language as LANGCODE,
          bookIndexOf(longTitle)
        ]
      )
    )
);

// Every spelling the parser can be handed: the app's own two titles per language
// plus everything in the table. Keyed by language, because "Ne" naming Nehemiah
// in English says nothing about what it may name in Ukrainian.
const everySpelling: () => Map<string, Set<string>> = () => {
  const owners = new Map<string, Set<string>>();
  const claim = (language: LANGCODE, spelling: string, longTitle: string) => {
    const key = `${language}:${spelling.trim().toLowerCase()}`;
    const owner = owners.get(key) ?? new Set<string>();
    owner.add(longTitle);
    owners.set(key, owner);
  };
  Object.values(LANGCODE).forEach((language) => {
    const t = createT(language);
    bibleReference.forEach((book) => {
      claim(language, t(book.longTitle), book.longTitle);
      claim(language, t(book.titleShort), book.longTitle);
      (bookAliases[book.longTitle]?.[language] ?? []).forEach((alias) =>
        claim(language, alias, book.longTitle)
      );
    });
  });
  return owners;
};

describe("bookAliases", () => {
  it("has an alias table that is not empty and covers both languages", () => {
    expect(aliasCases.length).toBeGreaterThan(200);
    expect(aliasCases.some(([, , language]) => language === LANGCODE.en)).toBe(
      true
    );
    expect(aliasCases.some(([, , language]) => language === LANGCODE.ua)).toBe(
      true
    );
  });

  it("keys every entry by a book the app actually ships", () => {
    aliasCases.forEach(([longTitle, , , bookIndex]) => {
      expect(bookIndex).toBeGreaterThanOrEqual(0);
      expect(bibleReference[bookIndex].longTitle).toBe(longTitle as WORD);
    });
  });

  it("never lets one spelling name two different books", () => {
    const ambiguous = [...everySpelling().entries()]
      .filter(([, books]) => books.size > 1)
      .map(([spelling, books]) => `${spelling} -> ${[...books].join(", ")}`);
    expect(ambiguous).toEqual([]);
  });

  it("never repeats a title the app already ships", () => {
    Object.values(LANGCODE).forEach((language) => {
      const t = createT(language);
      bibleReference.forEach((book) => {
        const own = [t(book.longTitle), t(book.titleShort)].map((title) =>
          title.toLowerCase()
        );
        (bookAliases[book.longTitle]?.[language] ?? []).forEach((alias) => {
          expect(own).not.toContain(alias.toLowerCase());
        });
      });
    });
  });

  //one case per spelling in the table
  it.each(aliasCases)(
    "%s: '%s' (%s) resolves to book %d",
    (_longTitle, alias, _language, bookIndex) => {
      const parsed = Address.parse(`${alias} 1:1`);
      expect(parsed).not.toBe(false);
      if (parsed === false) {
        return;
      }
      expect(parsed.address.bookIndex).toBe(bookIndex);
      expect(parsed.address.startChapterNum).toBe(0);
      expect(parsed.address.startVerseNum).toBe(0);
    }
  );

  it("still resolves an alias sitting after a shared quote", () => {
    const parsed = Address.parse(
      "«Бо так полюбив Бог світ...» Євангелія від Йоана 3:16"
    );
    expect(parsed).not.toBe(false);
    if (parsed === false) {
      return;
    }
    expect(parsed.address.bookIndex).toBe(bookIndexOf("bJohnLong"));
    expect(parsed.address.startChapterNum).toBe(2);
    expect(parsed.address.startVerseNum).toBe(15);
  });

  it("prefers the longest spelling when one alias sits inside another", () => {
    //"1-е Івана" contains "Івана", the app's own title for the gospel
    const parsed = Address.parse("1-е Івана 1:9");
    expect(parsed).not.toBe(false);
    if (parsed === false) {
      return;
    }
    expect(parsed.address.bookIndex).toBe(bookIndexOf("b1JnLong"));
  });
});
