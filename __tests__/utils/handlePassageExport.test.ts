import { createAppState } from "../../src/initials";
import {
  arrayToPassages,
  LSVToArray,
  passagesToLSV
} from "../../src/utils/handlePassageExport";
import { PASSAGELEVEL } from "../../src/constants";
import { AppStateModel } from "../../src/models";

describe("exporting data", () => {
  const testState = {
    ...createAppState(),
    passages: [
      {
        id: 212610751,
        ownerId: null,
        address: {
          bookIndex: 44,
          startChapterNum: 7,
          startVerseNum: 27,
          endChapterNum: null,
          endVerseNum: null
        },
        versesNumber: 1,
        upgradeDates: {
          [PASSAGELEVEL.l1]: 1687376737087,
          [PASSAGELEVEL.l2]: 0,
          [PASSAGELEVEL.l3]: 0,
          [PASSAGELEVEL.l4]: 0,
          [PASSAGELEVEL.l5]: 0
        },
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
      }
    ]
  } as AppStateModel;
  it("convert to LSV and back", () => {
    const lsvPassages = passagesToLSV(testState);
    if (lsvPassages !== false) {
      expect(lsvPassages).toBe(
        "address|verseText|verseTranslation|tags\nRomans 8:28|Знаємо, що тим, які люблять Бога, котрі покликані за Його постановою, все сприяє до добра.||"
      );
      const passagesArray = LSVToArray(lsvPassages);
      if (passagesArray !== false) {
        const passagesList = arrayToPassages(passagesArray, createAppState());
        if (passagesList !== false) {
          expect(passagesList.passages[0].address).toMatchObject(
            testState.passages[0].address
          );
          expect(passagesList.passages[0].verseText).toBe(
            testState.passages[0].verseText
          );
        }
      }
    }
  });
});
