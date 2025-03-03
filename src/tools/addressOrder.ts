import { AddressType } from "src/models";

export const getAddresOrder:(a: AddressType)=> number = (a) => {
    return a.bookIndex * 20000 + a.startChapterNum * 200 + a.startVerseNum
};