import { convertState } from "../../src/utils/stateVersionConvert";
import { createAppState008, createPassage009 } from "../../src/initials";
import {
  AppStateModel008,
  AppStateModel010,
  AddressType,
  TestModel007
} from "../../src/models";
import { TESTLEVEL } from "../../src/constants";

// STRATEGY §3: the state-converter chain is high-blast-radius — a wrong converter
// silently destroys years of user stats — yet it had zero tests. This locks the
// current-era chain (0.0.8 → 0.0.9 → 0.1.0), which exercises the recursive
// convertState engine (partialMatch → goodMatch → finalMatch) plus the two most
// recent converters. Older hops (0.0.6/0.0.7) are legacy and left as follow-up.

const sampleAddress: AddressType = {
  bookIndex: 0,
  startChapterNum: 1,
  startVerseNum: 1,
  endChapterNum: 1,
  endVerseNum: 1
};

// A realistic 0.0.8 state built from the real initial-state factory (so the shape
// is genuinely valid) plus one passage, one finished test and one unfinished test.
const makeState008 = (): AppStateModel008 => {
  const base = createAppState008();
  // createPassage009 returns a superset of PassageModel008 (extra upgradeDates,
  // which the 0.0.9 converter overwrites anyway) — fine as a 0.0.8 passage.
  const passage = createPassage009(sampleAddress, "In the beginning");
  const finishedTest: TestModel007 = {
    id: 101,
    sessionId: 1,
    passageId: passage.id,
    userId: null,
    triesDuration: [[1000, 2000]],
    isFinished: true,
    level: TESTLEVEL.l10,
    testData: {},
    errorNumber: 0,
    errorType: null,
    wrongAddress: [],
    wrongPassagesId: [],
    wrongWords: []
  };
  const unfinishedTest: TestModel007 = {
    ...finishedTest,
    id: 102,
    triesDuration: [[1500, 1800]],
    isFinished: false
  };
  return {
    ...base,
    version: "0.0.8",
    passages: [passage],
    testsHistory: [finishedTest, unfinishedTest]
  };
};

describe("convertState (state version migration chain)", () => {
  it("migrates a 0.0.8 state all the way to the current version", () => {
    const result = convertState(makeState008()) as AppStateModel010 | null;
    expect(result).not.toBeNull();
    expect(result?.version).toBe("0.1.0");
  });

  it("preserves passages and keeps only finished history across the chain", () => {
    const state008 = makeState008();
    const result = convertState(state008) as AppStateModel010 | null;
    expect(result?.passages).toHaveLength(1);
    expect(result?.passages[0].id).toBe(state008.passages[0].id);
    // to009 filters history to finished tests only (2 in → 1 kept)
    expect(result?.testsHistory).toHaveLength(1);
    expect(result?.testsActive).toEqual([]);
  });

  it("carries user settings across the whole chain", () => {
    const state008 = makeState008();
    const result = convertState(state008) as AppStateModel010 | null;
    expect(result?.settings.langCode).toBe(state008.settings.langCode);
    expect(result?.settings.leftSwipeTag).toBe(state008.settings.leftSwipeTag);
  });

  it("strips auth/account data when producing the current version", () => {
    const result = convertState(makeState008()) as AppStateModel010 | null;
    expect(result?.userData.uuid).toBeNull();
    expect(result?.userData.email).toBeNull();
    // the old top-level authToken must not leak into the new userData shape
    expect(
      (result?.userData as Record<string, unknown>).authToken
    ).toBeUndefined();
  });

  it("returns null for an unknown / unsupported source version", () => {
    expect(convertState({ version: "0.0.1" })).toBeNull();
    expect(convertState({ version: "9.9.9" })).toBeNull();
  });
});
