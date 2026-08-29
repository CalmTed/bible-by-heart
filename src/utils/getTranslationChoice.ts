import { TranslationModel } from "../models";

export interface TranslationChoiceModel {
  //ask the user only when the answer is not already clear: one (or no)
  //translation leaves nothing to choose between
  needsChoice: boolean;
  //the translation to use when no choice is needed, and the one preselected in
  //the picker when it is; undefined = no translation at all (custom text)
  translationId?: number;
}

// Which translation a NEW passage gets, and whether the user has to be asked at
// all. The default translation wins the preselection; without one the first in
// the list does.
export const getTranslationChoice: (
  translations: TranslationModel[]
) => TranslationChoiceModel = (translations) => {
  const defaultTranslation = translations.find((tr) => tr.isDefault);
  return {
    needsChoice: translations.length > 1,
    translationId: (defaultTranslation || translations[0])?.id
  };
};
