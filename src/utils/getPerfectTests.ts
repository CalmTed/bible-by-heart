import { PassageModel, TestModel } from "../models";
import { testLevelToPassageLevel } from "./levelsConvertion";

// How many of the passage's MOST RECENT tests in a row were answered at (or
// above) its max level with no errors. The count stops at the first test that
// was not — hence "stroke".
const countPerfectStroke: (
  passageHistory: TestModel[],
  passage: PassageModel
) => number = (passageHistory, passage) => {
  const lastFewTests = [...passageHistory].sort(
    (a, b) => b.td[0][1] - a.td[0][1]
  );
  let strokeLenght = 0;
  for (const t of lastFewTests) {
    const isCorrect =
      testLevelToPassageLevel(t.l) >= passage.maxLevel && (t?.en || 0) === 0;
    if (!isCorrect) {
      break;
    }
    strokeLenght++;
  }
  return strokeLenght;
};

export const getPerfectTestsNumber: (
  history: TestModel[],
  passage: PassageModel
) => number = (history, passage) =>
  countPerfectStroke(
    history.filter((th) => th.pi === passage.id),
    passage
  );

// The same answer for every passage at once. finishTesting used to call the
// single-passage form per passage, and each call filtered AND sorted the whole
// history — O(P × H log H) on the action that already writes the most (8.2.21).
// One pass buckets the history by passage; each bucket is then sorted once.
export const getPerfectTestsNumbers: (
  history: TestModel[],
  passages: PassageModel[]
) => Map<number, number> = (history, passages) => {
  const buckets = new Map<number, TestModel[]>();
  history.forEach((t) => {
    const bucket = buckets.get(t.pi);
    if (bucket) {
      bucket.push(t);
    } else {
      buckets.set(t.pi, [t]);
    }
  });
  const strokes = new Map<number, number>();
  passages.forEach((p) => {
    strokes.set(p.id, countPerfectStroke(buckets.get(p.id) || [], p));
  });
  return strokes;
};
