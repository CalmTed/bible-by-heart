import { LANGCODE } from '../constants';
import { getVersesNumber } from '../initials';
import { PassageModel, TranslationModel } from '../models';

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
                p.verseTranslation &&
                translationsInEnglish.includes(p.verseTranslation)
        )
        .map((p) => getVersesNumber(p.address))
        .reduce((ps, num) => ps + num, 0);
    return versesSumInEnglish;
};
