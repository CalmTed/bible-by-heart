import { PassageModel, TestModel } from "src/models";
import { createL10Test, CreateTestMethodModel } from "./createL10Test";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { getAddressDifference } from "../addressDifference";
import { addressDistance } from "../addressDistance";
import { randomListRange, randomRange } from "../randomizers";
import { SENTENCE_SEPARATOR } from "src/constants";

export const createL11Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const optionsLength = 4;
  const targetPassage = passages.find(
    (p) => p.id === initialTest.pi
    ) as PassageModel;
  const languageFilteredPassages = passages.filter(p => p.verseTranslation === targetPassage.verseTranslation)
  //if passages.length < optionsLength then replace with L10
  if (languageFilteredPassages.length < optionsLength) {
    return createL10Test({ initialTest, passages, history });
  }
  //passages from errors
  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const fromErrors = history
    .filter(ph => ph.pi === initialTest.pi || ph.wp || ph.wa)
    .filter(ph => ph.wp.includes(ph.i))
    .map((ph) =>
      languageFilteredPassages.filter((p) => ph.wp.includes(p.id) || ph.wa.find(wa => getAddressDifference(p.address, wa)))
    )
    .flat();
  //simular passages
  const closestPassages = [...languageFilteredPassages
    .filter(p => addressDistance(targetPassage.address, p.address) !== 0 && !fromErrors.filter(frp => p.id === frp.id).length)]
    .sort((a, b) => {
      let bias = 0;
      bias += b.address.bookIndex !== targetPassage.address.bookIndex ? -1000000 : 0;
      bias += b.address.startChapterNum !== targetPassage.address.startChapterNum ? -100000 : 0;
      bias += b.address.startVerseNum !== targetPassage.address.startVerseNum ? -100000 : 0;
      bias += b.versesNumber !== targetPassage.versesNumber ? -100000 : 0;
      return bias
    })
    .slice(0, optionsLength * 4)
  const wrongOptions = randomListRange(
    [...closestPassages, ...fromErrors]
      .filter((v, i, arr) => {
        return arr.slice(0,i).filter(arrV => arrV.id === v.id).length === 0 && v.id !== targetPassage.id;
      }),
    optionsLength - 1
  ) as PassageModel[];
  const allOptions = [...wrongOptions, targetPassage].sort(() =>
    Math.random() > 0.5 ? -1 : 1
  );
  //random range from 0 and maximum possible
  const maxSENTENCELength = Math.max(...allOptions.map(ao => ao.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 2).length))
  const rangeStart = randomRange(0, maxSENTENCELength - 1)
  const sentenceRange = successStroke ? [rangeStart, randomRange(rangeStart + 1, maxSENTENCELength)] : []
  const returnTest: TestModel = {
    ...initialTest,
    d: {
      ...initialTest.d,
      passagesOptions: allOptions,
      sentenceRange
    }
  };
  return returnTest;
};