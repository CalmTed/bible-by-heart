import { CreateTestMethodModel } from "./createL10Test";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { MINIMUM_SENTENCE_LENGTH, SENTENCE_SEPARATOR } from "src/constants";
import { randomRange } from "../randomizers";

export const createL20Test: CreateTestMethodModel = ({ initialTest, history, passages }) => {
  const targetPassage = passages.filter(p => p.id === initialTest.pi)[0];
  const successStroke = getPerfectTestsNumber(history, targetPassage);

  const sentaces = targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length)
  const sentenceRangeStart = sentaces.length > 1 ? randomRange(0, sentaces.length-1) : 0;
  const sentenceRangeEnd = sentaces.length > 1 ? randomRange(sentenceRangeStart, sentaces.length) : sentaces.length;

  const sentenceRange = 
    successStroke
    && sentaces.slice(sentenceRangeStart, sentenceRangeEnd).join().length >= MINIMUM_SENTENCE_LENGTH 
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