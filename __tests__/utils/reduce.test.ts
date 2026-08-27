import {
  ARCHIVED_NAME,
  LANGCODE,
  PASSAGELEVEL,
  STUDY_ONE_REPEATS,
  SETTINGS
} from "../../src/constants";
import {
  createAddress,
  createAppState,
  createPassage
} from "../../src/initials";
import { ActionName, PassageModel } from "../../src/models";
import { reduce } from "../../src/utils/reduce";

describe("reducer must return valid state for every call", () => {
  const testState = createAppState();
  const newPassage = createPassage(createAddress(), "test passage test");
  const verseList = [
    {
      ...createPassage(
        {
          ...createAddress(),
          bookIndex: 0,
          startChapterNum: 0,
          startVerseNum: 0
        },
        "test passage test 1"
      ),
      selectedLevel: PASSAGELEVEL.l1
    },
    {
      ...createPassage(
        {
          ...createAddress(),
          bookIndex: 0,
          startChapterNum: 0,
          startVerseNum: 1
        },
        "test passage test 2"
      ),
      selectedLevel: PASSAGELEVEL.l2
    },
    {
      ...createPassage(
        {
          ...createAddress(),
          bookIndex: 0,
          startChapterNum: 0,
          startVerseNum: 2
        },
        "test passage test 3"
      ),
      selectedLevel: PASSAGELEVEL.l3
    },
    {
      ...createPassage(
        {
          ...createAddress(),
          bookIndex: 0,
          startChapterNum: 0,
          startVerseNum: 3
        },
        "test passage test 4"
      ),
      selectedLevel: PASSAGELEVEL.l4
    },
    {
      ...createPassage(
        {
          ...createAddress(),
          bookIndex: 0,
          startChapterNum: 0,
          startVerseNum: 4
        },
        "test passage test 5"
      ),
      selectedLevel: PASSAGELEVEL.l5
    }
  ] as PassageModel[];

  it("reducer should work", () => {
    const toggledLangState = reduce(testState, {
      name: ActionName.setLang,
      payload: LANGCODE.ua
    });
    expect(toggledLangState?.settings.langCode).toBe(LANGCODE.ua);
  });

  it("should be able to add or edit passage", () => {
    const reducerResult = reduce(testState, {
      name: ActionName.setPassage,
      payload: newPassage
    });

    expect(reducerResult?.passages[0].id).toBe(newPassage.id);
    if (reducerResult) {
      const reducerResult2 = reduce(reducerResult, {
        name: ActionName.setPassage,
        payload: { ...newPassage, verseText: "changed verse text" }
      });
      expect(reducerResult2?.passages[0].verseText).toBe("changed verse text");
    }
  });
  it("should change verse list", () => {
    const changesVListResult = reduce(testState, {
      name: ActionName.setPassagesList,
      payload: verseList
    });
    expect(changesVListResult?.passages.length).toBe(verseList.length);
  });
  const afterGeneratingTests = reduce(
    { ...testState, passages: verseList },
    { name: ActionName.generateTests }
  );
  it("should be able to generate tests", () => {
    expect(afterGeneratingTests?.testsActive.length).toBeGreaterThan(0);
  });
  it("should be ablue to finish tests", () => {
    const finishedTests = afterGeneratingTests?.testsActive.map((t) => {
      return { ...t, f: true };
    });
    if (finishedTests && afterGeneratingTests) {
      const afterFinishingTests = reduce(
        { ...afterGeneratingTests },
        { name: ActionName.finishTesting, payload: { tests: finishedTests } }
      );
      expect(afterFinishingTests?.testsHistory.length).toBeGreaterThan(0);
    }
  });
  it("should toggle filter correctly", () => {
    const testFilterList = {
      tag: "asd",
      selectedLevel: PASSAGELEVEL.l1,
      maxLevel: PASSAGELEVEL.l1,
      translationId: 0
    };
    const afterTogglingFilters = reduce(testState, {
      name: ActionName.toggleFilter,
      payload: testFilterList
    });
    if (afterTogglingFilters !== null) {
      expect(afterTogglingFilters?.filters).toMatchObject({
        tags: [ARCHIVED_NAME, testFilterList.tag],
        selectedLevels: [testFilterList.selectedLevel],
        maxLevels: [testFilterList.maxLevel],
        translations: []
      });
      const afterTogglingFiltersTwice = reduce(afterTogglingFilters, {
        name: ActionName.toggleFilter,
        payload: testFilterList
      });
      expect(afterTogglingFiltersTwice?.filters).toMatchObject({
        tags: [ARCHIVED_NAME],
        selectedLevels: [],
        maxLevels: [],
        translations: []
      });
    }
  });
  it("changes settings param", () => {
    const changedSettings = reduce(testState, {
      name: ActionName.setSettingsParam,
      payload: {
        param: SETTINGS.langCode,
        value: LANGCODE.ua
      }
    });
    expect(changedSettings?.settings.langCode).toBe(LANGCODE.ua);
  });

  it("heals a dangling left-swipe tag when its tag disappears", () => {
    const taggedPassage = {
      ...createPassage(createAddress(), "tagged passage"),
      tags: ["custom"]
    };
    const withPassage = reduce(testState, {
      name: ActionName.setPassage,
      payload: taggedPassage
    });
    const withSwipeTag =
      withPassage &&
      reduce(withPassage, {
        name: ActionName.setLeftSwipeTag,
        payload: "custom"
      });
    // tag still exists on a passage → kept
    expect(withSwipeTag?.settings.leftSwipeTag).toBe("custom");
    // remove the tag from the only passage that carried it → must fall back
    const afterUntag =
      withSwipeTag &&
      reduce(withSwipeTag, {
        name: ActionName.setPassage,
        payload: { ...taggedPassage, tags: [] }
      });
    expect(afterUntag?.settings.leftSwipeTag).toBe(ARCHIVED_NAME);
  });

  // 8.2.1c — a drill fills testsActive and touches nothing else. The point of
  // the assertions on settings is that a study session must not hijack the
  // active train mode the way ActionName.generateTests deliberately does.
  it("generates a study-one session without disturbing the train modes", () => {
    const studied = verseList[0];
    const before = { ...testState, passages: verseList };
    const after = reduce(before, {
      name: ActionName.generateStudyOneTests,
      payload: { passageId: studied.id }
    });
    expect(after?.testsActive.length).toBe(STUDY_ONE_REPEATS);
    expect(after?.testsActive.every((t) => t.pi === studied.id)).toBe(true);
    expect(after?.settings.activeTrainModeId).toBe(
      before.settings.activeTrainModeId
    );
    expect(after?.settings.trainModesList).toEqual(
      before.settings.trainModesList
    );
    // the reducer JSON round-trips its result (NaN -> null), so compare the
    // passages against the same round-trip rather than the raw fixture
    expect(after?.passages).toEqual(
      JSON.parse(JSON.stringify(before.passages))
    );
  });

  it("is a no-op when the passage to study is gone", () => {
    const before = { ...testState, passages: verseList };
    expect(
      reduce(before, {
        name: ActionName.generateStudyOneTests,
        payload: { passageId: -1 }
      })
    ).toBe(null);
  });
});
