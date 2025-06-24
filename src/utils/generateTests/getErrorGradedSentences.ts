import { ErrorGradedWord } from "./getWordsFromErrors";

export const getErrorGradedSentences: (sentences: string[], wordsFromErrors: ErrorGradedWord[]) => {sentenceIndex: number, errorRate: number}[] = (sentences, wordsFromErrors) => {
    return [...sentences.map((s,i, arr) => {
      //number of words in the prevous sentences
      const wordIndexMargin = i === 0 ? 0 : arr.slice(0,i).join("").trim().split(" ").length;
      const wordIndexWidth = wordIndexMargin + s.trim().split(" ").length - (i === 0 ? 0 : 1);
      const errorRate = wordsFromErrors.filter(wfe => wfe.index >= wordIndexMargin && wfe.index < wordIndexWidth).map(wfe => wfe.times).flat().reduce((partialSum, w) => partialSum + w, 0)
      return {
        sentenceIndex: i,
        errorRate: errorRate
      }
    })].sort((a,b) => b.errorRate - a.errorRate)
  }