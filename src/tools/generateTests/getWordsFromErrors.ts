import { TestModel } from "src/models"

export interface ErrorGradedWord {
    index: number
    string: string
    times: number
}

export const getWordsFromErrors: (history: TestModel[], passageId: number) => ErrorGradedWord[] = (history, passageId) => {
    return [...history
      .filter(
        (t) =>
          t.pi === passageId 
          && t.ww.length > 0
      )
      .map((t) => t.ww)
      .flat()
      .map((w,i, arr) => {
        return {
          index: w[0],
          string: w[1],
          times: arr.filter( arrW => arrW[0] === w[0] && arrW[1] === w[1]).length
        }
      })
      // getting unique 
      .filter((w,i,arr) => 
        arr.slice(0, i+1).filter(arrW => arrW.index === w.index && arrW.string === w.string).length === 1
      )]
      //soring by most popular
      .sort((a,b) => b.times - a.times)
  }