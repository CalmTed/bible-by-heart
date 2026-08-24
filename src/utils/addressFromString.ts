import { bibleReference } from "../bibleReference";
import { LANGCODE } from "../constants";
import { createAddress } from "../initials";
import { createT } from "../l10n";
import { AddressType } from "../models";
import { bookAliases } from "./bookAliases";
import { logger } from "./logger";

interface addressToStringReturnType {
  address: AddressType;
  language: LANGCODE | null;
  addressString: string;
}

// chapter:verse patterns (captured group 1), longest form first so a range wins
// over a single verse. Leading optional space so "John 3:16" and "John3:16" both work.
const NUMBER_PATTERN =
  "(\\s?\\d{1,3}:\\d{1,3}-\\d{1,3}:\\d{1,3}|\\s?\\d{1,3}:\\d{1,3}-\\d{1,3}|\\s?\\d{1,3}:\\d{1,3})";

const escapeRegExp = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// True for unicode letters + digits — used to require a word boundary BEFORE a
// book title (JS `\b` is ASCII-only, so it can't guard Cyrillic titles).
const isWordChar = (ch: string | undefined): boolean =>
  typeof ch === "string" && /[\p{L}\d]/u.test(ch);

const addressFromString: (
  string: string
) => addressToStringReturnType | false = (string) => {
  const defaultAddress = createAddress();
  // find needed book
  interface BookMatch {
    bookIndex: number;
    language: LANGCODE;
    matchedTitleLength: number;
    justNumbers: string;
    fullAddressString: string;
  }
  const matches: BookMatch[] = [];
  Object.values(LANGCODE).forEach((langcode) => {
    const t = createT(langcode);
    bibleReference.forEach((book, i) => {
      // Candidates: the localized long + short titles PLUS any per-language
      // aliases (abbreviations / spelling variants) for this book (8.1.5).
      const candidateTitles = [
        t(book.longTitle),
        t(book.titleShort),
        ...(bookAliases[book.longTitle]?.[langcode] ?? [])
      ];
      candidateTitles.forEach((title) => {
        // Find the address ANYWHERE in the text (shared verses usually put the
        // reference after the quote): a title immediately followed by the
        // chapter:verse pattern. Case-insensitive; the title must sit on a word
        // boundary so book abbreviations don't match inside a longer word.
        const re = new RegExp(escapeRegExp(title) + NUMBER_PATTERN, "gi");
        for (const m of string.matchAll(re)) {
          const idx = m.index ?? 0;
          if (isWordChar(string[idx - 1])) {
            continue;
          }
          matches.push({
            bookIndex: i,
            language: langcode,
            matchedTitleLength: title.length,
            justNumbers: m[1],
            fullAddressString: m[0]
          });
          break; // first boundary-valid occurrence is enough
        }
      });
    });
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
  const language: LANGCODE | null = bestMatch.language;
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
  const startExists =
    bibleReference[bookIndex].chapters?.[parseInt(chapterStart) - 1] >
    parseInt(verseStart) - 1;
  const endValid =
    (chapterEnd !== null &&
      verseEnd !== null &&
      bibleReference[bookIndex].chapters?.[parseInt(chapterEnd) - 1] >
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

export default addressFromString;
