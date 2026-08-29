import { TranslationSourceModel } from "../constants";
import { TranslationModel } from "../models";

// What the app does with a text-source catalogue once it has one - pure, so the
// state converter and the passage editor share it without either of them
// reaching the network. Fetching lives in `src/services/fetchPassageText.ts`.

/** Whether this translation has text behind it *right now*. */
export const isFetchableTranslation: (
  translation: TranslationModel | undefined,
  catalogue: TranslationSourceModel[]
) => boolean = (translation, catalogue) =>
  !!translation?.sourceId &&
  catalogue.some((source) => source.sourceId === translation.sourceId);

/**
 * The catalogue's translations, as entries of the user's own list. A source the
 * user already has (bundled, or added by an earlier call) is left exactly as it
 * is - name, default flag and id included - so this only ever appends, and only
 * what the app has never seen. Unchanged means the SAME array back, so a caller
 * can tell "nothing new" without comparing.
 */
export const mergeCatalogueIntoTranslations: (
  translations: TranslationModel[],
  catalogue: TranslationSourceModel[]
) => TranslationModel[] = (translations, catalogue) => {
  const known = translations.map((translation) => translation.sourceId);
  const missing = catalogue.filter(
    (source) => !known.includes(source.sourceId)
  );
  if (!missing.length) {
    return translations;
  }
  // A local id is what every passage stores in `verseTranslation`, so a new
  // entry may never land on a number the list already uses - the shipped ids
  // (3..6) are perfectly reachable by a translation the user made years ago.
  let nextId = translations.reduce(
    (highest, translation) => Math.max(highest, translation.id),
    0
  );
  return [
    ...translations,
    ...missing.map((source) => {
      nextId += 1;
      return {
        id: nextId,
        editable: false,
        isDefault: false,
        name: source.title,
        addressLanguage: source.language,
        sourceId: source.sourceId
      };
    })
  ];
};

// --- The translation a share came stamped with ------------------------------
//
// Another Bible app writes its translation into the text it shares: YouVersion
// closes the reference with "ESV", MyBible names the Ukrainian translator. That
// word is not part of the verse, so it has to leave the text - and it says which
// translation the passage is in, which is more than the address language can
// tell (all four Ukrainian translations answer to the same language).
//
// Two rules keep this from eating Scripture. Only names the app KNOWS are taken
// - `sanitizeSharedText` is narrow about a leading code for the same reason
// ("LORD is my shepherd" is a verse, not a code). And a known name only counts
// where a stamp actually goes: wrapped in brackets, closing its line, or opening
// one in front of a separator. Anywhere else it is prose.

/** What other apps call the sources this app can fetch, keyed by `sourceId`. */
export const TRANSLATION_ALIASES: Record<string, string[]> = {
  esv: ["ESV", "English Standard Version"],
  "ukr-hom": ["Хоменка", "Хоменко"],
  "ukr-kul": ["Куліша", "Куліш", "UKRK"],
  "ukr-ogi": ["Огієнка", "Огієнко", "UBIO"],
  "ukr-turk": ["Турконяка", "Турконяк", "UTT"]
};

/**
 * Translations the app has no text for. Listed only so a share carrying one is
 * still cleaned of it - the verse arrives typeable and the user picks the
 * translation themselves, instead of starting to memorize the word "NIV".
 */
export const FOREIGN_TRANSLATION_CODES: string[] = [
  "AMP",
  "AMPC",
  "ASV",
  "CEB",
  "CEV",
  "CSB",
  "ERV",
  "GNT",
  "GNV",
  "HCSB",
  "ICB",
  "KJV",
  "MSG",
  "NASB",
  "NCV",
  "NET",
  "NIV",
  "NIV84",
  "NKJV",
  "NLT",
  "NRSV",
  "RSV",
  "TLB",
  "TPT",
  "UMT",
  "WEB",
  "YLT"
];

/** What `takeSharedTranslation` found, and the text without it. */
export interface SharedTranslationModel {
  /** The text with the stamp cut out of it. */
  text: string;
  /** The user's translation the stamp named; `undefined` when they have none. */
  translationId?: number;
}

// Registered / trademark marks ride along with the name they follow ("ESV®").
const TRADEMARK_MARKS = "®™";
// Brackets a stamp is written inside; a matched pair leaves with the name.
const WRAPPERS: [open: string, close: string][] = [
  ["(", ")"],
  ["[", "]"]
];
// A one-letter name would match half the alphabet of an all-caps verse word.
const MIN_NAME_LENGTH = 2;

// JS `\b` is ASCII-only, so a Cyrillic name needs its boundary checked by hand -
// `address.ts` guards its book titles against the same limitation.
const isWordChar = (ch: string | undefined): boolean =>
  typeof ch === "string" && /[\p{L}\d]/u.test(ch);

const isBlank = (part: string): boolean => !part.trim().length;

// An all-caps code is matched case-sensitively (so a verse's "net" is never the
// NET translation); a spelled-out name is matched however it was written.
const isCode = (name: string): boolean => /^[A-Z0-9]+$/.test(name);

interface KnownNameModel {
  name: string;
  translationId?: number;
}

interface NameMatchModel {
  start: number;
  end: number;
  translationId?: number;
}

const getKnownNames: (translations: TranslationModel[]) => KnownNameModel[] = (
  translations
) => [
  ...Object.entries(TRANSLATION_ALIASES).flatMap(([sourceId, aliases]) => {
    const translationId = translations.find(
      (translation) => translation.sourceId === sourceId
    )?.id;
    return aliases.map((name) => ({ name, translationId }));
  }),
  // The user's own list too: a translation they made and named after the app it
  // came from is the only way a hand-typed entry can ever be recognized.
  ...translations.map((translation) => ({
    name: translation.name
      .replace(new RegExp(`[${TRADEMARK_MARKS}]`, "g"), "")
      .trim(),
    translationId: translation.id
  })),
  ...FOREIGN_TRANSLATION_CODES.map((name) => ({ name }))
];

// Where a stamp is allowed to sit. Brackets are handled by the caller, which
// widens the match over them before asking.
const isStamp: (text: string, start: number, end: number) => boolean = (
  text,
  start,
  end
) => {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lineBefore = before.slice(before.lastIndexOf("\n") + 1);
  const lineBreak = after.indexOf("\n");
  const lineAfter = lineBreak === -1 ? after : after.slice(0, lineBreak);
  // "John 3:16 ESV" - the stamp closes its line
  if (isBlank(lineAfter)) {
    return true;
  }
  // "ESV: In the beginning" / "ESV [1] In the beginning" - it opens one, and the
  // separator is what tells it apart from a verse that starts with the word
  return isBlank(lineBefore) && /^\s*(?:[:-]|\[\s*\d)/.test(lineAfter);
};

const findNameMatches: (
  text: string,
  translations: TranslationModel[]
) => NameMatchModel[] = (text, translations) => {
  const matches: NameMatchModel[] = [];
  const lowerText = text.toLowerCase();
  getKnownNames(translations).forEach(({ name, translationId }) => {
    if (name.length < MIN_NAME_LENGTH) {
      return;
    }
    const cased = isCode(name);
    const needle = cased ? name : name.toLowerCase();
    const haystack = cased ? text : lowerText;
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      const start = at;
      let end = at + needle.length;
      const mark = text[end];
      if (mark && TRADEMARK_MARKS.includes(mark)) {
        end += 1;
      }
      const wrapper = WRAPPERS.find(
        ([open, close]) => text[start - 1] === open && text[end] === close
      );
      if (!isWordChar(text[start - 1]) && !isWordChar(text[end])) {
        if (wrapper) {
          matches.push({ start: start - 1, end: end + 1, translationId });
          return;
        }
        if (isStamp(text, start, end)) {
          matches.push({ start, end, translationId });
          return;
        }
      }
      at = haystack.indexOf(needle, end);
    }
  });
  return matches;
};

/**
 * Reads the translation a share was stamped with and cuts the stamp out. Runs
 * BEFORE `sanitizeSharedText`, which strips a leading code without saying what
 * it was - the evidence has to be read while it is still there.
 */
export const takeSharedTranslation: (
  text: string,
  translations: TranslationModel[]
) => SharedTranslationModel = (text, translations) => {
  const matches = findNameMatches(text, translations).sort(
    (a, b) => a.start - b.start || b.end - a.end
  );
  let kept = "";
  let taken = 0;
  let translationId: number | undefined = undefined;
  matches.forEach((match) => {
    // An alias inside a longer name it already took ("Хоменка" in "Переклад
    // Хоменка") is the same stamp twice, not a second one.
    if (match.start < taken) {
      return;
    }
    kept += text.slice(taken, match.start);
    taken = match.end;
    if (typeof translationId === "undefined") {
      translationId = match.translationId;
    }
  });
  return { text: kept + text.slice(taken), translationId };
};
