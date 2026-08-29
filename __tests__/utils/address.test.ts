import { LANGCODE } from "../../src/constants";
import { Address } from "../../src/utils/address";

describe("Address.parse", () => {
  it("parsing data", () => {
    const addressObject = Address.parse("Gen 1:2-2:3");
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
    const addressObject = Address.parse("GENESIS 1:2-2:3");
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

  it("prefers the most specific book when several titles are prefixes", () => {
    // "Jud" (Jude, book index 64) is a prefix of "Judges" (book index 6);
    // the longer matched title must win instead of whichever matched first.
    const addressObject = Address.parse("Judges 1:1");
    expect(addressObject).not.toBe(false);
    if (addressObject !== false) {
      expect(addressObject.address.bookIndex).toBe(6);
      expect(addressObject.language).toBe(LANGCODE.en);
    }
  });

  it("leaves end fields null for a single-verse address", () => {
    const addressObject = Address.parse("Gen 1:2");
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

  describe("address anywhere in the text", () => {
    it("finds the reference after a shared quote", () => {
      const addressObject = Address.parse(
        "For God so loved the world John 3:16 ESV"
      );
      expect(addressObject).not.toBe(false);
      if (addressObject !== false) {
        expect(addressObject.address.bookIndex).toBe(42);
        expect(addressObject.addressString).toBe("John 3:16");
      }
    });

    it("finds a Ukrainian reference after the verse text", () => {
      const addressObject = Address.parse("Бо так полюбив Бог Івана 3:16");
      expect(addressObject).not.toBe(false);
      if (addressObject !== false) {
        expect(addressObject.address.bookIndex).toBe(42);
        expect(addressObject.language).toBe(LANGCODE.ua);
      }
    });

    it("prefers the numbered book (1 John over John) mid-text", () => {
      const addressObject = Address.parse("see 1 John 4:8 today");
      expect(addressObject).not.toBe(false);
      if (addressObject !== false) {
        expect(addressObject.address.bookIndex).toBe(61); // 1 John
      }
    });

    it("does not match a book abbreviation inside a longer word", () => {
      // "Gen" inside "regenerate 1:1" must not parse as Genesis.
      const addressObject = Address.parse("regenerate 1:1 please");
      expect(addressObject).toBe(false);
    });
  });

  describe("book-name aliases (8.1.5)", () => {
    // [input, expected bookIndex, expected language]
    const enCases: [string, number][] = [
      ["Gn 1:1", 0], // Genesis
      ["Mt 5:3", 39], // Matthew
      ["Matt 5:3", 39],
      ["Mk 1:1", 40], // Mark
      ["Lk 2:1", 41], // Luke
      ["Jn 3:16", 42], // John
      ["Rm 8:1", 44], // Romans
      ["Jas 1:1", 58], // James
      ["Rv 22:21", 65], // Revelation
      ["Revelations 22:21", 65]
    ];
    enCases.forEach(([input, bookIndex]) => {
      it(`parses the English alias "${input}"`, () => {
        const addressObject = Address.parse(input);
        expect(addressObject).not.toBe(false);
        if (addressObject !== false) {
          expect(addressObject.address.bookIndex).toBe(bookIndex);
          expect(addressObject.language).toBe(LANGCODE.en);
        }
      });
    });

    const uaCases: [string, number][] = [
      ["Іоана 3:16", 42], // John — Івана / Іоана
      ["Йоана 3:16", 42],
      ["Судді 1:1", 6], // Judges — correct spelling vs the app's typo'd title
      ["Псалми 23:1", 18] // Psalms
    ];
    uaCases.forEach(([input, bookIndex]) => {
      it(`parses the Ukrainian alias "${input}"`, () => {
        const addressObject = Address.parse(input);
        expect(addressObject).not.toBe(false);
        if (addressObject !== false) {
          expect(addressObject.address.bookIndex).toBe(bookIndex);
          expect(addressObject.language).toBe(LANGCODE.ua);
        }
      });
    });

    it("prefers a longer canonical title over a shorter alias of another book", () => {
      // "Psalms" (alias, Ps=18) must not lose to any shorter prefix match.
      const addressObject = Address.parse("Psalms 23:1");
      expect(addressObject).not.toBe(false);
      if (addressObject !== false) {
        expect(addressObject.address.bookIndex).toBe(18);
        expect(addressObject.addressString).toBe("Psalms 23:1");
      }
    });
  });
});

describe("Address.versesCount", () => {
  it("counts verses across a chapter boundary", () => {
    expect(
      Address.versesCount({
        bookIndex: 0,
        startChapterNum: 0,
        endChapterNum: 1,
        startVerseNum: 1,
        endVerseNum: 2
      })
    ).toBe(33);
  });

  it("counts an open-ended address as one verse", () => {
    expect(
      Address.versesCount({
        bookIndex: 42,
        startChapterNum: 2,
        startVerseNum: 15,
        endChapterNum: null,
        endVerseNum: null
      })
    ).toBe(1);
  });
});

describe("Address.equals (8.2.6)", () => {
  const john316 = {
    bookIndex: 42,
    startChapterNum: 2,
    startVerseNum: 15,
    endChapterNum: null,
    endVerseNum: null
  };

  it("treats an open end as ending where it starts", () => {
    expect(
      Address.equals(john316, {
        ...john316,
        endChapterNum: 2,
        endVerseNum: 15
      })
    ).toBe(true);
  });

  it("tells different verses apart", () => {
    expect(Address.equals(john316, { ...john316, startVerseNum: 16 })).toBe(
      false
    );
  });

  it("does not touch the addresses it compares", () => {
    // the old getAddressDifference filled the open end by ASSIGNING to its
    // arguments, i.e. it edited passage addresses inside app state
    const a = { ...john316 };
    const b = { ...john316 };
    Address.equals(a, b);
    expect(a.endChapterNum).toBeNull();
    expect(b.endVerseNum).toBeNull();
  });
});

describe("Address.order and Address.distance", () => {
  const genesis = {
    bookIndex: 0,
    startChapterNum: 0,
    startVerseNum: 0,
    endChapterNum: null,
    endVerseNum: null
  };
  const john = { ...genesis, bookIndex: 42, startChapterNum: 2 };

  it("orders by book, then chapter, then verse", () => {
    expect(Address.order(genesis)).toBeLessThan(Address.order(john));
    expect(Address.order({ ...genesis, startVerseNum: 3 })).toBeGreaterThan(
      Address.order(genesis)
    );
  });

  it("is zero apart from itself", () => {
    expect(Address.distance(john, john)).toBe(0);
    expect(Address.distance(genesis, john)).toBeGreaterThan(0);
  });
});
