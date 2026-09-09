import { BUNDLED_TRANSLATION_SOURCES, LANGCODE } from "../../src/constants";
import { TranslationModel } from "../../src/models";
import {
  isFetchableTranslation,
  mergeCatalogueIntoTranslations,
  sortTranslations,
  takeSharedTranslation,
  TRANSLATION_ALIASES
} from "../../src/utils/translation";
import { getDefaultTranslations } from "../../src/initials";

// What the app does with a text-source catalogue. The two rules that matter: a
// translation the user invented is never fetched, and merging a catalogue in
// never disturbs what is already there.

const translation: (
  fields: Partial<TranslationModel>
) => TranslationModel = (fields) => ({
  id: 1,
  editable: false,
  isDefault: false,
  name: "ESV®",
  addressLanguage: LANGCODE.en,
  sourceId: "esv",
  ...fields
});

const catalogue = [
  {
    sourceId: "esv",
    title: "ESV®",
    language: LANGCODE.en,
    isRemote: true
  },
  {
    sourceId: "ukr-ogi",
    title: "Переклад Огієнка",
    language: LANGCODE.ua,
    isRemote: false
  }
];

describe("isFetchableTranslation", () => {
  it("is true only for a source the catalogue is offering", () => {
    expect(isFetchableTranslation(translation({}), catalogue)).toBe(true);
  });

  it("is false for a translation the user made up", () => {
    expect(
      isFetchableTranslation(
        translation({ id: 42, editable: true, sourceId: null }),
        catalogue
      )
    ).toBe(false);
  });

  it("is false for a source this server does not offer", () => {
    //ESV is proxied, so it drops out of the catalogue where there is no key
    expect(
      isFetchableTranslation(
        translation({}),
        catalogue.filter((source) => source.sourceId !== "esv")
      )
    ).toBe(false);
  });

  it("is false when there is no such translation at all", () => {
    expect(isFetchableTranslation(undefined, catalogue)).toBe(false);
  });
});

describe("mergeCatalogueIntoTranslations", () => {
  it("returns the very same list when the catalogue brings nothing new", () => {
    const existing = [
      translation({}),
      translation({ id: 5, sourceId: "ukr-ogi", name: "Переклад Огієнка" })
    ];
    expect(mergeCatalogueIntoTranslations(existing, catalogue)).toBe(existing);
  });

  it("appends what the app has never seen, and nothing else", () => {
    const existing = [translation({})];
    const merged = mergeCatalogueIntoTranslations(existing, catalogue);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual(existing[0]);
    expect(merged[1].sourceId).toBe("ukr-ogi");
    expect(merged[1].name).toBe("Переклад Огієнка");
    expect(merged[1].addressLanguage).toBe(LANGCODE.ua);
  });

  it("never makes an appended translation the default, or editable", () => {
    const merged = mergeCatalogueIntoTranslations(
      [translation({ isDefault: true })],
      catalogue
    );
    expect(merged.filter((tr) => tr.isDefault)).toHaveLength(1);
    expect(merged[0].isDefault).toBe(true);
    expect(merged[1].isDefault).toBe(false);
    expect(merged[1].editable).toBe(false);
  });

  it("never lands on an id the list already uses", () => {
    //the hazard is real: a translation the user added years ago can hold any
    //number, the shipped 3..6 included, and a passage stores that number
    const existing = [
      translation({}),
      translation({ id: 3, editable: true, name: "Огієнко", sourceId: null })
    ];
    const merged = mergeCatalogueIntoTranslations(
      existing,
      BUNDLED_TRANSLATION_SOURCES
    );
    const ids = merged.map((tr) => tr.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(merged.find((tr) => tr.name === "Огієнко")?.id).toBe(3);
  });

  it("adds every bundled source to a list that has none of them", () => {
    const merged = mergeCatalogueIntoTranslations(
      [translation({ id: 2, name: "UCVNTR", sourceId: null })],
      BUNDLED_TRANSLATION_SOURCES
    );
    expect(merged.map((tr) => tr.sourceId)).toEqual([
      null,
      ...BUNDLED_TRANSLATION_SOURCES.map((source) => source.sourceId)
    ]);
  });
});

// --- the translation stamp another Bible app leaves on a share --------------

describe("takeSharedTranslation", () => {
  const shipped = getDefaultTranslations(LANGCODE.ua);
  const idOf = (sourceId: string): number | undefined =>
    shipped.find((tr) => tr.sourceId === sourceId)?.id;

  it("reads and removes a code closing the reference line", () => {
    expect(takeSharedTranslation("John 3:16 ESV", shipped)).toEqual({
      text: "John 3:16 ",
      translationId: idOf("esv")
    });
  });

  it("takes the registered mark with the code", () => {
    expect(takeSharedTranslation("John 3:16 ESV®", shipped).text).toBe(
      "John 3:16 "
    );
  });

  it("reads a code opening the text in front of a separator", () => {
    expect(takeSharedTranslation("ESV: In the beginning", shipped)).toEqual({
      text: ": In the beginning",
      translationId: idOf("esv")
    });
    expect(
      takeSharedTranslation("ESV [1] In the beginning", shipped).translationId
    ).toBe(idOf("esv"));
  });

  it("reads a code sitting alone on its own line", () => {
    expect(
      takeSharedTranslation("ESV\nIn the beginning", shipped).translationId
    ).toBe(idOf("esv"));
  });

  it("reads a translator named in brackets, brackets included", () => {
    expect(
      takeSharedTranslation('Лк 2:22: "текст" (Огієнко)', shipped)
    ).toEqual({
      text: 'Лк 2:22: "текст" ',
      translationId: idOf("ukr-ogi")
    });
  });

  it("reads a translation the user has under its own name", () => {
    expect(
      takeSharedTranslation("Пс 23:1 Переклад Турконяка", shipped).translationId
    ).toBe(idOf("ukr-turk"));
  });

  it("recognises the Синодальний, which the app can fetch", () => {
    // it was the only fetchable source with no alias of its own, so a share
    // stamped with its name was cleaned but never matched to the translation
    expect(
      takeSharedTranslation("Иоанна 3:16 Синодальный перевод", shipped)
    ).toEqual({
      text: "Иоанна 3:16 ",
      translationId: idOf("rus-syn")
    });
    expect(
      takeSharedTranslation("Иоанна 3:16 (Синодальный)", shipped).translationId
    ).toBe(idOf("rus-syn"));
  });

  it("removes a translation the app has no text for, and names none", () => {
    expect(takeSharedTranslation("John 3:16 NIV", shipped)).toEqual({
      text: "John 3:16 ",
      translationId: undefined
    });
  });

  it("names no translation when the user does not have that source", () => {
    const onlyUkrainian = shipped.filter((tr) => tr.sourceId !== "esv");
    expect(takeSharedTranslation("John 3:16 ESV", onlyUkrainian)).toEqual({
      text: "John 3:16 ",
      translationId: undefined
    });
  });

  it("keeps an all-caps word that is part of the verse", () => {
    // the same reason `sanitizeSharedText` is narrow about a leading code
    const verse = "The LORD is my shepherd";
    expect(takeSharedTranslation(verse, shipped).text).toBe(verse);
    expect(takeSharedTranslation("I AM has sent me", shipped).text).toBe(
      "I AM has sent me"
    );
  });

  it("keeps a code that is not standing apart from the verse", () => {
    const verse = "cast the NET on the right side";
    expect(takeSharedTranslation(verse, shipped).text).toBe(verse);
  });

  it("keeps a code that only looks like one because of its case", () => {
    const verse = "he cast the net on the right side";
    expect(takeSharedTranslation(verse, shipped).text).toBe(verse);
  });

  it("does not cut inside a longer word", () => {
    const verse = "WEBSITE";
    expect(takeSharedTranslation(verse, shipped).text).toBe(verse);
  });

  it("takes an alias and the full name it sits inside only once", () => {
    // "Огієнка" is an alias AND part of the shipped name "Переклад Огієнка"
    expect(takeSharedTranslation("Пс 23:1 Переклад Огієнка", shipped)).toEqual({
      text: "Пс 23:1 ",
      translationId: idOf("ukr-ogi")
    });
  });

  it("leaves text that names nothing untouched", () => {
    const verse = "Бо так полюбив Бог світ";
    expect(takeSharedTranslation(verse, shipped)).toEqual({
      text: verse,
      translationId: undefined
    });
  });

  it("has an alias table pointing only at sources the app ships", () => {
    const shippedIds = BUNDLED_TRANSLATION_SOURCES.map(
      (source) => source.sourceId
    );
    Object.keys(TRANSLATION_ALIASES).forEach((sourceId) =>
      expect(shippedIds).toContain(sourceId)
    );
  });
});

/**
 * The order the app offers its translations in. It is a property of the list,
 * not of the six screens that render it, so every one of them shows the same
 * order without knowing there is one.
 */
describe("sortTranslations", () => {
  const named = (sourceId: string | null, id: number) =>
    translation({ id, sourceId, name: sourceId ?? "mine" });

  it("puts the shipped sources in the order the catalogue names them", () => {
    const shuffled = [
      named("ukr-ogi", 5),
      named("esv", 1),
      named("ukr-turk", 6),
      named("ukr-hom", 3)
    ];
    expect(sortTranslations(shuffled).map((tr) => tr.sourceId)).toEqual(
      BUNDLED_TRANSLATION_SOURCES.map((source) => source.sourceId).filter(
        (sourceId) =>
          shuffled.some((tr) => tr.sourceId === sourceId)
      )
    );
  });

  it("offers Турконяка first and ESV second", () => {
    expect(
      sortTranslations(getDefaultTranslations(LANGCODE.ua)).map(
        (tr) => tr.sourceId
      )
    ).toEqual([
      "ukr-turk",
      "esv",
      "rus-syn",
      "ukr-hom",
      "ukr-kul",
      "ukr-ogi"
    ]);
  });

  it("keeps what it does not know after what it does, in the order it had", () => {
    const list = [
      named(null, 100),
      named("ukr-ogi", 5),
      named("some-future-source", 101),
      named("ukr-turk", 6)
    ];
    expect(sortTranslations(list).map((tr) => tr.id)).toEqual([6, 5, 100, 101]);
  });

  it("hands the same array back when nothing moves", () => {
    const ordered = getDefaultTranslations(LANGCODE.en);
    expect(sortTranslations(ordered)).toBe(ordered);
  });

  it("does not renumber or rename anything on the way", () => {
    const list = [named("ukr-ogi", 5), named("ukr-turk", 6)];
    expect(sortTranslations(list)).toEqual([list[1], list[0]]);
  });
});
