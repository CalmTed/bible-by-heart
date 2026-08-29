import { DAY, PASSAGELEVEL, TESTLEVEL } from "../../src/constants";
import { PassageModel, TestModel } from "../../src/models";
import { createAddress, createPassage } from "../../src/initials";
import addZero from "../../src/utils/addZero";
import { testLevelToPassageLevel } from "../../src/utils/levelsConvertion";
import { getMaxStroke, getStroke } from "../../src/utils/getStats";
import {
  getPerfectTestsNumber,
  getPerfectTestsNumbers
} from "../../src/utils/getPerfectTests";
import { getLastTestedByPassage } from "../../src/utils/generateTests";

// Four history scans were turned from O(n²) / O(P × H) into single passes.
// The outputs must not have moved, so this suite keeps the implementations they
// replaced and holds the shipped ones against them — on a history far larger
// than any other fixture in the repo (5 000 records, the size at which getStroke
// cost 42 ms on a desktop).

const dayInMs = DAY * 1000;
const HISTORY_SIZE = 5000;
const PASSAGE_COUNT = 40;
// A gap after the 30 most recent days, so the current stroke and the record
// stroke are different numbers and a naive "every day" fixture cannot pass.
const GAP_AFTER_DAYS = 30;
const GAP_LENGTH_DAYS = 5;

const now = new Date().getTime();

const passages: PassageModel[] = Array.from(
  { length: PASSAGE_COUNT },
  (_unused, index) => ({
    ...createPassage(createAddress(), `passage ${index}`),
    id: index + 1,
    // spread over the levels, since a "perfect" test is judged against maxLevel
    maxLevel: ([
      PASSAGELEVEL.l1,
      PASSAGELEVEL.l2,
      PASSAGELEVEL.l3,
      PASSAGELEVEL.l4,
      PASSAGELEVEL.l5
    ] as const)[index % 5]
  })
);

const testLevels = [
  TESTLEVEL.l10,
  TESTLEVEL.l11,
  TESTLEVEL.l20,
  TESTLEVEL.l21,
  TESTLEVEL.l30,
  TESTLEVEL.l40,
  TESTLEVEL.l50
];

// Deterministic on purpose: no Math.random, so a failure is reproducible.
const history: TestModel[] = Array.from(
  { length: HISTORY_SIZE },
  (_unused, index) => {
    const dayIndex = Math.floor(index / PASSAGE_COUNT);
    const daysAgo =
      dayIndex < GAP_AFTER_DAYS ? dayIndex : dayIndex + GAP_LENGTH_DAYS;
    const finishedAt = now - daysAgo * dayInMs;
    return {
      i: index + 1,
      si: dayIndex + 1,
      pi: (index % PASSAGE_COUNT) + 1,
      ui: null,
      td: [[finishedAt - 1000, finishedAt]],
      f: true,
      l: testLevels[index % testLevels.length],
      d: {},
      en: index % 5 === 0 ? 1 : 0,
      et: [],
      wa: [],
      wp: [],
      ww: []
    };
  }
);

const dayKey = (t: TestModel) => {
  const d = new Date(t.td[t.td.length - 1][1] || 0);
  return `${addZero(d.getFullYear(), 4)}-${addZero(
    d.getMonth() + 1
  )}-${addZero(d.getDate())}`;
};

// ---- the implementations they replaced, verbatim in behaviour ----

const naiveGetStroke = (testHistory: TestModel[]) => {
  const nowD = new Date().getTime();
  const allDays = [...testHistory]
    .sort((a, b) => Math.max(...b.td.flat()) - Math.max(...a.td.flat()))
    .map(dayKey);
  const uniqueDays = allDays.filter(
    (v, i, arr) => !arr.slice(0, i).includes(v)
  );
  const isToday = nowD - new Date(uniqueDays[0]).getTime() < dayInMs;
  const isYesterday =
    !isToday && nowD - new Date(uniqueDays[0]).getTime() < dayInMs * 2;
  const unbrokenSeries = uniqueDays
    .map((v, i, arr) => {
      const d2 = new Date(v).getTime();
      if (!i) {
        return isToday || isYesterday;
      }
      const prvD = new Date(arr[i - 1]).getTime();
      return prvD - d2 <= dayInMs;
    })
    .filter((v, i, arr) => !arr.slice(0, i + 1).includes(false));
  return { length: unbrokenSeries.length, today: isToday };
};

const naiveGetMaxStroke = (testHistory: TestModel[]) => {
  const uniqueDayTimes = [...testHistory]
    .map(dayKey)
    .filter((v, i, arr) => !arr.slice(0, i).includes(v))
    .map((v) => new Date(v).getTime())
    .sort((a, b) => a - b);
  if (!uniqueDayTimes.length) {
    return 0;
  }
  let maxStroke = 1;
  let currentStroke = 1;
  for (let i = 1; i < uniqueDayTimes.length; i++) {
    const gap = uniqueDayTimes[i] - uniqueDayTimes[i - 1];
    currentStroke = gap > 0 && gap <= dayInMs ? currentStroke + 1 : 1;
    if (currentStroke > maxStroke) {
      maxStroke = currentStroke;
    }
  }
  return maxStroke;
};

const naivePerfectTestsNumber = (
  testHistory: TestModel[],
  passage: PassageModel
) => {
  const lastFewTests = [
    ...testHistory.filter((th) => th.pi === passage.id)
  ].sort((a, b) => b.td[0][1] - a.td[0][1]);
  let strokeLenght = 0;
  let strokeFlag = true;
  lastFewTests.forEach((t) => {
    const isCorrect =
      testLevelToPassageLevel(t.l) >= passage.maxLevel && (t?.en || 0) === 0;
    if (isCorrect && strokeFlag) {
      strokeLenght++;
    } else {
      strokeFlag = false;
    }
  });
  return strokeLenght;
};

const naiveLastTested = (testHistory: TestModel[], passage: PassageModel) =>
  [...testHistory.filter((t) => t.pi === passage.id)].sort(
    (a, b) => (b?.td?.[0]?.[1] || 0) - (a?.td?.[0]?.[1] || 0)
  )[0]?.td?.[0]?.[1] || 0;

// ---- the agreement ----

describe("history scans agree with the implementations they replaced", () => {
  it("has a fixture worth measuring against", () => {
    expect(history.length).toBe(HISTORY_SIZE);
    // the fixture must actually exercise a broken streak, or the stroke tests
    // would pass on any implementation that just counts unique days
    expect(getStroke(history).length).toBe(GAP_AFTER_DAYS);
    expect(getMaxStroke(history)).toBeGreaterThan(GAP_AFTER_DAYS);
  });

  it("getStroke", () => {
    expect(getStroke(history)).toEqual(naiveGetStroke(history));
    expect(getStroke([])).toEqual(naiveGetStroke([]));
    expect(getStroke(history.slice(0, 1))).toEqual(
      naiveGetStroke(history.slice(0, 1))
    );
  });

  it("getMaxStroke", () => {
    expect(getMaxStroke(history)).toBe(naiveGetMaxStroke(history));
    expect(getMaxStroke([])).toBe(naiveGetMaxStroke([]));
  });

  it("getPerfectTestsNumber, one passage at a time", () => {
    passages.forEach((p) => {
      expect(getPerfectTestsNumber(history, p)).toBe(
        naivePerfectTestsNumber(history, p)
      );
    });
  });

  it("getPerfectTestsNumbers, every passage at once", () => {
    const batched = getPerfectTestsNumbers(history, passages);
    expect(batched.size).toBe(passages.length);
    passages.forEach((p) => {
      expect(batched.get(p.id)).toBe(naivePerfectTestsNumber(history, p));
    });
    // a passage with no history at all still gets an answer
    const unknown = { ...passages[0], id: 999999 };
    expect(getPerfectTestsNumbers(history, [unknown]).get(unknown.id)).toBe(0);
  });

  it("getLastTestedByPassage", () => {
    const lastTested = getLastTestedByPassage(history);
    passages.forEach((p) => {
      expect(lastTested.get(p.id) || 0).toBe(naiveLastTested(history, p));
    });
    expect(getLastTestedByPassage(history).get(999999) || 0).toBe(0);
  });

  it("does not mutate the history it is handed", () => {
    const order = history.map((t) => t.i);
    getStroke(history);
    getMaxStroke(history);
    getPerfectTestsNumbers(history, passages);
    getLastTestedByPassage(history);
    expect(history.map((t) => t.i)).toEqual(order);
  });
});
