/**
 * 8.2.1c — "study this one": a transient session that drills ONE passage a few
 * times. What these pin is the contract the mode rests on: only that passage is
 * in the session, it is there several times, and nothing in the train-mode
 * setup is consulted or changed.
 */
import { PASSAGELEVEL, STUDY_ONE_REPEATS } from "../../src/constants";
import {
  createAddress,
  createAppState,
  createPassage
} from "../../src/initials";
import { AppStateModel, PassageModel } from "../../src/models";
import { generateStudyOneTests } from "../../src/utils/generateTests";

const passageAt = (verse: number, text: string): PassageModel =>
  createPassage(
    { ...createAddress(), bookIndex: 0, startChapterNum: 0, startVerseNum: verse },
    text
  );

const stateWith = (passages: PassageModel[]): AppStateModel => ({
  ...createAppState(),
  passages
});

describe("generateStudyOneTests", () => {
  const target = passageAt(0, "In the beginning God created the heaven and the earth");
  const others = [
    passageAt(1, "And the earth was without form, and void"),
    passageAt(2, "And God said, Let there be light"),
    passageAt(3, "And God saw the light, that it was good")
  ];

  it("repeats the one passage STUDY_ONE_REPEATS times", () => {
    const tests = generateStudyOneTests(stateWith([target, ...others]), target.id);
    expect(tests).toHaveLength(STUDY_ONE_REPEATS);
    expect(tests.every((t) => t.pi === target.id)).toBe(true);
  });

  it("puts every repeat in one session and gives each its own id", () => {
    const tests = generateStudyOneTests(stateWith([target, ...others]), target.id);
    expect(new Set(tests.map((t) => t.si)).size).toBe(1);
    expect(new Set(tests.map((t) => t.i)).size).toBe(tests.length);
  });

  it("honours an explicit repeat count and never generates an empty session", () => {
    expect(generateStudyOneTests(stateWith([target]), target.id, 1)).toHaveLength(1);
    expect(generateStudyOneTests(stateWith([target]), target.id, 0)).toHaveLength(1);
  });

  it("works when the passage is the only one in the library", () => {
    const tests = generateStudyOneTests(stateWith([target]), target.id);
    expect(tests).toHaveLength(STUDY_ONE_REPEATS);
    // l11 needs 4 passages to build its options; generateATest downgrades it
    expect(tests.every((t) => !!t.d.addressOptions?.length)).toBe(true);
  });

  it("tests the passage at its own selected level", () => {
    const atLevel3 = { ...target, selectedLevel: PASSAGELEVEL.l3 };
    const tests = generateStudyOneTests(stateWith([atLevel3, ...others]), atLevel3.id);
    // l3 has one test level, so the mapping is checkable without randomness
    expect(new Set(tests.map((t) => t.l)).size).toBe(1);
    expect(tests[0].d.missingWords).toBeDefined();
  });

  it("returns nothing for a passage that does not exist", () => {
    expect(generateStudyOneTests(stateWith([target]), target.id + 1)).toEqual([]);
  });

  it("returns nothing for a passage with no text to be tested on", () => {
    const empty = passageAt(9, "   ");
    expect(generateStudyOneTests(stateWith([empty]), empty.id)).toEqual([]);
  });

  it("ignores the train-mode setup entirely", () => {
    // every train mode disabled: a normal session would come back empty, a
    // drill still runs, because it is a target and not a filter
    const state = stateWith([target, ...others]);
    const noModes: AppStateModel = {
      ...state,
      settings: {
        ...state.settings,
        trainModesList: state.settings.trainModesList.map((m) => ({
          ...m,
          enabled: false
        }))
      }
    };
    expect(generateStudyOneTests(noModes, target.id)).toHaveLength(
      STUDY_ONE_REPEATS
    );
  });
});
