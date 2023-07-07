import { AddressType } from 'src/models';

export const addressDistance: (
    address1: AddressType,
    address2: AddressType
) => number = (address1, address2) => {
    return (
        Math.abs(address2.bookIndex - address1.bookIndex) * 100 +
        Math.abs(address2.startChapterNum - address1.startChapterNum) * 10 +
        Math.abs(address2.startVerseNum - address1.startVerseNum)
    );
};
