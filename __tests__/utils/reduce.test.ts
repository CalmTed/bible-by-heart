import {
  ARCHIVED_NAME,
  LANGCODE,
  PASSAGELEVEL,
  SORTINGOPTION,
  STUDY_ONE_REPEATS,
  SETTINGS
} from "../../src/constants";
import {
  createAddress,
  createAppState,
  createPassage,
  createTest
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
    // 8.2.20 — the reducer no longer deep-clones its result, so the parts an
    // action did not touch come back by identity, not by value.
    expect(after?.passages).toBe(before.passages);
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

  // 8.2.20 — the reducer used to end every action in
  // JSON.parse(JSON.stringify(state)). These two tests are what prove it is gone
  // and that removing it did not leave the shared-reference bug the clone hid.
  describe("no deep clone of the whole state (8.2.20)", () => {
    it("hands back the untouched parts of the state by identity", () => {
      const before = {
        ...testState,
        passages: verseList,
        testsHistory: [
          ...createAppState().testsHistory,
          {
            ...createTest(1, verseList[0].id, PASSAGELEVEL.l1),
            td: [[0, new Date().getTime()]]
          }
        ]
      };
      const after = reduce(before, {
        name: ActionName.setSorting,
        payload: SORTINGOPTION.address
      });
      expect(after?.sort).toBe(SORTINGOPTION.address);
      // a sort change copies nothing else — history is the big one
      expect(after?.passages).toBe(before.passages);
      expect(after?.testsHistory).toBe(before.testsHistory);
      expect(after?.settings).toBe(before.settings);
    });

    it("does not write into the previous state's settings object", () => {
      // setPassage builds a new top-level state but keeps the previous
      // `settings` reference, so the post-switch heals used to mutate the state
      // React had already rendered. Nothing here should reach `before`.
      const before = {
        ...testState,
        passages: [],
        settings: {
          ...testState.settings,
          leftSwipeTag: "gone",
          devModeEnabled: true,
          devModeActivationTime: 1
        }
      };
      const settingsBefore = { ...before.settings };
      const after = reduce(before, {
        name: ActionName.setPassage,
        payload: newPassage
      });
      // the heals still happen, on a copy
      expect(after?.settings.leftSwipeTag).toBe(ARCHIVED_NAME);
      expect(after?.settings.devModeEnabled).toBe(false);
      expect(after?.settings.devModeActivationTime).toBe(null);
      expect(after?.settings).not.toBe(before.settings);
      // and the state that was handed in is untouched
      expect(before.settings).toEqual(settingsBefore);
    });

    it("skips the dangling-tag scan when neither passages nor settings moved", () => {
      // The tag heal walks every passage; only a passage or settings change can
      // strand the tag, so an unrelated action must leave settings by identity
      // even while the tag is dangling.
      const before = {
        ...testState,
        passages: [],
        settings: { ...testState.settings, leftSwipeTag: "gone" }
      };
      const after = reduce(before, {
        name: ActionName.setSorting,
        payload: SORTINGOPTION.maxLevel
      });
      expect(after?.settings).toBe(before.settings);
      expect(after?.settings.leftSwipeTag).toBe("gone");
    });
  });
});
