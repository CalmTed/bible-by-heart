import { MINIMUM_SENTENCE_LENGTH, PERFECT_TESTS_TO_PROCEED, SENTENCE_SEPARATOR } from "src/constants";
import { getPerfectTestsNumber } from "../getPerfectTests";
import { CreateTestMethodModel } from "./createL10Test";
import { getWordsFromErrors } from "./getWordsFromErrors";
import { randomRange } from "../randomizers";
import { getSimularity } from "../getSimularity";
import { getRandomSentencesRange } from "./createL40Test";

const getWordsFromPassage = (text: string) => {
  return text
  .replace(/ {2,3}/g, " ")
  .trim()
  .split(" ");
}
const getSentencesFromPassage = (text: string) => {
  return text
  .split(SENTENCE_SEPARATOR)
  .filter(s => s.length > 1);
}

export const createL30Test: CreateTestMethodModel = ({
    initialTest,
    passages,
    history
  }) => {
    const targetPassage = passages.find((p) => p.id === initialTest.pi);
    if (!targetPassage) {
      return initialTest;
    }
    
    const words = getWordsFromPassage(targetPassage.verseText)

    if (!words.length) {
      return initialTest;
    }
    const successStroke = getPerfectTestsNumber(history, targetPassage);
    const sentences = getSentencesFromPassage(targetPassage.verseText)
    const wordsFromErrors = getWordsFromErrors(history, initialTest.pi)
    let missingWords: number[] = [];
    if(successStroke === PERFECT_TESTS_TO_PROCEED) { //last time before next level
      //add all words
      missingWords = words.map((w, i) => i);
    }else{
      if(
        sentences.length > 2 
        && successStroke !== 0 
        && sentences.join().length > MINIMUM_SENTENCE_LENGTH
        && Math.random() > 0.3
      ){
        //IF there are several sentences THEN add one or two to missing
        if(Math.random() > 0.5 ){
          //adding random range of sentences
          const [startingSentanseIndex, endingSentenceIndex] = getRandomSentencesRange(sentences, wordsFromErrors, 1)
          
          const firstWordIndexOffset = startingSentanseIndex === 0 ? 0 :  getWordsFromPassage(sentences.slice(0, startingSentanseIndex).join("")).length
          missingWords = getWordsFromPassage(
            sentences.slice(startingSentanseIndex, endingSentenceIndex).join("")
          )
          //getting indexes of all the words, considering posible offset
          .map((v,i) => i + firstWordIndexOffset)
          console.log(sentences.length, startingSentanseIndex, endingSentenceIndex)
          
        }else{
          //adding random isle of words
          const numberOfNeigbors = Math.random() > 0.5 ? 0 : 1;
          const randomIndexToAdd = randomRange(0, Math.min(1, sentences.length - numberOfNeigbors))
          const startingWordIndexStart = randomIndexToAdd === 0 ? 0 : getWordsFromPassage(sentences.slice(0,randomIndexToAdd).join("")).length;
          const wordsNumber = getWordsFromPassage(sentences[randomIndexToAdd]).length || 1 //+ (sentences[randomIndexToAdd + numberOfNiegbors]?.trim()?.split(" ")?.length || 0)
          missingWords = Array(wordsNumber).fill(0).map((v,i) => i + startingWordIndexStart)
        }
      }else{
        //Just words
        //number of seed words 1..2%(min 3) OR 3..5%(min 7)
        const numberOfSeeds = successStroke > 0 ? randomRange(1,Math.max(7, Math.floor(words.length / 20))) : randomRange(2, Math.max(3, Math.floor(words.length / 50)))
        Array(numberOfSeeds).fill(0).map((v,i) => {
          const wordsAfter = randomRange(0, 2)
          const wordsBefore = randomRange(0, 2)
          if(wordsFromErrors.filter(wfe => !missingWords.includes(wfe.index)).length && Math.random() > 0.5){//50% chance if there are some errors
            //seed from errors
            const randomNumber = randomRange(0, wordsFromErrors.reduce((ps,w) => ps + w.times,0))
            const biasedRandomWord = wordsFromErrors
              .filter((s,i,arr) => {
                arr.slice(0,i).reduce((ps,r) => ps + r.times,0) >= randomNumber
                }
              )[0] || wordsFromErrors[0]
            const wordsToAdd = words
            .map((w,i) =>{
              return {
                word: w,
                index: i
              }
            })
            .filter((w) => {
              return w.index >= biasedRandomWord.index - wordsBefore && w.index <= biasedRandomWord.index + wordsAfter
            })
            .map(w => w.index)
            .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
            missingWords.push(
              ...wordsToAdd
            )
          }else if(Math.random() > 0.5){//25%
            //just random words and neigbors
            const randomNumber = randomRange(0, words.length)
            const wordsToAdd = words
            .map((w,i) =>{
              return {
                word: w,
                index: i
              }
            })
            .filter((w) => {
              return w.index >= randomNumber - wordsBefore && w.index <= randomNumber + wordsAfter
            })
            .map(w => w.index)
            .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
            missingWords.push(
              ...wordsToAdd
            )
          }else{//25%
            //random seed and simular words
            const randomNumber = randomRange(0, words.length)
            const targetWord = words[randomNumber]
            const mostSimularWords = [...words
              .map((w, ind) => 
                [ind, getSimularity(w, targetWord)])
              .filter((w) => w[1] < 1)]
              .sort((a, b) => b[1] - a[1]);
            const wordsToAdd = [
              randomNumber,
              ...mostSimularWords.slice(0,wordsBefore + wordsAfter).map(w => w[0])
            ]
            .filter(w => words[w] && missingWords.filter(mw => mw === w).length === 0)
            missingWords.push(
              ...wordsToAdd
            )
          }
        })
      }
    }
    const alphabeticalMissingWords = [...missingWords].sort((a, b) =>
      ("" + words[a]).localeCompare(words[b])
    );
    return {
      ...initialTest,
      d: {
        ...initialTest.d,
        missingWords: alphabeticalMissingWords 
      }
    };
  };