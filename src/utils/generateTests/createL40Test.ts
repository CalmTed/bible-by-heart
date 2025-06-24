import { FIRST_FEW_WORDS, PERFECT_TESTS_TO_PROCEED, SENTENCE_SEPARATOR } from "src/constants";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { CreateTestMethodModel } from "./createL10Test";
import { ErrorGradedWord, getWordsFromErrors } from "./getWordsFromErrors";
import { getErrorGradedSentences } from "./getErrorGradedSentences";
import { randomItem, randomRange } from "../randomizers";
import { TestModel } from "src/models";

export const getRandomSentencesRange: (
  sentences:string[], 
  wordsFromErrors: ErrorGradedWord[],
  minNumberOfSentences?: number
) => number[] = (sentences, wordsFromErrors, minNumberOfSentences = 0) => {
    
    if(sentences.length === 1){
        return []
    }

    //if 2 than only select 0-1 sentence
    //if 3 or more than select 0-2 
    const numberOfSentencesToSelect = sentences.length === 2 ? randomRange(minNumberOfSentences,1) : randomRange(minNumberOfSentences,2);
    if(numberOfSentencesToSelect === 0){
        return []
    }
    const errorGradedSentences = getErrorGradedSentences(sentences, wordsFromErrors)

    // first "-1" because it's index
    // second "-1" because if we select one sentence to write we can select last one
    const rangeUpperEnd = sentences.length === 2 ? 1 : sentences.length - 1 - (numberOfSentencesToSelect)
    
    //so [0,1,2] turns to [0,1,1,1,2,2] so 1 and 2 have more popbability to be selected 
    let sentansesBasedOfErrorNumber: number[] = []
    //couldnt think for the easier way to do it linearly
    for(let i = 0; i <= rangeUpperEnd; i++){
      const item = errorGradedSentences.filter(j => j.sentenceIndex === i)[0]
      sentansesBasedOfErrorNumber = [...sentansesBasedOfErrorNumber, ...new Array(item.errorRate + 1).fill(item.sentenceIndex)]
    }
    const sentenceIndexToStart = randomItem(sentansesBasedOfErrorNumber) as number
    
    const from = sentenceIndexToStart;
    const to = sentenceIndexToStart + numberOfSentencesToSelect;

    return [from, to]
}

export const createL40Test: CreateTestMethodModel = ({ initialTest, passages, history }) => {
    //geting answer
    const targetPassage = passages.find(p => p.id === initialTest.pi)
    if(!targetPassage){
      return initialTest;
    }
    //geting success stroke to define difficulty
    const successStroke = getPerfectTestsNumber(history, targetPassage);
    
    //spliting to sentences
    const sentences = targetPassage ? targetPassage.verseText.split(SENTENCE_SEPARATOR).filter(s => s.length > 1) : undefined
    if(!sentences){
      return initialTest
    }
    //getting data to repeat hardest parts
    const wordsFromErrors = getWordsFromErrors(history, initialTest.pi)
    
    //if its promotion test then need to enter the whole passage
    const sentenceRange = successStroke >= PERFECT_TESTS_TO_PROCEED -1 ? [] : getRandomSentencesRange(sentences, wordsFromErrors)
    
    return {
      ...initialTest,
      d: {
        ...initialTest.d,
        //show first words instead of address only if there are more then 4 words
        showAddressOrFirstWords: targetPassage.verseText.split(" ").length > FIRST_FEW_WORDS ? Math.random() > 0.5 : true,
        sentenceRange
      }
    } as TestModel;
  };