import { PassageModel, TestModel } from "../../models";
import { createL10Test, CreateTestMethodModel } from "./createL10Test";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { Passage } from "../passage";
import { Address } from "../address";
import { randomListRange, randomRange } from "../randomizers";
import { MIN_TEST_OPTIONS } from "../../constants";

//select right qoute
export const createL11Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const optionsLength = MIN_TEST_OPTIONS;
  const targetPassage = passages.find(
    (p) => p.id === initialTest.pi
  ) as PassageModel;
  const languageFilteredPassages = passages.filter(
    (p) => p.verseTranslation === targetPassage.verseTranslation
  );
  // Not enough verses in the target's own translation to offer four of them, so
  // this becomes the OTHER half of level 1 - read the verse, pick the address.
  // The count is the third one guarding this: `generateATest` checks the whole
  // library twice before getting here, and one passage on another translation (or
  // on `null`, which a custom-text passage carries) is enough to fail this one
  // while both of those passed. createL10Test stamps the level it hands back, so
  // the test that comes out of here is honestly an l10 (8.2.38).
  if (languageFilteredPassages.length < optionsLength) {
    return createL10Test({ initialTest, passages, history });
  }
  //passages from errors
  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const fromErrors = history
    .filter((ph) => ph.pi === initialTest.pi || ph.wp || ph.wa)
    .filter((ph) => ph.wp.includes(ph.i))
    .map((ph) =>
      languageFilteredPassages.filter(
        (p) =>
          ph.wp.includes(p.id) ||
          ph.wa.find((wa) => Address.equals(p.address, wa))
      )
    )
    .flat();
  //simular passages
  const closestPassages = [
    ...languageFilteredPassages.filter(
      (p) =>
        Address.distance(targetPassage.address, p.address) !== 0 &&
        !fromErrors.filter((frp) => p.id === frp.id).length
    )
  ]
    .sort((a, b) => {
      // Higher (closer to 0) proximity = more similar to the target passage.
      // Compare the two candidates so the closest ones sort first.
      const proximity = (p: PassageModel) => {
        let bias = 0;
        bias +=
          p.address.bookIndex !== targetPassage.address.bookIndex
            ? -1000000
            : 0;
        bias +=
          p.address.startChapterNum !== targetPassage.address.startChapterNum
            ? -100000
            : 0;
        bias +=
          p.address.startVerseNum !== targetPassage.address.startVerseNum
            ? -100000
            : 0;
        bias += p.versesNumber !== targetPassage.versesNumber ? -100000 : 0;
        return bias;
      };
      return proximity(b) - proximity(a);
    })
    .slice(0, optionsLength * 4);
  const wrongOptions = randomListRange(
    [...closestPassages, ...fromErrors].filter((v, i, arr) => {
      return (
        arr.slice(0, i).filter((arrV) => arrV.id === v.id).length === 0 &&
        v.id !== targetPassage.id
      );
    }),
    optionsLength - 1
  ) as PassageModel[];
  const allOptions = [...wrongOptions, targetPassage].sort(() =>
    Math.random() > 0.5 ? -1 : 1
  );
  //random range from 0 and maximum possible
  const maxSENTENCELength = Math.max(
    ...allOptions.map((ao) => Passage.getSentences(ao.verseText).length)
  );
  const rangeStart = randomRange(0, maxSENTENCELength - 1);
  const sentenceRange = successStroke
    ? [rangeStart, randomRange(rangeStart + 1, maxSENTENCELength)]
    : [];
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
