import { PassageModel, TestModel } from "../models";
import { testLevelToPassageLevel } from "./levelsConvertion";

export const getPerfectTestsNumber: (
  history: TestModel[],
  passage: PassageModel
) => number = (history, passage) => {
  const lastFewTests = [...history
    .filter((th) => th.pi === passage.id)]
    .sort(
      (a, b) =>
        b.td[0][1] -
        a.td[0][1]
    )
  let strokeLenght = 0
  let strokeFlag = true
  lastFewTests.forEach((t) => {
    const isCorrect = testLevelToPassageLevel(t.l) >= passage.maxLevel && (t?.en || 0) == 0 
    if(isCorrect && strokeFlag){
      strokeLenght ++
    }else{
      strokeFlag = false
    }
  })
  return strokeLenght
};
