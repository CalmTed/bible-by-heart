import { LANGCODE } from "../../src/constants";
import { getDefaultTranslations } from "../../src/initials";
import { parseSharedPassage } from "../../src/utils/parseSharedPassage";

// Real share payloads, character for character - the whole point of the file is
// that the pieces (sanitize, address, translation stamp) only compose correctly
// in one order, and nothing but a full payload proves it.

const NBSP = " ";
const LDQUO = "“";
const RDQUO = "”";
const EM_DASH = "—";

const translations = getDefaultTranslations(LANGCODE.ua);
const idOf = (sourceId: string): number | undefined =>
  translations.find((tr) => tr.sourceId === sourceId)?.id;

describe("parseSharedPassage", () => {
  it("takes a YouVersion English share apart", () => {
    const shared =
      `${LDQUO}For God so loved the world, that he gave his only Son.${RDQUO}\n\n` +
      "John 3:16 ESV\n\n" +
      "https://www.bible.com/bible/59/JHN.3.16";
    const parsed = parseSharedPassage(shared, translations);
    // the quotes only enclose the WHOLE text once the reference is out of it,
    // which is why the remainder is cleaned a second time
    expect(parsed.passageText).toBe(
      "For God so loved the world, that he gave his only Son."
    );
    expect(parsed.address.startChapterNum).toBe(2);
    expect(parsed.address.startVerseNum).toBe(15);
    expect(parsed.translationId).toBe(idOf("esv"));
  });

  it("takes a MyBible share apart - the colon is the reference's, not the verse's", () => {
    // the bug this file was written for: cutting "Лк 2:22" out left `: "…"`
    const shared =
      'Лк 2:22: "А коли сповнились дні очищення їх за Законом Мойсеєвим."';
    const parsed = parseSharedPassage(shared, translations);
    expect(parsed.passageText).toBe(
      "А коли сповнились дні очищення їх за Законом Мойсеєвим."
    );
    expect(parsed.address.bookIndex).toBe(41);
    expect(parsed.address.startChapterNum).toBe(1);
    expect(parsed.address.startVerseNum).toBe(21);
  });

  it("takes the translator's name off a MyBible share, and reads it", () => {
    const shared = 'Лк 2:22: "А коли сповнились дні очищення їх." (Огієнко)';
    const parsed = parseSharedPassage(shared, translations);
    expect(parsed.passageText).toBe("А коли сповнились дні очищення їх.");
    expect(parsed.translationId).toBe(idOf("ukr-ogi"));
  });

  it("takes a leading code apart and still knows what it was", () => {
    const shared =
      "ESV [1] In the beginning, God created the heavens and the earth. Genesis 1:1";
    const parsed = parseSharedPassage(shared, translations);
    expect(parsed.passageText).toBe(
      "In the beginning, God created the heavens and the earth."
    );
    expect(parsed.translationId).toBe(idOf("esv"));
  });

  it("removes a translation the app cannot fetch and asks nobody to type it", () => {
    const parsed = parseSharedPassage(
      "John 3:16 NIV\nFor God so loved the world",
      translations
    );
    expect(parsed.passageText).toBe("For God so loved the world");
    // nothing named a translation the user has, so the address language guesses
    expect(parsed.translationId).toBe(idOf("esv"));
  });

  it("prefers the named translation over the address language", () => {
    // "Лк" is Ukrainian, and so are four of the shipped translations - only the
    // stamp can say which one
    const parsed = parseSharedPassage(
      'Лк 2:22 "текст" Переклад Турконяка',
      translations
    );
    expect(parsed.translationId).toBe(idOf("ukr-turk"));
  });

  it("keeps an all-caps verse word out of the translation's business", () => {
    const parsed = parseSharedPassage(
      `Psalms${NBSP}23:1 ${EM_DASH} The LORD is my shepherd`,
      translations
    );
    expect(parsed.passageText).toContain("The LORD is my shepherd");
    expect(parsed.address.startVerseNum).toBe(0);
  });

  it("gives back an empty address when the share carries no reference", () => {
    const parsed = parseSharedPassage("For God so loved the world", translations);
    expect(isNaN(parsed.address.bookIndex)).toBe(true);
    expect(parsed.passageText).toBe("For God so loved the world");
    expect(parsed.translationId).toBeUndefined();
  });

  it("survives a share that is nothing but a link", () => {
    const parsed = parseSharedPassage("https://bible.com/x", translations);
    expect(parsed.passageText).toBe("");
  });
});
