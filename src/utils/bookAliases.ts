import { ADDRESSLANG } from "../constants";
import { WORD } from "../l10n";

// Extra accepted spellings / abbreviations per book, applied by
// `Address.parse` IN ADDITION to the app's localized long + short titles.
// Keyed by the book's long-title l10n key (WORD) so it stays readable and
// stable regardless of book index. Per-language, matched case-insensitively.
//
// Why: text shared from other apps (YouVersion etc.) or typed by hand uses
// abbreviations the app doesn't ship as its own titles ("Mt", "Jn", "Psalms")
// and Ukrainian spelling variants (Івана / Іоана; the correct "Судді" vs the
// app's own long title). Adding them here makes those references parse without
// touching the canonical l10n titles.
//
// Where they come from. The Ukrainian half is harvested from the `books` maps of
// the four translations the API serves (Хоменко, Куліш і Пулюй, Огієнко,
// Турконяк) - every long and short title they use that the app does not ship
// itself, Kulish's 1900s spellings included, because that is exactly what text
// shared from another app carries. The English half is the abbreviations third
// parties actually emit. A shipped constant, on purpose: resolving a reference
// must never need the network.
//
// Two rules hold, and a test holds them: no spelling may name two different
// books (an ambiguous one - "Hb" for both Habakkuk and Hebrews - is dropped
// rather than guessed at), and no entry repeats a title the app already ships.
// The parser prefers the longest match, so an alias inside another alias
// ("Йоана" within "Перше послання Йоана Богослова") resolves to the longer one.
export const bookAliases: Partial<
  Record<WORD, Partial<Record<ADDRESSLANG, string[]>>>
> = {
  bGenLong: { en: ["Gn", "Ge"] },
  bExoLong: { en: ["Ex", "Exod"] },
  bLevLong: { en: ["Lv"], ua: ["Левит"] },
  bNumLong: { en: ["Nm", "Nu"] },
  bDeuLong: {
    en: ["Dt", "Deut"],
    ua: ["Второзаконня", "Повторення Закону"]
  },
  bJoshLong: {
    en: ["Jos", "Jsh"],
    ua: ["Книга Ісуса Навина", "Іс. Н", "Ісус Навин", "Ісуса Навина"]
  },
  bJudgLong: { en: ["Jdg", "Jgs"], ua: ["Судді", "Суддів", "Книга Суддів"] },
  bRuthLong: { en: ["Ru", "Rth"], ua: ["Книга Рути"] },
  b1SamLong: {
    en: ["1Sam", "1 Sm", "1 Sa", "1Sa"],
    ua: ["І Книга Самуїла", "1-а Самуїлова"]
  },
  b2SamLong: {
    en: ["2Sam", "2 Sm", "2 Sa", "2Sa"],
    ua: ["ІІ Книга Самуїла", "2-а Самуїлова"]
  },
  b1KinLong: {
    en: ["1Kin", "1 Kgs", "1 Ki", "1Ki"],
    ua: ["І Книга Царів", "1-а царів"]
  },
  b2KinLong: {
    en: ["2Kin", "2 Kgs", "2 Ki", "2Ki"],
    ua: ["ІІ Книга Царів", "2-а царів"]
  },
  b1ChrLong: { en: ["1Chr", "1 Ch", "1Ch"], ua: ["І Хроніка", "1-а хроніки"] },
  b2ChrLong: { en: ["2Chr", "2 Ch", "2Ch"], ua: ["ІІ Хроніка", "2-а хроніки"] },
  bEzrLong: { ua: ["Книга Езри", "Езд", "Ездра"] },
  bNehLong: { en: ["Ne"], ua: ["Книга Неємії", "Неемія", "Неемії"] },
  bEsthLong: { en: ["Est"], ua: ["Книга Естери", "Естери"] },
  bJobLong: { en: ["Jb"], ua: ["Книга Іова"] },
  bPsLong: {
    en: ["Psalms", "Pss", "Psa"],
    ua: ["Псалми", "Псалтир", "Псальми", "Псалмів"]
  },
  bProvLong: { en: ["Prv", "Pr"], ua: ["Приповідки", "Приповістей"] },
  bEcclLong: { en: ["Ec"], ua: ["Проповідник", "Екклезіяст"] },
  bSongLong: {
    en: ["Song of Songs", "Sos", "Sng", "Canticles"],
    ua: ["Пісня Пісень", "Пісня над піснями", "Пісня"]
  },
  bIsaLong: { en: ["Is"], ua: ["Книга Пророка Ісаї", "Ісая"] },
  bJerLong: { en: ["Jr"], ua: ["Книга Пророка Єремії", "Єремія"] },
  bLamLong: { en: ["Lm"], ua: ["Плач"] },
  bEzekLong: { en: ["Ezk", "Eze"], ua: ["Книга Пророка Єзекиїла", "Єзекіїль"] },
  bDanLong: { en: ["Dn"], ua: ["Книга Пророка Даниїла", "Даниїл"] },
  bHosLong: { en: ["Ho"], ua: ["Пророк Осія", "Осія"] },
  bJoelLong: { en: ["Jl"], ua: ["Пророк Йоіл", "Йоїл"] },
  bAmLong: { en: ["Amo"], ua: ["Пророк Амос", "Амос"] },
  bObaLong: { en: ["Ob", "Obad"], ua: ["Пророк Авдій", "Овдій"] },
  bJonaLong: { en: ["Jon", "Jnh"], ua: ["Пророк Йона", "Йона"] },
  bMicLong: { en: ["Mi"], ua: ["Пророк Міхей", "Михей"] },
  bNahLong: { en: ["Na"], ua: ["Пророк Наум"] },
  bHabLong: { ua: ["Пророк Авакум", "Авв", "Авакум"] },
  bZephLong: { en: ["Zep", "Zp"], ua: ["Пророк Софонія", "Софонія"] },
  bHagLong: { en: ["Hg"], ua: ["Пророк Аггей", "Агг", "Огій"] },
  bZechLong: { en: ["Zec", "Zc"], ua: ["Пророк Захарія", "Захарія"] },
  bMalLong: { en: ["Ml"], ua: ["Пророк Малахія"] },
  bMatLong: {
    en: ["Mt", "Matt"],
    ua: [
      "Матфея",
      "Матфія",
      "Євангелія від Матея",
      "Євангелия від сьв. Маттея",
      "Від Матвія",
      "Матей",
      "Матфей"
    ]
  },
  bMarLong: {
    en: ["Mk", "Mrk"],
    ua: ["Мк", "Євангелія від Марка", "Євангелия від сьв. Марка", "Від Марка"]
  },
  bLukLong: {
    en: ["Lk"],
    ua: ["Лука", "Євангелія від Луки", "Євангелия від сьв. Луки", "Від Луки"]
  },
  bJohnLong: {
    en: ["Jn", "Jhn"],
    ua: [
      "Іоана",
      "Йоана",
      "Євангелія від Йоана",
      "Євангелия від сьв. Йоана",
      "Від Івана",
      "Йоан",
      "Іван"
    ]
  },
  bActsLong: {
    en: ["Ac", "Act"],
    ua: [
      "Діяння Апостолів",
      "Діяння Сьвятих Апостолів",
      "Дії Апостолів",
      "Діяння"
    ]
  },
  bRomLong: {
    en: ["Rm", "Ro"],
    ua: ["Послання до Римлян", "До Римлян Посланнє сьв. Ап. Павла", "До римлян"]
  },
  b1CorLong: {
    en: ["1Cor", "1 Co", "1Co"],
    ua: [
      "Перше послання до Корінтян",
      "До Коринтян перве Посланнє Сьв. Ап. Павла",
      "1-е до коринтян"
    ]
  },
  b2CorLong: {
    en: ["2Cor", "2 Co", "2Co"],
    ua: [
      "Друге послання до Корінтян",
      "До Коринтян друге Посланнє сьв. Ап. Павла",
      "2-е до коринтян"
    ]
  },
  bGalLong: {
    en: ["Ga"],
    ua: [
      "Послання до Галатів",
      "До Галат Посланнє сьв. Ап. Павла",
      "До галатів"
    ]
  },
  bEphLong: {
    en: ["Ephes"],
    ua: ["Послання до Ефесян", "До Єфесян Посланнє сьв. Ап. Павла", "До ефесян"]
  },
  bPhilLong: {
    en: ["Php"],
    ua: [
      "Послання до Филип'ян",
      "До Филипян Посланнє сьв. Ап. Павла",
      "До филип`ян",
      "Филип’ян"
    ]
  },
  bColLong: {
    ua: [
      "Послання до Колосян",
      "До Колосян Посланнє сьв. Ап. Павла",
      "До колосян"
    ]
  },
  b1ThsLong: {
    en: ["1 Thess", "1Thess", "1 Th", "1Th"],
    ua: [
      "Перше послання до Солунян",
      "До Солунян перве Посланнє сьв. Ап. Павла",
      "1-е до солунян"
    ]
  },
  b2ThsLong: {
    en: ["2 Thess", "2Thess", "2 Th", "2Th"],
    ua: [
      "Друге послання до Солунян",
      "До Солунян друге Посланнє сьв. Ап. Павла",
      "2-е до солунян"
    ]
  },
  b1TimLong: {
    en: ["1Tim", "1 Ti", "1Ti"],
    ua: [
      "Перше послання до Тимотея",
      "До Тимотея перве Посланнє сьв. Ап. Павла",
      "1-е Тимофію"
    ]
  },
  b2TimLong: {
    en: ["2Tim", "2 Ti", "2Ti"],
    ua: [
      "Друге послання до Тимотея",
      "До Тимотея друге Посланнє сьв. Ап. Павла",
      "2-е Тимофію"
    ]
  },
  bTitLong: {
    en: ["Tt"],
    ua: [
      "Послання до Тита",
      "Тит",
      "До Тита Посланнє сьв. Ап. Павла",
      "До Тита"
    ]
  },
  bPhlmLong: {
    en: ["Phm", "Phlmn", "Philem"],
    ua: [
      "Послання до Филимона",
      "До Филимона Посланнє сьв. Ап. Павла",
      "До Филимона"
    ]
  },
  bHebLong: {
    ua: ["Послання до Євреїв", "До Жидів Посланнє сьв. Ап. Павла", "До євреїв"]
  },
  bJamLong: {
    en: ["Jas", "Jm"],
    ua: ["Послання Апостола Якова", "Сьв. Ап. Якова Соборне Посланнє"]
  },
  b1PetLong: {
    en: ["1Pet", "1 Pt", "1Pt", "1 Pe", "1Pe"],
    ua: [
      "Перше послання Апостола Петра",
      "Сьв. Ап. Петра перве Соборне Посланнє",
      "1-е Петра",
      "1 Пт"
    ]
  },
  b2PetLong: {
    en: ["2Pet", "2 Pt", "2Pt", "2 Pe", "2Pe"],
    ua: [
      "Друге послання Апостола Петра",
      "Сьв. Ап. Петра друге Соборне Посланнє",
      "2-е Петра",
      "2 Пт"
    ]
  },
  b1JnLong: {
    en: ["1John", "1Jn", "1 Jhn", "1 Jo", "1Jo"],
    ua: [
      "Перше послання Йоана Богослова",
      "Сьв. Ап. Йоана перве Соборне Посланнє",
      "1-е Івана"
    ]
  },
  b2JnLong: {
    en: ["2John", "2Jn", "2 Jhn", "2 Jo", "2Jo"],
    ua: [
      "Друге послання Йоана Богослова",
      "Сьв. Ап. Йоана друге Соборне Посланнє",
      "2-е Івана"
    ]
  },
  b3JnLong: {
    en: ["3John", "3Jn", "3 Jhn", "3 Jo", "3Jo"],
    ua: [
      "Третє послання Йоана Богослова",
      "Сьв. Ап. Йоана третє Соборне Посланнє",
      "3-е Івана"
    ]
  },
  bJudLong: {
    en: ["Jde", "Jd"],
    ua: ["Послання Апостола Юди", "Юд", "Сьв. Ап. Юди Соборне Посланнє", "Юда"]
  },
  bRevLong: {
    en: ["Rv", "Revelations"],
    ua: [
      "Одкровення Йоана Богослова",
      "Одкриттє сьв. Йоана Богослова",
      "Об`явлення",
      "Об’явлення"
    ]
  }
};

export default bookAliases;
