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
  return {
    state: state ?? createAppState(),
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
