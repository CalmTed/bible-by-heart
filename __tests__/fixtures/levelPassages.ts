/**
 * The passage every level-component test renders (8.2.6).
 *
 * The seven level tests used to carry their own copy of this object — four
 * copies inside the level 1 test alone — so a change to `PassageModel` meant
 * editing the same 30 lines seven times. Ids and timestamps are fixed, like in
 * the state fixtures next door: a snapshot may not depend on `Date.now()`.
 */
import { PASSAGELEVEL } from "../../src/constants";
import { AppStateModel, PassageModel } from "../../src/models";
import { createAppState } from "../../src/initials";

export const LEVEL_PASSAGE_ID = 212610751;

export const makeLevelPassage: (id?: number) => PassageModel = (
  id = LEVEL_PASSAGE_ID
) =>
  ({
    id,
    ownerId: null,
    address: {
      bookIndex: 44,
      startChapterNum: 7,
      startVerseNum: 27,
      endChapterNum: null,
      endVerseNum: null
    },
    upgradeDates: {
      [PASSAGELEVEL.l1]: 1687376737087,
      [PASSAGELEVEL.l2]: 0,
      [PASSAGELEVEL.l3]: 0,
      [PASSAGELEVEL.l4]: 0,
      [PASSAGELEVEL.l5]: 0
    },
    versesNumber: 1,
    verseText:
      "Знаємо, що тим, які люблять Бога, котрі покликані за Його постановою, все сприяє до добра.",
    verseTranslation: null,
    dateCreated: 1684352164930,
    dateEdited: 1687498016447,
    dateTested: 1687376737087,
    minIntervalDaysNum: null,
    selectedLevel: 3,
    maxLevel: 3,
    isNewLevelAwalible: false,
    tags: [],
    isReminderOn: false,
    isCollapsed: false
  }) as PassageModel;

/** An app state holding `count` copies of that passage, with sequential ids. */
export const makeLevelState: (count?: number) => AppStateModel = (count = 1) =>
  ({
    ...createAppState(),
    passages: Array(count)
      .fill(0)
      .map((z, i) => makeLevelPassage(LEVEL_PASSAGE_ID + i))
  }) as AppStateModel;

/** An app state holding exactly the passages given (possibly none). */
export const makeStateWith: (passages: PassageModel[]) => AppStateModel = (
  passages
) =>
  ({
    ...createAppState(),
    passages
  }) as AppStateModel;
