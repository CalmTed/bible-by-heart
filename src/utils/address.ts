import { getBookSpellings } from "../addressLanguage";
import { bibleReference } from "../bibleReference";
import { ADDRESS_LANGS, ADDRESSLANG } from "../constants";
import {
  getChapterVerses,
  getTranslationNumbering
} from "../translationNumbering";
import { createAddress } from "../initials";
import { WORD } from "../l10n";
import { AddressType } from "../models";
import { logger } from "./logger";

// Everything an address can do, in one place. Before this the same six
// operations lived in six files named after their verbs (`addressToString`,
// `addressDifference`, `addressOrder`…), which is why a new caller kept adding
// a seventh instead of finding the one it needed. `Address` is a namespace, not
// a class: app state is plain JSON in AsyncStorage and must stay that way, so
// an address never carries methods of its own.

export interface ParsedAddressModel {
  address: AddressType;
  language: ADDRESSLANG | null;
  addressString: string;
}

// chapter:verse patterns (captured group 1), longest form first so a range wins
// over a single verse. Leading optional space so "John 3:16" and "John3:16" both work.
const NUMBER_PATTERN =
  "(\\s?\\d{1,3}:\\d{1,3}-\\d{1,3}:\\d{1,3}|\\s?\\d{1,3}:\\d{1,3}-\\d{1,3}|\\s?\\d{1,3}:\\d{1,3})";

// An abbreviation is usually written with the dot that says it is one - "Jn.
// 3:16", "Ів. 3:16" - and a full title never carries one, so an optional dot
// between the title and the numbers costs nothing and is what the user typed.
// It sits in the matcher rather than in NUMBER_PATTERN because it belongs to
// the title: it is consumed into the matched address string and therefore cut
// out of a shared verse along with the reference.
const ABBREVIATION_DOT = "\\.?";

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// True for unicode letters + digits — used to require a word boundary BEFORE a
// book title (JS `\b` is ASCII-only, so it can't guard Cyrillic titles).
const isWordChar = (ch: string | undefined): boolean =>
  typeof ch === "string" && /[\p{L}\d]/u.test(ch);

// An open end ("John 3:16") means the end is the start. Two spellings of "open"
// reach here: `null`, which is what a persisted address carries because JSON has
// no NaN, and `NaN`, which is what AddressPicker hands around before the end is
// picked. The reducer used to deep-clone its result through JSON on every
// action, so every NaN quietly became null before anything compared it; without
// that clone a just-added single verse would no longer equal its own stored copy.
// Fold both spellings here instead. `Object.is` below rather than `===`, so two
// unpicked addresses (all-NaN, what the picker hands around before a book is
// chosen) still compare equal — what the old JSON.stringify comparison did by
// accident.
const isOpenEnd = (n: number | null): boolean => n === null || isNaN(n);
const endChapter = (a: AddressType): number =>
  isOpenEnd(a.endChapterNum) ? a.startChapterNum : (a.endChapterNum as number);
const endVerse = (a: AddressType): number =>
  isOpenEnd(a.endVerseNum) ? a.startVerseNum : (a.endVerseNum as number);

const format: (address: AddressType, t: (w: WORD) => string) => string = (
  address,
  t
) => {
  if (!address) {
    logger.error(`Addres not defined in Address.format`);
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
    }:${address.startVerseNum + 1}-${(address?.endVerseNum || address.startVerseNum) + 1}`;
  }
  //diff chapter and diff verses
  return `${t(bibleReference[address.bookIndex]?.longTitle)} ${
    address.startChapterNum + 1
  }:${address.startVerseNum + 1}-${(address.endChapterNum || address.startChapterNum) + 1}:${
    (address.endVerseNum || address.startVerseNum) + 1
  }`;
};

// Every spelling the parser will try, with its regex built once. There are
// several hundred of them in the alias table, and they are the same on
// every call - rebuilding them per parse made importing a CSV pay for the whole
// table once per row. Built on the first parse rather than at import, so a boot
// that never parses an address never pays for it at all.
interface BookTitleModel {
  bookIndex: number;
  language: ADDRESSLANG;
  title: string;
  // the title immediately followed by the chapter:verse pattern, anywhere in
  // the text: shared verses usually put the reference after the quote
  matcher: RegExp;
}
let bookTitles: BookTitleModel[] | null = null;
const getBookTitles: () => BookTitleModel[] = () => {
  if (bookTitles === null) {
    // Every language an address may be written in, not every language the
    // interface speaks: a Russian reference has to parse in an English app. The
    // spellings come from `getBookSpellings`, so a language that has no title
    // of its own for a book adds nothing here rather than borrowing English's.
    bookTitles = ADDRESS_LANGS.flatMap((language) =>
      bibleReference.flatMap((book, bookIndex) =>
        getBookSpellings(book, language).map((title) => ({
          bookIndex,
          language,
          title,
          matcher: new RegExp(
            escapeRegExp(title) + ABBREVIATION_DOT + NUMBER_PATTERN,
            "gi"
          )
        }))
      )
    );
  }
  return bookTitles;
};

// The translation the reference is being read for, when there is one. A share
// from another app and an imported CSV both name the address before anything
// knows which translation it belongs to, so the KJV table answers by default -
// and it is also the answer for a translation the user typed themselves, which
// has no numbering of its own to consult.
const parse: (
  string: string,
  sourceId?: string | null
) => ParsedAddressModel | false = (string, sourceId = null) => {
  const numbering = getTranslationNumbering(sourceId);
  const defaultAddress = createAddress();
  // find needed book
  interface BookMatch {
    bookIndex: number;
    language: ADDRESSLANG;
    matchedTitleLength: number;
    justNumbers: string;
    fullAddressString: string;
  }
  const matches: BookMatch[] = [];
  getBookTitles().forEach(({ bookIndex, language, title, matcher }) => {
    // Case-insensitive; the title must sit on a word boundary so book
    // abbreviations don't match inside a longer word. `matchAll` works off a
    // copy of the regex, so a shared one carries no state between calls.
    for (const m of string.matchAll(matcher)) {
      const idx = m.index ?? 0;
      if (isWordChar(string[idx - 1])) {
        continue;
      }
      matches.push({
        bookIndex,
        language,
        matchedTitleLength: title.length,
        justNumbers: m[1],
        fullAddressString: m[0]
      });
      break; // first boundary-valid occurrence is enough
    }
  });
  // Several books can be prefixes of the input (e.g. "Jud"/Jude is a prefix of
  // "Judges"). Pick the most specific match — the one that consumed the longest
  // title — and, on a tie, the one that actually parsed a number. All returned
  // fields then come from that single chosen match (the old code mixed the
  // first-matched bookIndex with the last-matched number slice).
  const bestMatch = [...matches].sort((a, b) => {
    if (b.matchedTitleLength !== a.matchedTitleLength) {
      return b.matchedTitleLength - a.matchedTitleLength;
    }
    return (b.justNumbers ? 1 : 0) - (a.justNumbers ? 1 : 0);
  })[0];

  if (!bestMatch || !bestMatch.justNumbers.length) {
    logger.error(`invalid address book. String: ${string}`);
    return false;
  }
  const bookIndex = bestMatch.bookIndex;
  const justNumbers = bestMatch.justNumbers;
  const language: ADDRESSLANG | null = bestMatch.language;
  const fullAddressString = bestMatch.fullAddressString;
  const part00 = justNumbers.split("-")[0]?.split(":")?.[0];
  const part01 = justNumbers.split("-")[0]?.split(":")?.[1];
  const part10 = justNumbers.split("-")?.[1]?.split(":")?.[0];
  const part11 = justNumbers.split("-")?.[1]?.split(":")?.[1];
  if (!part00 || !part01) {
    logger.error(`invalid address number. String: ${string}`);
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
  // A chapter this translation does not have answers 0 verses, so a reference to
  // one fails here for the same reason the picker draws no button for it: both
  // sides read the one answer.
  const startExists =
    getChapterVerses(numbering, bookIndex, parseInt(chapterStart) - 1) >
    parseInt(verseStart) - 1;
  const endValid =
    (chapterEnd !== null &&
      verseEnd !== null &&
      getChapterVerses(numbering, bookIndex, parseInt(chapterEnd) - 1) >
        parseInt(verseEnd) - 1) ||
    (chapterEnd === null && verseEnd === null);
  if (!startExists || !endValid) {
    logger.error(
      `address does not exists. startExists: ${startExists}. endValid: ${endValid}`
    );
    return false;
  }

  //if unvalid return false
  const filledAddress = {
    ...defaultAddress,
    bookIndex,
    startChapterNum: parseInt(chapterStart) - 1,
    startVerseNum: parseInt(verseStart) - 1,
    endChapterNum: chapterEnd ? parseInt(chapterEnd) - 1 : null,
    endVerseNum: verseEnd ? parseInt(verseEnd) - 1 : null
  } as AddressType;
  return {
    address: filledAddress,
    language,
    addressString: fullAddressString
  };
};

// True when both addresses point at the same verses. The old
// `getAddressDifference` (its name said the opposite of what it returned) filled
// the open ends by ASSIGNING to its arguments — it mutated passage addresses
// straight inside app state on every comparison. This one is pure.
const equals: (a: AddressType, b: AddressType) => boolean = (a, b) =>
  Object.is(a.bookIndex, b.bookIndex) &&
  Object.is(a.startChapterNum, b.startChapterNum) &&
  Object.is(a.startVerseNum, b.startVerseNum) &&
  Object.is(endChapter(a), endChapter(b)) &&
  Object.is(endVerse(a), endVerse(b));

// How far apart two addresses are; book distance dominates, then chapter, then
// verse. 0 means the same starting verse.
const distance: (a: AddressType, b: AddressType) => number = (a, b) =>
  Math.abs(b.bookIndex - a.bookIndex) * 100 +
  Math.abs(b.startChapterNum - a.startChapterNum) * 10 +
  Math.abs(b.startVerseNum - a.startVerseNum);

// Sortable position of an address in the Bible.
const order: (a: AddressType) => number = (a) =>
  a.bookIndex * 20000 + a.startChapterNum * 200 + a.startVerseNum;

/**
 * How many verses the address spans, counted in the numbering of the
 * translation it is written in - a span that crosses a chapter boundary has to
 * know where that chapter ends, and the five bundled translations disagree.
 * `sourceId` is asked for rather than optional so that every caller has to say
 * which translation it means; `null` is a real answer (the KJV table) for a
 * passage that has no translation yet.
 */
const versesCount: (
  address: AddressType,
  sourceId: string | null | undefined
) => number = (address, sourceId) => {
  //if one verse (end == null || end == start)
  if (
    !address.endChapterNum ||
    !address.endVerseNum ||
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
  const numbering = getTranslationNumbering(sourceId);
  //if if next chapter from reference: (from start-verse to the end of start-chapter) + (from start of end-chapter to the end-verse)
  const fromStartingChapter =
    getChapterVerses(numbering, address.bookIndex, address.startChapterNum) -
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
      .map((z, i) =>
        getChapterVerses(
          numbering,
          address.bookIndex,
          address.startChapterNum + i + 1
        )
      )
      .reduce((partialSum, a) => partialSum + a, 0);
    return fromStartingChapter + fromAllChaptersBetween + fromEndingChapter;
  }

  logger.error(
    `Unable to get number of verses. Address: ${JSON.stringify(address)}`
  );
  return NaN;
};

/**
 * Whether the address names a verse at all — an open end is fine, an unpicked
 * start is not. It is what "can this passage's text be asked for" comes down
 * to, and it was written out by hand at each of the three places that asked.
 * `NaN` counts as unpicked for the same reason `equals` treats it as an open
 * end: the picker uses it for "not chosen yet".
 */
const isComplete: (address: AddressType) => boolean = (address) =>
  address.bookIndex !== null &&
  !isNaN(address.bookIndex) &&
  address.startChapterNum !== null &&
  !isNaN(address.startChapterNum) &&
  address.startVerseNum !== null &&
  !isNaN(address.startVerseNum);

export const Address = {
  /** Human-readable reference, in the caller's language ("John 3:16"). */
  format,
  /** True when the address names a verse; an open end still counts. */
  isComplete,
  /**
   * Reads an address out of arbitrary text; `false` when there is none. Takes
   * the translation's `sourceId` where the caller knows it, so the reference is
   * validated against that translation's own chapters and verses.
   */
  parse,
  /** True when both addresses point at the same verses. Pure. */
  equals,
  /** Rough distance between two addresses — book, then chapter, then verse. */
  distance,
  /** Sortable position in the Bible. */
  order,
  /**
   * How many verses the address spans, in the numbering of the translation it
   * is written in. Takes the `sourceId` for the same reason `parse` does.
   */
  versesCount
};
