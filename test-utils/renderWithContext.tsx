import { ReactNode } from "react";
import { render } from "@testing-library/react-native";
import { AppContext, AppContextModel } from "../src/context/AppContext";
import { getThemeFromScheme } from "../src/utils/getThemeFromScheme";
import { createAppState } from "../src/initials";
import { createT } from "../src/l10n";
import { LANGCODE, THEMETYPE } from "../src/constants";
import { AppStateModel } from "../src/models";

export interface RenderWithContextOptions {
  themeType?: THEMETYPE;
  langCode?: LANGCODE;
  state?: AppStateModel;
}

// Builds an AppContext value WITHOUT mounting the full AppProvider (which fires
// storage + notification side effects on mount). Base components migrated off
// Every component reads `theme`/`t` from useAppContext(), so nothing can render
// without a provider and every isolated test uses this instead of a bare render().
// A context Provider emits no host node, so wrapping an existing snapshot test in
// it leaves the rendered tree (and the snapshot) unchanged.
export const makeContextValue = (
  options: RenderWithContextOptions = {}
): AppContextModel => {
  const { themeType = THEMETYPE.dark, langCode = LANGCODE.en, state } = options;
  // `langCode` moves the state's own setting as well as `t`. The app builds one
  // from the other, so a context whose `t` speaks Ukrainian over a state that
  // says English is a combination the app never has - and a component reading
  // the interface language off the state (the address picker, deciding what to
  // call a book) would be tested against something that cannot happen. An
  // explicit `state` still wins, since a test that built one means it.
  const base = createAppState();
  return {
    state:
      state ??
      { ...base, settings: { ...base.settings, langCode } },
    setState: () => {},
    dispatch: () => {},
    t: createT(langCode),
    theme: getThemeFromScheme(themeType)
  };
};

export const renderWithContext = (
  ui: ReactNode,
  options: RenderWithContextOptions = {}
) =>
  render(
    <AppContext.Provider value={makeContextValue(options)}>
      {ui}
    </AppContext.Provider>
  );
