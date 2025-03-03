import { bibleReference } from "src/bibleReference";
import { AddressType } from "src/models";

export const getNumberOfVerses: (adress: AddressType) => number = (address) => {
  //if one verse (end == null || end == start)
  if (
    !address.endChapterNum || !address.endVerseNum ||
    (address.endChapterNum === address.startChapterNum &&
      address.endVerseNum === address.startVerseNum)
  ) {
    return 1;
  }
  //if same chapter but diff verses (endVerse - startVerse)
  if (
    address.endChapterNum === address.startChapterNum &&
    address.endVerseNum !== address.startVerseNum
  ) {
    return Math.abs(address.endVerseNum - address.startVerseNum) + 1;
  }
  //if if next chapter from reference: (from start-verse to the end of start-chapter) + (from start of end-chapter to the end-verse)
  const fromStartingChapter =
    bibleReference[address.bookIndex].chapters[address.startChapterNum] -
    address.startVerseNum +
    1;
  const fromEndingChapter = address.endVerseNum;
  if (Math.abs(address.endChapterNum - address.startChapterNum) === 1) {
    return fromStartingChapter + fromEndingChapter;
  }
  //if diff chapter from reference: (like prev) + (all verses of middle chapters)
  const howManyChaptersBetween =
    Math.abs(address.endChapterNum - address.startChapterNum) - 1;
  if (howManyChaptersBetween > 0) {
    const fromAllChaptersBetween = Array(howManyChaptersBetween)
      .fill(0)
      .map((z, i) => {
        return bibleReference[address.bookIndex].chapters[
          address.startChapterNum + i + 1
        ];
      })
      .reduce((partialSum, a) => partialSum + a, 0);
    return fromStartingChapter + fromAllChaptersBetween + fromEndingChapter;
  }
  console.error(JSON.stringify(address));
  return NaN;
};