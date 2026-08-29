import { FIRST_FEW_WORDS, LANGCODE } from "../constants";
import { AddressType, PassageModel, TranslationModel } from "../models";
import { Address } from "./address";

// Everything the app knows about the TEXT of a passage (8.2.6). Splitting a
// verse into sentences used to be written inline in nine places — five level
// components and four test generators — with four different filters
// (`s.length`, `> 0`, `> 1`, `> 2`) and three different joins. That is worse
// than duplication: the generator counted the sentences one way and stored a
// `sentenceRange` that the level component then resolved another way, so the
// two could disagree about which sentence index 2 is. There is one definition
// here now, and both sides call it.
//
// Like `Address`, this is a namespace and not a class — app state is plain JSON
// in AsyncStorage, so a passage never carries methods of its own.

// A sentence is a run of text up to and INCLUDING its closing punctuation, so
// `getSentences(text)` loses nothing and the pieces can be joined back into
// readable text. The old `SENTENCE_SEPARATOR` split threw the punctuation away,
// which is why a sliced passage used to be shown as "sentence one,sentence two".
// Written as a match rather than a lookbehind split on purpose: Hermes has no
// lookbehind assertions.
const SENTENCE_PATTERN = /[^.!?;]+[.!?;]*/g;

const getSentences: (text: string) => string[] = (text) =>
  (text.match(SENTENCE_PATTERN) ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

// Sentences are stored trimmed, so joining them back needs the space returned.
const joinSentences: (sentences: string[]) => string = (sentences) =>
  sentences.join(" ");

const hasRange: (range?: number[]) => range is number[] = (
  range
): range is number[] => !!range && range.length === 2;

// The text a `sentenceRange` actually refers to — what the user has to recall.
// No range (or a `[]`, which is how the generators say "the whole thing") means
// the whole passage.
const getRangeText: (text: string, range?: number[]) => string = (
  text,
  range
) => {
  if (!hasRange(range)) {
    return text;
  }
  return joinSentences(getSentences(text).slice(range[0], range[1]));
};

// The same slice for READING rather than recalling: leading/trailing "..." say
// that the passage continues outside the range.
const getRangeDisplayText: (text: string, range?: number[]) => string = (
  text,
  range
) => {
  if (!range?.length) {
    return text;
  }
  const sentences = getSentences(text);
  const start = range[0] || 0;
  const end = range[1] || sentences.length;
  return `${start === 0 ? "" : "..."}${joinSentences(
    sentences.slice(start, end)
  )}${end === sentences.length ? "" : "..."}`;
};

// The few sentences on either side of the range — the context L40/L50 show
// around the part being typed. `truncated` means more was left out, i.e. the
// caller should draw an ellipsis on that side.
export interface SentenceContextModel {
  text: string;
  truncated: boolean;
}

const getContextBefore: (
  text: string,
  range: number[] | undefined,
  maxSentences: number
) => SentenceContextModel | null = (text, range, maxSentences) => {
  if (!hasRange(range) || range[0] <= 0) {
    return null;
  }
  const truncated = range[0] > maxSentences;
  const from = truncated ? range[0] - maxSentences : 0;
  return {
    text: joinSentences(getSentences(text).slice(from, range[0])),
    truncated
  };
};

const getContextAfter: (
  text: string,
  range: number[] | undefined,
  maxSentences: number
) => SentenceContextModel | null = (text, range, maxSentences) => {
  const sentences = getSentences(text);
  if (!hasRange(range) || range[1] >= sentences.length) {
    return null;
  }
  return {
    text: joinSentences(
      sentences.slice(
        range[1],
        Math.min(range[1] + maxSentences, sentences.length)
      )
    ),
    truncated: sentences.length - range[1] >= maxSentences
  };
};

// The words of a passage, as the word INDEXES stored in tests mean them: runs of
// whitespace collapse, so index N is the same word for the generator that picks
// missing words and for the level component that renders them. (They disagreed
// before: the generator collapsed spaces, the renderer did not.)
const getWords: (text: string) => string[] = (text) => {
  const normalized = text.replace(/\s{2,}/g, " ").trim();
  return normalized.length ? normalized.split(" ") : [];
};

// The opening of a passage, used as the prompt when a level shows the first
// words instead of the address. Keeps the trailing space — the user types on.
const getFirstWords: (text: string, count?: number) => string = (
  text,
  count = FIRST_FEW_WORDS
) => text.split(" ").slice(0, count).join(" ") + " ";

const getVersesCount: (address: AddressType) => number = (address) =>
  Address.versesCount(address);

// How many verses of the library are in an English translation — the number the
// ESV licence cares about (its cap is per user, not per passage).
const countEnglishVerses: (
  translations: TranslationModel[],
  passages: PassageModel[]
) => number = (translations, passages) => {
  const translationsInEnglish = translations
    .filter((tr) => tr.addressLanguage === LANGCODE.en)
    .map((tr) => tr.id);
  return passages
    .filter(
      (p) =>
        p.verseTranslation && translationsInEnglish.includes(p.verseTranslation)
    )
    .map((p) => Address.versesCount(p.address))
    .reduce((ps, num) => ps + num, 0);
};

export const Passage = {
  /** Sentences of a passage, punctuation kept, trimmed, empties dropped. */
  getSentences,
  /** Joins sentences back into readable text. */
  joinSentences,
  /** The text a stored `sentenceRange` points at; whole passage when unset. */
  getRangeText,
  /** The same slice with "..." marking what is outside it. */
  getRangeDisplayText,
  /** Up to N sentences before the range, for context. */
  getContextBefore,
  /** Up to N sentences after the range, for context. */
  getContextAfter,
  /** Words as the stored word indexes mean them (whitespace collapsed). */
  getWords,
  /** The first few words, trailing space kept. */
  getFirstWords,
  /** How many verses this passage's address spans. */
  getVersesCount,
  /** Verses of the library held in an English translation. */
  countEnglishVerses
};
