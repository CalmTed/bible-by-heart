import { LANGCODE } from "../constants";
import { PassageModel, TranslationModel } from "../models";
import { getNumberOfVerses } from "./getNumberOfVerses";

export const getNumberOfVersesInEnglish: (
  translations: TranslationModel[],
  passages: PassageModel[]
) => number = (translations, passages) => {
  const translationsInEnglish = translations
    .filter((tr) => tr.addressLanguage === LANGCODE.en)
    .map((tr) => tr.id);
  const versesSumInEnglish = passages
    .filter(
      (p) =>
        p.verseTranslation && translationsInEnglish.includes(p.verseTranslation)
    )
    .map((p) => getNumberOfVerses(p.address))
    .reduce((ps, num) => ps + num, 0);
  return versesSumInEnglish;
};
