import { LANGCODE } from "../constants";
import { WORD } from "../l10n";

// Extra accepted spellings / abbreviations per book, applied by
// `addressFromString` IN ADDITION to the app's localized long + short titles.
// Keyed by the book's long-title l10n key (WORD) so it stays readable and
// stable regardless of book index. Per-language, matched case-insensitively.
//
// Why: text shared from other apps (YouVersion etc.) or typed by hand uses
// abbreviations the app doesn't ship as its own titles ("Mt", "Jn", "Psalms")
// and Ukrainian spelling variants (Івана / Іоана; the correct "Судді" vs the
// app's own long title). Adding them here makes those references parse without
// touching the canonical l10n titles.
export const bookAliases: Partial<
  Record<WORD, Partial<Record<LANGCODE, string[]>>>
> = {
  // Old Testament — common English abbreviations differing from the app short title
  bGenLong: { en: ["Gn"] },
  bExoLong: { en: ["Ex"] },
  bLevLong: { en: ["Lv"] },
  bNumLong: { en: ["Nm", "Nu"] },
  bDeuLong: { en: ["Dt", "Deut"] },
  bJoshLong: { en: ["Jos"] },
  // Judges: the app's UA long title is misspelled ("Сідді"); accept the correct
  // "Судді"/"Суддів" as aliases without changing the shipped title.
  bJudgLong: { en: ["Jdg", "Jgs"], ua: ["Судді", "Суддів"] },
  bPsLong: { en: ["Psalms", "Pss"], ua: ["Псалми", "Псалтир"] },
  bProvLong: { en: ["Prv", "Pr"] },
  // Gospels — very common short forms + Ukrainian variants
  bMatLong: { en: ["Mt", "Matt"], ua: ["Матфея", "Матфія"] },
  bMarLong: { en: ["Mk", "Mrk"], ua: ["Мк"] },
  bLukLong: { en: ["Lk"], ua: ["Лк", "Лука"] },
  // John: the example from the task — Івана = Іоана / Йоана.
  bJohnLong: { en: ["Jn"], ua: ["Іоана", "Йоана"] },
  bRomLong: { en: ["Rm"] },
  bPhilLong: { en: ["Php"] },
  bJamLong: { en: ["Jas"] },
  bRevLong: { en: ["Rv", "Revelations"] }
};

export default bookAliases;
