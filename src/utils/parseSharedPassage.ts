import { AddressType, TranslationModel } from "../models";
import { createAddress } from "../initials";
import { Address } from "./address";
import { sanitizeSharedText } from "./sanitizeSharedText";
import { takeSharedTranslation } from "./translation";

// Everything that turns a share from another Bible app into a passage the
// editor can open. It used to live inside `ListScreen`, where the one thing it
// needs — a real share payload, character for character — could not be tested.
//
// The order is the whole design:
//   1. take the translation stamp, off the RAW text: sanitizing removes a
//      leading code without saying what it was, and that code is the answer;
//   2. sanitize — untypable characters, URLs, verse numbers, wrapping quotes;
//   3. read the address, anywhere in what is left;
//   4. cut the address out and sanitize the remainder the same way, because the
//      punctuation that attached the reference to the verse stays behind
//      (MyBible shares `Лк 2:22: "…"` — the colon and the quotes are its, not
//      the verse's).

export interface SharedPassageModel {
  /** The reference the share carried; an empty address when it carried none. */
  address: AddressType;
  /** The verse itself — no reference, no stamp, no link, typeable. */
  passageText: string;
  /** The translation to open the editor on; `undefined` when nothing named one. */
  translationId?: number;
}

export const parseSharedPassage: (
  rawText: string,
  translations: TranslationModel[]
) => SharedPassageModel = (rawText, translations) => {
  const shared = takeSharedTranslation(rawText, translations);
  const text = sanitizeSharedText(shared.text);
  const parsedAddress = Address.parse(text);
  // The share named its translation → use it. Only when it did not does the
  // address language get to guess, and it can only ever guess: all four
  // Ukrainian translations answer to the same language.
  const languageTranslation =
    parsedAddress !== false && parsedAddress.language !== null
      ? translations.find((tr) => tr.addressLanguage === parsedAddress.language)
          ?.id
      : undefined;
  return {
    address: parsedAddress !== false ? parsedAddress.address : createAddress(),
    passageText: sanitizeSharedText(
      parsedAddress !== false
        ? text.replace(parsedAddress.addressString, " ")
        : text
    ),
    translationId: shared.translationId ?? languageTranslation
  };
};

export default parseSharedPassage;
