import { ADDRESSLANG, LANGCODE } from "./constants";
import { createT, WORD } from "./l10n";
import { bookAliases } from "./utils/bookAliases";

// The language an address is WRITTEN in is not the language the app is in. The
// Синодальний is read by people whose interface is Ukrainian or English, so
// "Иоанна 3:16" has to format and parse without Russian ever becoming an
// interface language - and adding "ru" to LANGCODE alone would make it one: the
// interface picker builds itself from that enum, `createT` would answer every
// key with the key itself, and the parser would register all 132 of them as book
// titles. So the address language is its own type, a superset of LANGCODE, and
// the titles the interface has no dictionary for live here as a book-name table.

/**
 * Russian book titles, long then short, taken from the very file the API serves
 * as `rus-syn` - it already keys its books by the app's own l10n WORD keys. Only
 * the 66 an address can name: the file's deuterocanonical books have no book
 * index to be found under.
 */
const RU_BOOK_TITLES: Partial<Record<WORD, string>> = {
  bGenLong: "Бытие",
  bGenShrt: "Быт",
  bExoLong: "Исход",
  bExoShrt: "Исх",
  bLevLong: "Левит",
  bLevShrt: "Лев",
  bNumLong: "Числа",
  bNumShrt: "Чис",
  bDeuLong: "Второзаконие",
  bDeuShrt: "Втор",
  bJoshLong: "Иисуса Навина",
  bJoshShrt: "Нав",
  bJudgLong: "Судей",
  bJudgShrt: "Суд",
  bRuthLong: "Руфь",
  bRuthShrt: "Руф",
  b1SamLong: "1 Царств",
  // "1 Цар" and "2 Цар" are missing on purpose, not by oversight: they are the
  // Синодальний's abbreviations for 1-2 Samuel and they are already the app's
  // Ukrainian short titles for 1-2 KINGS, which numbers the four books the other
  // way. An ambiguous spelling is dropped rather than guessed at, and the one
  // that goes is the foreign abbreviation, not the app's own title.
  b2SamLong: "2 Царств",
  b1KinLong: "3 Царств",
  b1KinShrt: "3 Цар",
  b2KinLong: "4 Царств",
  b2KinShrt: "4 Цар",
  b1ChrLong: "1 Паралипоменон",
  b1ChrShrt: "1 Пар",
  b2ChrLong: "2 Паралипоменон",
  b2ChrShrt: "2 Пар",
  bEzrLong: "Ездры",
  bEzrShrt: "Езд",
  bNehLong: "Неемии",
  bNehShrt: "Неем",
  bEsthLong: "Есфирь",
  bEsthShrt: "Есф",
  bJobLong: "Иова",
  bJobShrt: "Иов",
  bPsLong: "Псалтирь",
  bPsShrt: "Пс",
  bProvLong: "Притчи",
  bProvShrt: "Притч",
  bEcclLong: "Екклесиаст",
  bEcclShrt: "Еккл",
  bSongLong: "Песнь Песней",
  bSongShrt: "Песн",
  bIsaLong: "Исаии",
  bIsaShrt: "Ис",
  bJerLong: "Иеремии",
  bJerShrt: "Иер",
  bLamLong: "Плач Иеремии",
  bLamShrt: "Плач",
  bEzekLong: "Иезекииля",
  bEzekShrt: "Иез",
  bDanLong: "Даниила",
  bDanShrt: "Дан",
  bHosLong: "Осии",
  bHosShrt: "Ос",
  bJoelLong: "Иоиля",
  bJoelShrt: "Иоил",
  bAmLong: "Амоса",
  bAmShrt: "Ам",
  bObaLong: "Авдия",
  bObaShrt: "Авд",
  bJonaLong: "Ионы",
  bJonaShrt: "Иона",
  bMicLong: "Михея",
  bMicShrt: "Мих",
  bNahLong: "Наума",
  bNahShrt: "Наум",
  bHabLong: "Аввакума",
  bHabShrt: "Авв",
  bZephLong: "Софонии",
  bZephShrt: "Соф",
  bHagLong: "Аггея",
  bHagShrt: "Агг",
  bZechLong: "Захарии",
  bZechShrt: "Зах",
  bMalLong: "Малахии",
  bMalShrt: "Мал",
  bMatLong: "Матфея",
  bMatShrt: "Мф",
  bMarLong: "Марка",
  bMarShrt: "Мк",
  bLukLong: "Луки",
  bLukShrt: "Лк",
  bJohnLong: "Иоанна",
  bJohnShrt: "Ин",
  bActsLong: "Деяния",
  bActsShrt: "Деян",
  bRomLong: "Римлянам",
  bRomShrt: "Рим",
  b1CorLong: "1 Коринфянам",
  b1CorShrt: "1 Кор",
  b2CorLong: "2 Коринфянам",
  b2CorShrt: "2 Кор",
  bGalLong: "Галатам",
  bGalShrt: "Гал",
  bEphLong: "Ефесянам",
  bEphShrt: "Еф",
  bPhilLong: "Филиппийцам",
  bPhilShrt: "Флп",
  bColLong: "Колоссянам",
  bColShrt: "Кол",
  b1ThsLong: "1 Фессалоникийцам",
  b1ThsShrt: "1 Фес",
  b2ThsLong: "2 Фессалоникийцам",
  b2ThsShrt: "2 Фес",
  b1TimLong: "1 Тимофею",
  b1TimShrt: "1 Тим",
  b2TimLong: "2 Тимофею",
  b2TimShrt: "2 Тим",
  bTitLong: "Титу",
  bTitShrt: "Тит",
  bPhlmLong: "Филимону",
  bPhlmShrt: "Флм",
  bHebLong: "Евреям",
  bHebShrt: "Евр",
  bJamLong: "Иакова",
  bJamShrt: "Иак",
  b1PetLong: "1 Петра",
  b1PetShrt: "1 Пет",
  b2PetLong: "2 Петра",
  b2PetShrt: "2 Пет",
  b1JnLong: "1 Иоанна",
  b1JnShrt: "1 Ин",
  b2JnLong: "2 Иоанна",
  b2JnShrt: "2 Ин",
  b3JnLong: "3 Иоанна",
  b3JnShrt: "3 Ин",
  bJudLong: "Иуды",
  bJudShrt: "Иуд",
  bRevLong: "Откровение",
  bRevShrt: "Откр"
};

// Every address language the interface has no dictionary for. `en` and `ua` are
// absent on purpose: their titles are the l10n ones, and a copy here would be a
// second place to change a book name in.
const ADDRESS_LANG_TITLES: Partial<
  Record<ADDRESSLANG, Partial<Record<WORD, string>>>
> = {
  ru: RU_BOOK_TITLES
};

// What a language calls itself, for the picker that chooses it. The interface
// languages say it in their own dictionaries; the rest say it here, the way the
// bundled translations carry their own titles rather than an l10n key each. No
// flag: an interface language belongs to the person reading, an address language
// belongs to a book of the Bible.
const ADDRESS_LANG_NAMES: Partial<Record<ADDRESSLANG, string>> = {
  ru: "Русский"
};

const isInterfaceLang = (language: ADDRESSLANG): language is LANGCODE =>
  (Object.values(LANGCODE) as string[]).includes(language);

/** What to call an address language in a list of them. */
export const getAddressLangName: (language: ADDRESSLANG) => string = (
  language
) => {
  if (!isInterfaceLang(language)) {
    return ADDRESS_LANG_NAMES[language] ?? language;
  }
  const t = createT(language);
  return `${t("name")} ${t("flag")}`;
};

/**
 * The `t` an address is formatted and parsed with. For a language the interface
 * speaks it IS that language's dictionary; for one it does not, the book-name
 * table answers and the English dictionary covers the rest - `Address.format`
 * only ever asks it for a book title.
 */
export const createAddressT: (
  language: ADDRESSLANG
) => (word: WORD) => string = (language) => {
  if (isInterfaceLang(language)) {
    return createT(language);
  }
  const bookTitles = ADDRESS_LANG_TITLES[language] ?? {};
  const fallback = createT(LANGCODE.en);
  return (word) => bookTitles[word] ?? fallback(word);
};

/**
 * Every way a book's name may be written in one address language: its long and
 * short titles plus the abbreviations and spelling variants in `bookAliases`.
 * What the parser registers, and the reason it asks for spellings rather than
 * calling `createAddressT` itself: a language with no title of its own for a
 * book contributes NONE. The English abbreviation is not a Russian spelling, and
 * registering it as one would answer an English reference with a Russian
 * language and hand the share the wrong translation.
 */
export const getBookSpellings: (
  book: { titleShort: WORD; longTitle: WORD },
  language: ADDRESSLANG
) => string[] = (book, language) => {
  const aliases = bookAliases[book.longTitle]?.[language] ?? [];
  if (isInterfaceLang(language)) {
    const t = createT(language);
    return [t(book.longTitle), t(book.titleShort), ...aliases];
  }
  const titles = ADDRESS_LANG_TITLES[language] ?? {};
  return [titles[book.longTitle], titles[book.titleShort], ...aliases].filter(
    (spelling): spelling is string => typeof spelling === "string"
  );
};
