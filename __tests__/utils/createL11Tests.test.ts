import { PASSAGELEVEL } from "../../src/constants";
import { createAddress, createPassage, createTest } from "../../src/initials";
import { PassageModel } from "../../src/models";
import { createL11Test } from "../../src/utils/generateTests/createL11Tests";

// Regression test for the level-11 translation bug (STRATEGY §2 P0): the wrong
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
});
