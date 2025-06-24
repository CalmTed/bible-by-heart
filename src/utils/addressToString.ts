import { bibleReference } from "../bibleReference";
import { WORD } from "../l10n";
import { AddressType } from "../models";
import { logger } from "./logger";

const addressToString: (
  address: AddressType,
  t: (w: WORD) => string
) => string = (address, t) => {
  if (!address) {
    logger.error(`Addres not defined in addressToString`)
    return "-";
  }
  //empty
  if (
    address.bookIndex === null ||
    !address.startChapterNum === null ||
    !address.startVerseNum === null ||
    isNaN(address.bookIndex) ||
    isNaN(address.startChapterNum) ||
    isNaN(address.startVerseNum)
  ) {
    return `-`;
  }
  //just one verse
  if (
    (!address.endChapterNum && !address.endVerseNum) ||
    (address.startChapterNum === address.endChapterNum &&
      address.startVerseNum === address.endVerseNum)
  ) {
    return `${t(bibleReference[address.bookIndex]?.longTitle)} ${
      address.startChapterNum + 1
    }:${address.startVerseNum + 1}`;
  }
  //the same chapter
  if (
    address.startChapterNum === address.endChapterNum &&
    address.startVerseNum !== address.endVerseNum
  ) {
    return `${t(bibleReference[address.bookIndex]?.longTitle)} ${
      address.startChapterNum + 1
    }:${address.startVerseNum + 1}-${(address?.endVerseNum || address.startVerseNum ) + 1}`;
  }
  //diff chapter and diff verses
  return `${t(bibleReference[address.bookIndex]?.longTitle)} ${
    address.startChapterNum + 1
  }:${address.startVerseNum + 1}-${(address.endChapterNum || address.startChapterNum) + 1}:${
    (address.endVerseNum || address.startVerseNum) + 1
  }`;
};

export default addressToString;
