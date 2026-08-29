/**
 * The add flow asks for a translation only when the answer is not already
 * clear. This util is that decision.
 */
import { LANGCODE } from "../../src/constants";
import { getDefaultTranslations } from "../../src/initials";
import { TranslationModel } from "../../src/models";
import { getTranslationChoice } from "../../src/utils/getTranslationChoice";

const translation = (
  id: number,
  isDefault = false,
  name = `T${id}`
): TranslationModel => ({
  id,
  editable: true,
  isDefault,
  name,
  addressLanguage: LANGCODE.en
});

describe("getTranslationChoice", () => {
  it("asks nothing when there is a single translation and uses it", () => {
    expect(getTranslationChoice([translation(7)])).toEqual({
      needsChoice: false,
      translationId: 7
    });
  });

  it("asks nothing when there is no translation at all", () => {
    expect(getTranslationChoice([])).toEqual({
      needsChoice: false,
      translationId: undefined
    });
  });

  it("asks when more than one translation exists", () => {
    const choice = getTranslationChoice([translation(1), translation(2)]);
    expect(choice.needsChoice).toBe(true);
  });

  it("preselects the default translation", () => {
    const choice = getTranslationChoice([
      translation(1),
      translation(2, true),
      translation(3)
    ]);
    expect(choice.translationId).toBe(2);
  });

  it("falls back to the first translation when none is marked default", () => {
    const choice = getTranslationChoice([translation(5), translation(6)]);
    expect(choice.translationId).toBe(5);
  });

  it("asks on a fresh install, where every bundled translation ships", () => {
    const defaults = getDefaultTranslations(LANGCODE.ua);
    const choice = getTranslationChoice(defaults);
    expect(choice.needsChoice).toBe(true);
    //a Ukrainian install marks no translation default (only an English one
    //does, ESV), so the preselection falls back to the first in the list
    expect(defaults.some((tr) => tr.isDefault)).toBe(false);
    expect(choice.translationId).toBe(defaults[0].id);
  });
});
