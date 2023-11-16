import { AddressType, PassageModel } from "src/models";

export const getAddressDifference = (a: AddressType, b: AddressType) => {
  if (a.bookIndex !== b.bookIndex) {
    return a.bookIndex - b.bookIndex;
  }
  if (a.startChapterNum !== b.startChapterNum) {
    return a.startChapterNum - b.startChapterNum;
  }
  if (a.startVerseNum !== b.startVerseNum) {
    return a.startVerseNum - b.startVerseNum;
  }
  return 0;
};