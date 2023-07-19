import { PERFECT_TESTS_TO_PRCEED } from "../constants";
import { PassageModel, TestModel } from "../models";

export const getPerfectTestsNumber: (
  history: TestModel[],
  passageId: PassageModel
) => number = (history, passage) => {
  const lastThreeTests = history
    .sort(
      (a, b) =>
        b.triesDuration[b.triesDuration.length - 1][1] -
        a.triesDuration[a.triesDuration.length - 1][1]
    )
    .filter((th) => th.passageId === passage.id)
    .slice(0, PERFECT_TESTS_TO_PRCEED);
  //does last tree tests has max avalible level
  const lastTestsWithMaxLevel = lastThreeTests.filter(
    (t) => t.level.toString().slice(0, 1) === passage.maxLevel.toString()
  );
  //does last three tests has any error
  const ErrorNUmberFromLastThreeTests = lastTestsWithMaxLevel.filter(
    (th) => (th.errorNumber || 0) === 0
  ).length;
  return ErrorNUmberFromLastThreeTests;
};
