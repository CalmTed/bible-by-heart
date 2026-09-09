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

  describe("the dot an abbreviation is written with", () => {
    it("parses an English abbreviation written with its dot", () => {
      const addressObject = Address.parse("Jn. 3:16");
      expect(addressObject).not.toBe(false);
      if (addressObject === false) {
        return;
      }
      expect(addressObject.address.bookIndex).toBe(42);
      expect(addressObject.address.startChapterNum).toBe(2);
      expect(addressObject.address.startVerseNum).toBe(15);
    });

    it("parses a Ukrainian abbreviation written with its dot", () => {
      const addressObject = Address.parse("Ів. 3:16");
      expect(addressObject).not.toBe(false);
      if (addressObject === false) {
        return;
      }
      expect(addressObject.address.bookIndex).toBe(42);
      expect(addressObject.address.startChapterNum).toBe(2);
      expect(addressObject.address.startVerseNum).toBe(15);
    });

    it("takes the dot with it when the reference is cut out", () => {
      const addressObject = Address.parse('Ів. 3:16 - "God so loved"');
      expect(addressObject).not.toBe(false);
      if (addressObject === false) {
        return;
      }
      expect(addressObject.addressString).toBe("Ів. 3:16");
    });
  });

  describe("book-name aliases", () => {
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

describe("Address.parse against a translation numbering", () => {
  it("takes a chapter the translation has and the KJV table does not", () => {
    // Огієнко splits Joel into four chapters where the KJV table stops at three
    expect(Address.parse("Joel 4:1")).toBe(false);
    const addressObject = Address.parse("Joel 4:1", "ukr-ogi");
    expect(addressObject).not.toBe(false);
    if (addressObject !== false) {
      expect(addressObject.address.startChapterNum).toBe(3);
    }
  });

  it("refuses a chapter no translation has any more", () => {
    // Турконяк used to carry Ps 151 and Синодальний Daniel 13-14; they left the
    // files with the rest of the deuterocanon, so there is nothing to reach
    expect(Address.parse("Ps 151:1", "ukr-turk")).toBe(false);
    expect(Address.parse("Dan 13:1", "rus-syn")).toBe(false);
  });

  it("still reads a verse inside a chapter the KJV table numbers shorter", () => {
    // Daniel 3 runs to 100 verses in the Синодальний; verses inside a chapter
    // are never filtered, whatever the KJV table says about it
    expect(Address.parse("Dan 3:100")).toBe(false);
    expect(Address.parse("Dan 3:100", "rus-syn")).not.toBe(false);
  });
});

describe("Address.versesCount", () => {
  // Genesis 31 ends at verse 55 in the KJV table and at 54 in three of the
  // bundled translations, so a span that crosses into chapter 32 is a different
  // number of verses depending on who is counting
  const gen31to32 = {
    bookIndex: 0,
    startChapterNum: 30,
    startVerseNum: 0,
    endChapterNum: 31,
    endVerseNum: 1
  };

  it("counts verses across a chapter boundary", () => {
    expect(
      Address.versesCount(
        {
          bookIndex: 0,
          startChapterNum: 0,
          endChapterNum: 1,
          startVerseNum: 1,
          endVerseNum: 2
        },
        null
      )
    ).toBe(33);
  });

  it("counts an open-ended address as one verse", () => {
    expect(
      Address.versesCount(
        {
          bookIndex: 42,
          startChapterNum: 2,
          startVerseNum: 15,
          endChapterNum: null,
          endVerseNum: null
        },
        null
      )
    ).toBe(1);
  });

  it("counts a span in the numbering of the translation it is written in", () => {
    expect(Address.versesCount(gen31to32, "ukr-turk")).toBe(56);
    expect(Address.versesCount(gen31to32, "rus-syn")).toBe(57);
  });

  it("falls back to the KJV table when no translation is named", () => {
    // a translation the user typed themselves, ESV, nothing chosen yet
    expect(Address.versesCount(gen31to32, null)).toBe(57);
    expect(Address.versesCount(gen31to32, undefined)).toBe(57);
    expect(Address.versesCount(gen31to32, "esv")).toBe(57);
  });

  it("ends a book where the translation ends it, not where the KJV does", () => {
    // ukr-turk folds Malachi into three chapters the Hebrew way, so its third
    // chapter is the long one and ukr-ogi's is the short one
    const mal3to4 = {
      bookIndex: 38,
      startChapterNum: 2,
      startVerseNum: 0,
      endChapterNum: 3,
      endVerseNum: 1
    };
    expect(Address.versesCount(mal3to4, "ukr-turk")).toBe(26);
    expect(Address.versesCount(mal3to4, "ukr-ogi")).toBe(20);
  });

  it("needs no numbering for a span inside one chapter", () => {
    const john316 = {
      bookIndex: 42,
      startChapterNum: 2,
      startVerseNum: 15,
      endChapterNum: 2,
      endVerseNum: 17
    };
    expect(Address.versesCount(john316, "ukr-turk")).toBe(3);
    expect(Address.versesCount(john316, null)).toBe(3);
  });
});

describe("Address.equals", () => {
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

/**
 * What "can this passage's text be asked for" comes down to. It used to be
 * written out by hand at each of the three places that asked, and each copy had
 * its own idea of what an unpicked part looks like.
 */
describe("Address.isComplete", () => {
  const john316 = {
    bookIndex: 42,
    startChapterNum: 2,
    startVerseNum: 15,
    endChapterNum: null,
    endVerseNum: null
  };

  it("is true for an address with an open end", () => {
    expect(Address.isComplete(john316)).toBe(true);
  });

  it("is true when the end is filled in as well", () => {
    expect(
      Address.isComplete({ ...john316, endChapterNum: 2, endVerseNum: 17 })
    ).toBe(true);
  });

  it("is false while any part of the start is unpicked", () => {
    expect(Address.isComplete({ ...john316, bookIndex: null })).toBe(false);
    expect(Address.isComplete({ ...john316, startChapterNum: null })).toBe(
      false
    );
    expect(Address.isComplete({ ...john316, startVerseNum: null })).toBe(false);
  });

  it("counts the picker's NaN as unpicked, the way equals does", () => {
    expect(Address.isComplete({ ...john316, startVerseNum: NaN })).toBe(false);
  });
});
