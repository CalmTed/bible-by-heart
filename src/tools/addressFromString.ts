import { bibleReference } from "../bibleReference";
import { LANGCODE } from "../constants";
import { createAddress } from "../initials";
import { createT } from "../l10n";
import { AddressType } from "../models";

export const addressFromString: (string: string) => AddressType | false = (string) => {
  const defaultAddress = createAddress();
  // find needed book
  let justNumbers:string = ""
  const bookIndex = Object.values(LANGCODE).map(langcode => {
    const t = createT(langcode);
    return bibleReference.map((book,i) => {
      if(string.includes(t(book.longTitle)) || string.includes(t(book.titleShort))){
        justNumbers = string.replace(t(book.longTitle), "").replace(t(book.titleShort), "").trim()
        return i;
      }
      return -1;
    })
  }).flat().filter(b => b !== -1)[0]
  //TODO: consider multiple matches
  
  if(!justNumbers.length){
    console.warn("invalid address book")
    return false
  }
  const chapterStart = justNumbers.split("-")[0]?.split(":")?.[0] ?? null
  const verseStart = justNumbers.split("-")[0]?.split(":")?.[1] ?? null
  const chapterEnd = justNumbers.split("-")?.[1]?.split(":")?.[0] ?? null
  const verseEnd = justNumbers.split("-")?.[1]?.split(":")?.[1] ?? null
  if(chapterStart === null || verseStart === null){
    console.warn("invalid address number")
    return false;
  }
  // validate chapter and verses
  const startExists = bibleReference[bookIndex].chapters?.[parseInt(chapterStart)-1] > parseInt(verseStart)-1
  const endValid = chapterEnd === null ||  bibleReference[bookIndex].chapters?.[parseInt(chapterEnd)-1] > parseInt(verseEnd)-1
  if(!startExists || !endValid){
    console.warn("address does not exists", startExists, endValid)
    return false;
  }

  //if unvalid return false
  const filledAddress = {
    ...defaultAddress,
    bookIndex,
    startChapterNum: parseInt(chapterStart)-1,
    startVerseNum: parseInt(verseStart)-1,
    endChapterNum: chapterEnd ? parseInt(chapterEnd)-1: chapterEnd,
    //INFO: chapterEnd in verseEnd is not an error, if we dont have end chapter we dont care if end verse exists
    endVerseNum: chapterEnd ? parseInt(verseEnd)-1: chapterEnd
  } as AddressType
  return filledAddress
}