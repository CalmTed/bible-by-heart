import { bibleReference } from "../bibleReference";
import { LANGCODE } from "../constants";
import { createAddress } from "../initials";
import { createT } from "../l10n";
import { AddressType } from "../models";

interface addressToStringReturnType {
  address: AddressType
  language: LANGCODE | null
  addressString: string
}

export const addressFromString: (string: string) => addressToStringReturnType | false = (string) => {
  const defaultAddress = createAddress();
  // find needed book
  let justNumbers = "";
  let fullAddressString = "";
  let language: LANGCODE | null  = null
  const bookIndex = Object.values(LANGCODE).map(langcode => {
    const t = createT(langcode);
    return bibleReference.map((book,i) => {
      if(string.includes(t(book.longTitle)) || string.includes(t(book.titleShort))){
        const justBook = string.includes(t(book.longTitle)) ? t(book.longTitle) : t(book.titleShort);
        const afterBookText = string.substring(string.indexOf(justBook)+justBook.length, string.indexOf(justBook)+justBook.length+15)
        justNumbers = afterBookText.match(/(\s{0,1}\d{1,3}:\d{1,3}-\d{1,3}:\d{1,3}|\s{0,1}\d{1,3}:\d{1,3}-\d{1,3}|\s{0,1}\d{1,3}:\d{1,3})/)?.[0] || ""
        fullAddressString = justNumbers ? justBook+justNumbers : fullAddressString;
        language = langcode
        return i;
      }
      return -1;
    });
  }).flat().filter(b => b !== -1)[0];
  //TODO: consider multiple matches
  
  if(!justNumbers.length){
    console.warn("invalid address book", string)
    return false
  }
  const part00 = justNumbers.split("-")[0]?.split(":")?.[0]
  const part01 = justNumbers.split("-")[0]?.split(":")?.[1]
  const part10 = justNumbers.split("-")?.[1]?.split(":")?.[0]
  const part11 = justNumbers.split("-")?.[1]?.split(":")?.[1]
  if(!part00 || !part01){
    console.warn("invalid address number")
    return false;
  }
  //option 1:1
  // const justOneVerse = !!part00 && !!part01 && !part10 && !part11
  //option 1:1-2
  const justEndVerse = !!part00 && !!part01 && !!part10 && !part11;
  //option 1:1-2:1
  const allParts = !!part00 && !!part01 && !!part10 && !!part11;

  const chapterStart = part00;
  const verseStart = part01;
  const chapterEnd = allParts ? part10 : justEndVerse ? chapterStart : null;
  const verseEnd = allParts ? part11 : justEndVerse ? part10 : null;
  // validate chapter and verses
  const startExists = bibleReference[bookIndex].chapters?.[parseInt(chapterStart)-1] > parseInt(verseStart)-1;
  const endValid = (chapterEnd !== null && verseEnd !== null &&  bibleReference[bookIndex].chapters?.[parseInt(chapterEnd)-1] > parseInt(verseEnd)-1) || (chapterEnd === null && verseEnd === null);
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
    endVerseNum: verseEnd ? parseInt(verseEnd)-1: chapterEnd
  } as AddressType
  return {
    address: filledAddress,
    language,
    addressString: fullAddressString
  }
}