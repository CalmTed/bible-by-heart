import { PASSAGELEVEL, TESTLEVEL } from "../../src/constants";
import { createAddress, createPassage, createTest } from "../../src/initials";
import { PassageModel } from "../../src/models";
import { createL11Test } from "../../src/utils/generateTests/createL11Tests";
import { createL10Test } from "../../src/utils/generateTests/createL10Test";

// Regression test for the level-11 translation bug: the wrong
// answer options must always share the target passage's translation, never mix
// in passages from a different translation/language.
describe("createL11Test", () => {
  const makePassage = (
    translation: number,
    startVerseNum: number,
    text: string
  ): PassageModel =>
    createPassage(
      {
        ...createAddress(),
        bookIndex: 0,
        startChapterNum: 0,
        startVerseNum,
        endChapterNum: null,
        endVerseNum: null
      },
      text,
      translation
    );

  it("only offers options from the target passage's translation", () => {
    const target = makePassage(1, 0, "First one. Second two. Third three.");
    const sameTranslation = [
      makePassage(1, 1, "Alpha here. Beta there. Gamma near."),
      makePassage(1, 2, "One line. Two line. Three line."),
      makePassage(1, 3, "Red fish. Blue fish. Green fish."),
      makePassage(1, 4, "Left turn. Right turn. Stop now.")
    ];
    const otherTranslation = [
      makePassage(2, 5, "Foreign one. Foreign two. Foreign three."),
      makePassage(2, 6, "Other one. Other two. Other three."),
      makePassage(2, 7, "Alt one. Alt two. Alt three.")
    ];
    const passages = [target, ...sameTranslation, ...otherTranslation];
    const initialTest = createTest(1, target.id, PASSAGELEVEL.l1);

    const result = createL11Test({ initialTest, passages, history: [] });
    const options = result.d.passagesOptions as PassageModel[];

    expect(options).toBeDefined();
    expect(options.length).toBe(4);
    expect(options.map((o) => o.id)).toContain(target.id);
    options.forEach((o) =>
      expect(o.verseTranslation).toBe(target.verseTranslation)
    );
  });

  // Four passages is exactly the size where the old fallback bit: the two
  // "L11 needs four passages" guards in generateATest count the WHOLE library and
  // pass, then this generator counts again inside the target's translation and
  // fails - so the work went to createL10Test while the test kept saying l11.
  // TestsScreen dispatches on `l`, rendered L11, and mapped over the
  // `passagesOptions` an L10 payload has never had. Address, nothing under it.
  it("hands back an honest l10 when the translation cannot fill the options", () => {
    const target = makePassage(1, 0, "First one. Second two. Third three.");
    const passages = [
      target,
      makePassage(1, 1, "Alpha here. Beta there. Gamma near."),
      makePassage(1, 2, "One line. Two line. Three line."),
      // one passage on another translation is all it takes - a custom-text
      // passage carries `null` here and does the same
      makePassage(2, 3, "Foreign one. Foreign two. Foreign three.")
    ];
    expect(passages).toHaveLength(4);
    const initialTest = {
      ...createTest(1, target.id, PASSAGELEVEL.l1),
      l: TESTLEVEL.l11
    };

    const result = createL11Test({ initialTest, passages, history: [] });

    expect(result.l).toBe(TESTLEVEL.l10);
    expect(result.d.addressOptions?.length).toBeGreaterThan(0);
    expect(result.d.passagesOptions).toBeUndefined();
  });

  // The rule the fix is really made of: whatever a generator hands back, its
  // `l` describes the payload in its `d`. TestsScreen's Record<TESTLEVEL, ...>
  // dispatch can only ever be as honest as `l` is.
  it("keeps l11 and its own payload when the translation CAN fill the options", () => {
    const target = makePassage(1, 0, "First one. Second two. Third three.");
    const passages = [
      target,
      makePassage(1, 1, "Alpha here. Beta there. Gamma near."),
      makePassage(1, 2, "One line. Two line. Three line."),
      makePassage(1, 3, "Red fish. Blue fish. Green fish.")
    ];
    const initialTest = {
      ...createTest(1, target.id, PASSAGELEVEL.l1),
      l: TESTLEVEL.l11
    };

    const result = createL11Test({ initialTest, passages, history: [] });

    expect(result.l).toBe(TESTLEVEL.l11);
    expect(result.d.passagesOptions?.length).toBe(4);
  });

  // The same rule from the other end: the L10 generator stamps l10 no matter what
  // it is handed, so no caller can leave a stale label behind.
  it("createL10Test stamps its own level whatever it is called with", () => {
    const target = makePassage(1, 0, "First one. Second two. Third three.");
    const passages = [target, makePassage(1, 1, "Alpha here. Beta there.")];
    [TESTLEVEL.l10, TESTLEVEL.l11].forEach((l) => {
      const result = createL10Test({
        initialTest: { ...createTest(1, target.id, PASSAGELEVEL.l1), l },
        passages,
        history: []
      });
      expect(result.l).toBe(TESTLEVEL.l10);
      expect(result.d.addressOptions?.length).toBeGreaterThan(0);
    });
  });
});
