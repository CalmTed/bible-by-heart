import { bibleReference } from "../bibleReference";
import { WORD } from "../l10n";
import { AddressType } from "../models";

const addressToString: (address: AddressType, t: (w: WORD) => string) => string = (address, t) => {
  if(!address){
    console.error("Addres not defined")
    return "-";
  }
  //empty
  if(address.bookIndex === null || !address.startChapterNum === null || !address.startVerseNum === null || isNaN(address.bookIndex) || isNaN(address.startChapterNum) || isNaN(address.startVerseNum)){
    return `-`;
  }
  //just one verse
  if((!address.endChapterNum && !address.endVerseNum) || (address.startChapterNum === address.endChapterNum && address.startVerseNum ===address.endVerseNum)){
    return `${t(bibleReference[address.bookIndex]?.longTitle as WORD)} ${address.startChapterNum + 1}:${address.startVerseNum + 1}`;
  }
  //the same chapter
  if(address.startChapterNum === address.endChapterNum && address.startVerseNum !== address.endVerseNum){
    return `${t(bibleReference[address.bookIndex]?.longTitle as WORD)} ${address.startChapterNum + 1}:${address.startVerseNum + 1}-${address.endVerseNum + 1}`;
  }
  //diff chapter and diff verses
  return `${t(bibleReference[address.bookIndex]?.longTitle as WORD)} ${address.startChapterNum + 1}:${address.startVerseNum + 1}-${address.endChapterNum + 1}:${address.endVerseNum + 1}`;
}

export default addressToString;