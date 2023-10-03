import { PassageModel } from "src/models";

export const getAddressDifference = (a: PassageModel, b: PassageModel) => {
  if (a.address.bookIndex !== b.address.bookIndex) {
    return a.address.bookIndex - b.address.bookIndex;
  }
  if (a.address.startChapterNum !== b.address.startChapterNum) {
    return a.address.startChapterNum - b.address.startChapterNum;
  }
  if (a.address.startVerseNum !== b.address.startVerseNum) {
    return a.address.startVerseNum - b.address.startVerseNum;
  }
  return 0;
};