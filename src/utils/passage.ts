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

// Two words the user may treat as the same one (8.2.26). L3 hands back words
// from a bank, and "good." at the end of a sentence and "good" in the middle of
// it are the same word to read and the same word to type - so tapping either
// must answer either. Only the letters and digits count; punctuation and case
// do not. Deliberately NOT a similarity score: this is equality of the letters,
// so a misspelling is still wrong (that tolerance is L5's, 8.2.7).
const LETTERS_PATTERN = /[^\p{L}\p{N}]/gu;

const sameWord: (a: string, b: string) => boolean = (a, b) => {
  const letters = (w: string) => w.replace(LETTERS_PATTERN, "").toLowerCase();
  const left = letters(a);
  // two words with no letters at all ("-" and "...") are not "the same word"
  return !!left && left === letters(b);
};

// ---------------------------------------------------------------------------
// Typing tolerance (8.2.7)
//
// Level 5 grades the passage CHARACTER BY CHARACTER, so a character the phone
// keyboard cannot produce makes a passage unlearnable: the user types the only
// thing they can type and is told they are wrong, forever. 8.1.4 folds these on
// the way IN (shared text) and 8.2.11 folds them at the API, but neither reaches
// a passage already sitting in somebody's state, and nothing may rewrite their
// text behind their back. So the tolerance lives on the COMPARISON - both sides
// are folded to what a keyboard can reach before they are compared.
//
// Every entry is [what the keyboard produces, the characters that look exactly
// like it]. Written as \uXXXX escapes, like the table in
// `sanitizeSharedText.ts` folds them the other way: half of these are
// invisible in an editor (nbsp, thin space) and the other half are invisible ON
// PURPOSE - a Cyrillic "a" next to a Latin "a" in source is the very confusion
// this table exists to forgive.
//
// STRICTLY 1:1 - folding must not change the length of the string, because
// `typedPrefixLength` maps an index in the folded text back to an index in the
// real one. The ellipsis is what that rules out (it would become three dots), so
// it is dropped as punctuation instead - see IGNORED_PUNCTUATION.
const TYPING_EQUIVALENTS: [plain: string, lookalikes: string][] = [
  // hyphen, non-breaking hyphen, figure dash, en dash, em dash, horizontal bar,
  // minus sign
  ["-", "\u2010\u2011\u2012\u2013\u2014\u2015\u2212"],
  // curly double quotes, low, high-reversed, guillemets (Ukrainian typography),
  // double prime
  ['"', "\u201C\u201D\u201E\u201F\u00AB\u00BB\u2033"],
  // curly single quotes, low, high-reversed, prime, acute, backtick. The
  // Ukrainian apostrophe in "im'ya" arrives as any one of these.
  ["'", "\u2018\u2019\u201A\u201B\u2032\u00B4\u0060"],
  // spaces that are not the space bar: nbsp, narrow nbsp, thin, figure, tab
  [" ", "\u00A0\u202F\u2009\u2007\u0009"],
  // Cyrillic / Latin homoglyphs - the "i/i" case that names this step. Only
  // pairs identical in BOTH cases are here: folding one case and not the other
  // would make the lowercasing below disagree with itself. That is why Cyrillic
  // te / ve / en / em are absent - their capitals pass for T, B, H and M but
  // their lowercase forms pass for nothing Latin. No two Cyrillic letters fold
  // onto the same Latin one, so this can never make two DIFFERENT Ukrainian
  // letters equal - it only forgives the wrong keyboard.
  ["a", "\u0430"],
  ["A", "\u0410"],
  ["c", "\u0441"],
  ["C", "\u0421"],
  ["e", "\u0435"],
  ["E", "\u0415"],
  ["i", "\u0456"],
  ["I", "\u0406"],
  ["o", "\u043E"],
  ["O", "\u041E"],
  ["p", "\u0440"],
  ["P", "\u0420"],
  ["x", "\u0445"],
  ["X", "\u0425"],
  ["y", "\u0443"],
  ["Y", "\u0423"]
];

const LOOKALIKE_CHARS: Record<string, string> = TYPING_EQUIVALENTS.reduce(
  (map, [plain, lookalikes]) => {
    lookalikes.split("").forEach((char) => {
      map[char] = plain;
    });
    return map;
  },
  {} as Record<string, string>
);

// The diacritic case: a Ukrainian "yi" and any accented Latin letter can arrive
// precomposed (one code point) or decomposed (base letter + a combining mark).
// They are the same letter, no keyboard offers the choice, and only one of the
// two is what the passage happens to be stored with. Composing both sides
// settles it before anything else looks at them.
//
// Guarded rather than called bare because `normalize` is an engine feature, not
// a language one - the same caution as `getSentences` avoiding lookbehind for
// Hermes. Falling back to the unnormalized text loses the tolerance, never the
// app.
const composed: (text: string) => string = (text) =>
  "normalize" in String.prototype ? text.normalize("NFC") : text;

// One character at a time, so the result is the same length as the input.
const foldTypeable: (text: string) => string = (text) =>
  composed(text)
    .split("")
    .map((char) => LOOKALIKE_CHARS[char] ?? char)
    .join("");

// Punctuation level 5 has never graded, plus the ellipsis the 1:1 fold above
// cannot carry. Marks only - nothing in here is ever the difference between two
// words.
const IGNORED_PUNCTUATION = /[-,.:;!?'"\u2026]/g;

// The comparison form: folded, case-blind, punctuation dropped, whitespace
// collapsed. The collapse is part of the same idea - dropping the "-" out of
// "word - word" leaves two spaces where the user typed one, and a run of spaces
// (or the newline a stored passage may carry) was never something the user was
// asked to reproduce.
const typedForm: (text: string) => string = (text) =>
  foldTypeable(text)
    .toLowerCase()
    .replace(IGNORED_PUNCTUATION, "")
    .replace(/\s+/g, " ")
    .trim();

// Whether what the user typed IS the passage. Deliberately not a similarity
// score: a real misspelling is still wrong, exactly as `sameWord` above is
// equality of letters and not resemblance.
const typedEquals: (typed: string, target: string) => boolean = (
  typed,
  target
) => typedForm(typed) === typedForm(target);

// How many characters of `target` the user got right from the start, tolerating
// the same lookalikes and case. Level 5 hands a failed attempt back trimmed to
// this, so the tolerance has to reach here too: without it one curly apostrophe
// in the stored text throws away everything the user typed after it.
const typedPrefixLength: (typed: string, target: string) => number = (
  typed,
  target
) => {
  const foldedTyped = foldTypeable(typed);
  const foldedTarget = foldTypeable(target);
  const limit = Math.min(foldedTyped.length, foldedTarget.length);
  let matched = 0;
  while (
    matched < limit &&
    foldedTyped[matched].toLowerCase() === foldedTarget[matched].toLowerCase()
  ) {
    matched++;
  }
  return matched;
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
  /** Whether two words read as the same one: letters only, case-blind. */
  sameWord,
  /** Untypeable characters folded to the ones a keyboard has (8.2.7). 1:1. */
  foldTypeable,
  /** Whether what was typed IS the passage, lookalikes and case forgiven. */
  typedEquals,
  /** How many characters of the target were typed right from the start. */
  typedPrefixLength,
  /** The first few words, trailing space kept. */
  getFirstWords,
  /** How many verses this passage's address spans. */
  getVersesCount,
  /** Verses of the library held in an English translation. */
  countEnglishVerses
};
