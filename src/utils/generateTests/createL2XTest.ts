import { CreateTestMethodModel } from "./createL10Test";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { MINIMUM_SENTENCE_LENGTH } from "../../constants";
import { Passage } from "../passage";
import { randomRange } from "../randomizers";

export const createL20Test: CreateTestMethodModel = ({
  initialTest,
  history,
  passages
}) => {
  const targetPassage = passages.filter((p) => p.id === initialTest.pi)[0];
  const successStroke = getPerfectTestsNumber(history, targetPassage);

  const sentaces = Passage.getSentences(targetPassage.verseText);
  const sentenceRangeStart =
    sentaces.length > 1 ? randomRange(0, sentaces.length - 1) : 0;
  const sentenceRangeEnd =
    sentaces.length > 1
      ? randomRange(sentenceRangeStart, sentaces.length)
      : sentaces.length;

  const sentenceRange =
    successStroke &&
    Passage.joinSentences(sentaces.slice(sentenceRangeStart, sentenceRangeEnd))
      .length >= MINIMUM_SENTENCE_LENGTH
      ? [sentenceRangeStart, sentenceRangeEnd]
      : [];
  return {
    ...initialTest,
    d: {
      sentenceRange
    }
  };
};

export const createL21Test: CreateTestMethodModel = ({ initialTest }) => {
  return initialTest;
};
