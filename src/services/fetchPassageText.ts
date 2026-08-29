import Constants from "expo-constants";
import {
  API_LINK,
  BUNDLED_TRANSLATION_SOURCES,
  LANGCODE,
  TranslationSourceModel
} from "../constants";
import { AddressType } from "../models";
import { logger } from "../utils/logger";

// Every translation is fetched the same way: the API is the only text source
// the app talks to, and which translation is wanted is one query parameter. The
// ESV key used to live in the app's own config - it is the server's now, and
// the client must never hold it again.

const HOST = Constants.expoConfig?.extra?.HOST || "";

// What the API answers with. Its `language` is an ISO code ("uk"), not the app's
// own LANGCODE ("ua"), and it carries more than the app needs - so the catalogue
// is read field by field rather than trusted whole.
interface CatalogueEntryResponseModel {
  id: string;
  title: string;
  language: string;
  isRemote: boolean;
}

const toLangCode: (language: string) => LANGCODE = (language) =>
  language === "uk" || language === "ua" ? LANGCODE.ua : LANGCODE.en;

/**
 * The live catalogue, or the shipped one when there is no answer. Offline-first
 * means a failed call is not an error the user has to see: the app still knows
 * which translations exist, it just cannot be told about a new one.
 */
export const fetchTranslationCatalogue: () => Promise<
  TranslationSourceModel[]
> = async () => {
  if (!HOST) {
    return BUNDLED_TRANSLATION_SOURCES;
  }
  try {
    const response = await fetch(`${HOST}${API_LINK.translationCatalogue}`, {
      method: "GET"
    });
    if (!response.ok) {
      logger.error(
        `Translation catalogue answered ${response.status}; using the bundled one`
      );
      return BUNDLED_TRANSLATION_SOURCES;
    }
    const data = (await response.json()) as {
      translations?: CatalogueEntryResponseModel[];
    };
    if (!Array.isArray(data?.translations) || !data.translations.length) {
      return BUNDLED_TRANSLATION_SOURCES;
    }
    return data.translations.map((entry) => ({
      sourceId: entry.id,
      title: entry.title,
      language: toLangCode(entry.language),
      isRemote: !!entry.isRemote
    }));
  } catch (error) {
    logger.error(`Unable to get the translation catalogue: ${error}`);
    return BUNDLED_TRANSLATION_SOURCES;
  }
};

/**
 * Text for one address in one translation, in that translation's own verse
 * numbering - the API answers zero-based, exactly as the app addresses.
 * Rejects when there is no text to be had; there is no half-text.
 */
export const fetchPassageText: (
  address: AddressType,
  sourceId: string
) => Promise<string> = async (address, sourceId) => {
  if (!HOST) {
    throw new Error("No text source configured");
  }
  const query = Object.entries({
    translationId: sourceId,
    bookIndex: address.bookIndex,
    startChapterNum: address.startChapterNum,
    startVerseNum: address.startVerseNum,
    // omitted rather than sent empty: a single verse has no end
    endChapterNum: address.endChapterNum,
    endVerseNum: address.endVerseNum
  })
    .filter(([, value]) => value !== null && typeof value !== "undefined")
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join("&");
  const response = await fetch(
    `${HOST}${API_LINK.translationPassage}?${query}`,
    { method: "GET" }
  );
  if (!response.ok) {
    logger.error(
      `No passage text for ${sourceId} ${JSON.stringify(address)}: ${
        response.status
      }`
    );
    throw new Error(`Unable to get passage text: ${response.status}`);
  }
  const data = (await response.json()) as { text?: string };
  if (typeof data?.text !== "string" || !data.text.length) {
    logger.error(
      `Empty passage text for ${sourceId} ${JSON.stringify(address)}`
    );
    throw new Error("Unable to get passage text");
  }
  return data.text;
};
