import {
  PASSAGELEVEL,
  SETTINGS,
  STATSMETRICS,
  TESTLEVEL
} from "../../src/constants";
import { AppStateModel, PassageModel, TestModel } from "../../src/models";
import {
  getAppStats,
  getPassageStats,
  getStroke,
  getWeeklyStats
} from "../../src/utils/getStats";

describe("stats should work", () => {
  const testHistory = [
    {
      i: 333,
      si: 123123,
      pi: 212610751,
      td: [[0, new Date(new Date().getTime() - 1000 * 60 * 60 * 24).getTime()]],
      // ui: null,
      f: true,
      l: TESTLEVEL.l10,
      //d: undefined,
      en: 0,
      et: [],
      wa: [],
      wp: [],
      ww: []
    },
    {
      i: 334,
      si: 323213,
      pi: 212610751,
      td: [[0, new Date().getTime()]],
      f: true,
      l: TESTLEVEL.l10,
      en: 0,
      et: [],
      wa: [],
      wp: [],
      ww: []
    }
  ];
  const testStatsState = {
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
      } as PassageModel
    ],
    testsHistory: testHistory,
    settings: {
      [SETTINGS.homeScreenWeeklyMetric]: STATSMETRICS.sesstions
    }
  } as never as AppStateModel;

  it("get stroke", () => {
    const emptyStroke = getStroke([]);
    expect(emptyStroke.length).toBe(0);
    const justStroke = getStroke(testHistory as never as TestModel[]);
    expect(justStroke.length).toBe(2);
    expect(justStroke.today).toBe(true);
  });

  it("get weekly bar chart data", () => {
    const weeklyStats = getWeeklyStats(testStatsState);
    expect(weeklyStats.length).toBe(7);
    expect(weeklyStats[3]).toHaveProperty(["label"]);
  });

  it("get passage stats", () => {
    const passageStats = getPassageStats(
      testStatsState,
      testStatsState.passages[0]
    );
    expect(Object.keys(passageStats)).toMatchObject([
      "totalTimeSpentMS",
      "totalTestsNumber",
      "avgDurationMS",
      "avgDurationByLevel",
      "wordErrorsHeatMap",
      "mostOftenAdressErrors"
    ]);
    expect(passageStats.totalTestsNumber).toBe(2);
  });

  it("get app stats", () => {
    const appStats = getAppStats(testStatsState);
    expect(Object.keys(appStats)).toMatchObject([
      "absoluteScore",
      "relativeScore",
      "avgDayDuration",
      "avgDayDurationRelativePercent",
      "avgWeekDuration",
      "avgWeekDurationRelativePercent",
      "maxStroke",
      "totalTimeSpentMS",
      "totalTestsNumber",
      "avgDurationMS",
      "avgDurationByLevel",
      "avgSessionDurationMS",
      "allDaysStats"
    ]);
    expect(appStats.absoluteScore).toBe(0);
    expect(appStats.avgDayDurationRelativePercent).toBe(100);
    expect(appStats.totalTestsNumber).toBe(2);
  });
});
