/**
 * 8.2.36 — a test with one option is not a test. The levels that ask the user to
 * PICK a passage out of a list (l11, l21) draw every option from the library, so
 * at the library sizes a new user actually has (1, 2, 3) they can only offer the
 * answer itself. Each of them falls back to the half of its own level that asks
 * about the ADDRESS, which needs no library to draw decoys from.
 */
import {
  MIN_TEST_OPTIONS,
  PASSAGELEVEL,
  TESTLEVEL
} from "../../src/constants";
import { createAddress, createPassage, createTest } from "../../src/initials";
import { PassageModel } from "../../src/models";
import {
  canOfferPassageOptions,
  generateATest
} from "../../src/utils/generateTests";

const passageAt = (verse: number, text: string, translation = 1): PassageModel =>
  createPassage(
    {
      ...createAddress(),
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: verse,
      endChapterNum: null,
      endVerseNum: null
    },
    text,
    translation
  );

const library = (size: number): PassageModel[] =>
  Array.from({ length: size }, (v, i) =>
    passageAt(i, `Sentence ${i} one. Sentence ${i} two. Sentence ${i} three.`)
  );

// The level pair is picked at random inside the generator, so one call proves
// nothing about the branch that was not taken. Every run has to land on an
// option-free level for the guarantee to hold.
const RUNS = 40;
const levelsOver = (
  passages: PassageModel[],
  passageLevel: PASSAGELEVEL
): TESTLEVEL[] =>
  Array.from({ length: RUNS }, () =>
    generateATest(
      createTest(1, passages[0].id, passageLevel),
      passages,
      undefined,
      []
    )
  ).map((test) => test.l);

describe("generateATest option-count rule (8.2.36)", () => {
  [1, 2, 3].forEach((size) => {
    it(`never asks to pick a verse out of ${size} passage(s)`, () => {
      const passages = library(size);
      expect(levelsOver(passages, PASSAGELEVEL.l1)).not.toContain(TESTLEVEL.l11);
      expect(levelsOver(passages, PASSAGELEVEL.l2)).not.toContain(TESTLEVEL.l21);
    });

    it(`still produces a test for every passage at size ${size}`, () => {
      const passages = library(size);
      // skipping a level must never leave a session empty: the address half of
      // the same level is always there to ask instead
      expect(levelsOver(passages, PASSAGELEVEL.l1)).toContain(TESTLEVEL.l10);
      expect(levelsOver(passages, PASSAGELEVEL.l2)).toContain(TESTLEVEL.l20);
    });
  });

  it("offers the picking levels again once the library can fill them", () => {
    const passages = library(MIN_TEST_OPTIONS);
    expect(levelsOver(passages, PASSAGELEVEL.l1)).toContain(TESTLEVEL.l11);
    expect(levelsOver(passages, PASSAGELEVEL.l2)).toContain(TESTLEVEL.l21);
  });

  it("fills the options it does offer up to the minimum", () => {
    const passages = library(MIN_TEST_OPTIONS);
    const alone = library(1);
    const l10 = generateATest(
      createTest(1, alone[0].id, PASSAGELEVEL.l1),
      alone,
      PASSAGELEVEL.l1,
      []
    );
    expect(l10.d.addressOptions).toHaveLength(MIN_TEST_OPTIONS);
    const picked = Array.from({ length: RUNS }, () =>
      generateATest(
        createTest(1, passages[0].id, PASSAGELEVEL.l1),
        passages,
        PASSAGELEVEL.l1,
        []
      )
    ).find((test) => test.l === TESTLEVEL.l11);
    expect(picked?.d.passagesOptions).toHaveLength(MIN_TEST_OPTIONS);
  });
});

describe("canOfferPassageOptions (8.2.36)", () => {
  it("counts inside the target's own translation", () => {
    const target = passageAt(0, "First one. Second two.", 1);
    const sameTranslation = [
      passageAt(1, "Alpha here. Beta there.", 1),
      passageAt(2, "One line. Two line.", 1)
    ];
    const otherTranslation = [
      passageAt(3, "Foreign one. Foreign two.", 2),
      passageAt(4, "Other one. Other two.", 2)
    ];
    // five passages in the library, three of them in the target's translation
    expect(
      canOfferPassageOptions(
        [target, ...sameTranslation, ...otherTranslation],
        target.id
      )
    ).toBe(false);
    expect(
      canOfferPassageOptions(
        [target, ...sameTranslation, passageAt(5, "Third line. Fourth.", 1)],
        target.id
      )
    ).toBe(true);
  });

  it("says no for a passage that is not in the library", () => {
    expect(canOfferPassageOptions(library(MIN_TEST_OPTIONS), -1)).toBe(false);
  });
});
