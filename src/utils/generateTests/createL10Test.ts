import { AddressType, PassageModel, TestModel } from "../../models";
import { getPerfectTestsNumber } from "../getPerfectTests";
import {
  MINIMUM_SENTENCE_LENGTH,
  MIN_TEST_OPTIONS,
  TESTLEVEL
} from "../../constants";
import { randomItem, randomRange } from "../randomizers";
import { Address } from "../address";
import { Passage } from "../passage";
import { bibleReference } from "../../bibleReference";

export interface CreateTestInputModel {
  initialTest: TestModel;
  passages: PassageModel[];
  history: TestModel[];
}
export type CreateTestMethodModel = (data: CreateTestInputModel) => TestModel;

export const createL10Test: CreateTestMethodModel = ({
  initialTest,
  passages,
  history
}) => {
  const targetPassage = passages.find((ps) => ps.id === initialTest.pi); //targetPassage
  const optionsLength = MIN_TEST_OPTIONS;
  if (!targetPassage) {
    return initialTest;
  }

  const successStroke = getPerfectTestsNumber(history, targetPassage);
  const sentases = Passage.getSentences(targetPassage.verseText);
  const randomSentenceStart = randomRange(
    1,
    sentases.length > 1 ? sentases.length - 1 : 1
  );
  const randomSentenceEnd = randomRange(
    randomSentenceStart + 1,
    Math.max(randomSentenceStart + 1, sentases.length - 1)
  );
  const shouldntSlice =
    !successStroke ||
    sentases.length < 2 ||
    Passage.joinSentences(
      sentases.slice(randomSentenceStart, randomSentenceEnd)
    ).length < MINIMUM_SENTENCE_LENGTH ||
    Math.random() > 0.5;
  const sentenceRange = shouldntSlice
    ? []
    : [randomSentenceStart, randomSentenceEnd];
  const errorAddresses = history
    //same passage, any level, but some wrong address (maybe from 2nd level even)
    .filter((h) => h.pi === targetPassage.id && h.wa.length)
    .map((h) => h.wa)
    .flat();
  let uniqueErrorAddresses = errorAddresses.filter((a, i, arr) => {
    return arr.filter((a2) => Address.equals(a, a2)).length === 1;
  });
  const neigborsAddresses = passages
    .filter(
      (np) =>
        np.versesNumber === targetPassage.versesNumber &&
        (np.address.bookIndex === targetPassage.address.bookIndex ||
          np.address.startChapterNum === targetPassage.address.startChapterNum)
    )
    .map((np) => np.address);
  let uniqueNeigborsAddresses = neigborsAddresses.filter(
    (a) =>
      uniqueErrorAddresses.filter((a2) => Address.equals(a, a2)).length === 0 &&
      !Address.equals(a, targetPassage.address)
  );
  const probabilityOptionError = errorAddresses.length ? 0.5 : 0;
  const probabilityOptionNeigbor = neigborsAddresses.length
    ? probabilityOptionError + 0.4
    : 0;

  const getRandomAddress: (
    p: PassageModel,
    exept: AddressType[]
  ) => AddressType = (target, exept) => {
    //just random address (a book before, same book,a book after, just a random)
    const randomBookIndex = randomItem([
      target.address.bookIndex > 0
        ? target.address.bookIndex - 1
        : target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex,
      target.address.bookIndex < bibleReference.length - 1
        ? target.address.bookIndex + 1
        : target.address.bookIndex,
      randomRange(0, bibleReference.length - 1)
    ]) as number;
    const randomStartChapterNumber = randomRange(
      0,
      bibleReference[randomBookIndex].chapters.length - 1
    );
    //if same chapter or null/NaN
    //then same as randomStart
    //else randomStart + originChapterDifference
    const randomEndChapterNumber =
      target.address.startChapterNum === target.address.endChapterNum ||
      !target.address.endChapterNum
        ? randomStartChapterNumber
        : randomStartChapterNumber +
          Math.min(
            Math.abs(
              target.address.endChapterNum - target.address.startChapterNum
            ),
            bibleReference[randomBookIndex].chapters.length -
              randomStartChapterNumber
          );
    const randomStartVerseNumber = randomRange(
      0,
      bibleReference[randomBookIndex].chapters[randomStartChapterNumber]
    );
    //if same verse or null/NaN
    //  then same as randomStart
    //else if same chapter
    //  then random from starting verse to chapter end
    //  else random from start to the end on end-chapter
    const randomEndVerseNumber =
      target.address.startVerseNum === target.address.endVerseNum ||
      !target.address.endVerseNum
        ? randomStartVerseNumber
        : randomStartChapterNumber === randomEndChapterNumber
          ? Math.min(
              bibleReference[randomBookIndex].chapters[
                randomStartChapterNumber
              ],
              randomStartVerseNumber + target.versesNumber
            )
          : randomRange(
              0,
              Math.min(
                bibleReference[randomBookIndex].chapters[
                  randomEndChapterNumber
                ],
                target.versesNumber
              )
            );
    const justRandomAddress: AddressType = {
      bookIndex: randomBookIndex,
      startChapterNum: randomStartChapterNumber,
      endChapterNum: randomEndChapterNumber,
      startVerseNum: randomStartVerseNumber,
      endVerseNum: randomEndVerseNumber
    };
    //call itself to regenerate other random address
    if (exept.find((e) => Address.equals(e, justRandomAddress))) {
      return getRandomAddress(target, exept);
    }
    return justRandomAddress;
  };

  const addressOptions: AddressType[] = [targetPassage.address]; //adding right answer
  for (let i = 0; i < optionsLength - 1; i++) {
    if (Math.random() < probabilityOptionError && uniqueErrorAddresses.length) {
      const selectedErrorItem = randomItem(uniqueErrorAddresses) as AddressType;
      addressOptions.push(selectedErrorItem);
      uniqueErrorAddresses = uniqueErrorAddresses.filter(
        (a) => !Address.equals(a, selectedErrorItem)
      );
    } else if (
      Math.random() < probabilityOptionNeigbor &&
      uniqueNeigborsAddresses.length
    ) {
      const selectedNeigborItem = randomItem(
        uniqueNeigborsAddresses
      ) as AddressType;
      addressOptions.push(selectedNeigborItem);
      uniqueNeigborsAddresses = uniqueNeigborsAddresses.filter(
        (a) => !Address.equals(a, selectedNeigborItem)
      );
    } else {
      addressOptions.push(
        getRandomAddress(targetPassage, [
          targetPassage.address,
          ...uniqueErrorAddresses,
          ...uniqueNeigborsAddresses
        ])
      );
    }
  }
  return {
    ...initialTest,
    // The level is stamped, never inherited (8.2.38). This generator is also
    // L11's fallback for a library too small to offer four verses, and it used to
    // hand back a test still labelled `l11` while carrying an L10 payload -
    // `addressOptions`, never `passagesOptions`. TestsScreen dispatches on `l`,
    // so it rendered L11, which mapped over `undefined` and drew the address with
    // nothing under it. A generator writes the payload, so it owns the label.
    l: TESTLEVEL.l10,
    d: {
      ...initialTest.d,
      addressOptions: [...addressOptions].sort(() =>
        Math.random() > 0.5 ? 1 : -1
      ),
      sentenceRange
    }
  };
};
