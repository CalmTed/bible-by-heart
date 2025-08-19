import { render } from "@testing-library/react-native";
import { LANGCODE, PASSAGELEVEL } from "../../../src/constants";
import { L10, L11 } from "../../../src/components/levels/Level1";
import { createT } from "../../../src/l10n";
import { AppStateModel, PassageModel } from "../../../src/models";
import { createAppState, createTest } from "../../../src/initials";
import { getThemeFromScheme } from "../../../src/utils/getThemeFromScheme";

describe("testing level 1 rendering", () => {
  it("Level 1 renders correctly", async () => {
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
        } as PassageModel,
        {
          id: 212610752,
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
        } as PassageModel,
        {
          id: 212610753,
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
        } as PassageModel,
        {
          id: 212610754,
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
        } as PassageModel
      ]
    } as AppStateModel;
    const test = createTest(123123, 212610751, PASSAGELEVEL.l1);
    const theme = getThemeFromScheme(testState.settings.theme, "dark");
    const t = createT(LANGCODE.en);
    const level10Tree = render(
      <L10
        theme={theme}
        test={test}
        state={testState}
        t={t}
        submitTest={() => {}}
        dispatch={(action) => {}}
      />
    ).toJSON();
    expect(level10Tree).toMatchSnapshot();
    const level11Tree = render(
      <L11
        theme={theme}
        test={test}
        state={testState}
        t={t}
        submitTest={() => {}}
        dispatch={(action) => {}}
      />
    ).toJSON();
    expect(level11Tree).toMatchSnapshot();
  });
});
