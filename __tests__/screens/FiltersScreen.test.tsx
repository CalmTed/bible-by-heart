/**
 * 8.2.2 — the passage-list filters, now a screen instead of a MiniModal with a
 * ScrollView in it. The filters live in app state, so what has to hold is that
 * this screen still dispatches the same toggles the modal did.
 */
import { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "../../src/context/AppContext";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { FiltersScreen } from "../../src/screens/FiltersScreen";
import {
  ARCHIVED_NAME,
  LANGCODE,
  PASSAGELEVEL,
  SCREEN,
  THEMETYPE
} from "../../src/constants";
import { createAddress, createAppState, createPassage } from "../../src/initials";
import { createT } from "../../src/l10n";
import type {
  AppStateModel,
  RootStackParamList,
  ScreenPropsModel
} from "../../src/models";

const t = createT(LANGCODE.en);

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

const makeScreenProps = <T extends keyof RootStackParamList>(
  name: T,
  goBack: jest.Mock
) =>
  ({
    navigation: { navigate: () => {}, goBack, addListener: () => () => {} },
    route: { key: `${String(name)}-stub`, name, params: undefined }
  }) as unknown as ScreenPropsModel<T>;

// A real stateful context: a filter toggle only proves anything if the state it
// writes comes back into the screen, so renderWithContext's no-op setState will
// not do here.
const renderFilters = (initialState: AppStateModel) => {
  const goBack = jest.fn();
  const seen: { state: AppStateModel } = { state: initialState };
  const Harness = () => {
    const [state, setState] = useState(initialState);
    seen.state = state;
    return (
      <AppContext.Provider
        value={{
          state,
          setState,
          dispatch: () => {},
          t,
          theme: getThemeFromScheme(THEMETYPE.dark)
        }}
      >
        <SafeAreaProvider initialMetrics={safeAreaMetrics}>
          <FiltersScreen {...makeScreenProps(SCREEN.listFilters, goBack)} />
        </SafeAreaProvider>
      </AppContext.Provider>
    );
  };
  const screen = render(<Harness />);
  return { screen, goBack, seen };
};

// "1".."5" label the buttons under BOTH level headings, in document order:
// selected level first, max level second. There are no testIDs in src/, so the
// section is addressed by that order.
const SECTIONS = { selectedLevel: 0, maxLevel: 1 } as const;
const pressLevel = (
  screen: ReturnType<typeof renderFilters>["screen"],
  section: keyof typeof SECTIONS,
  label: string
) => {
  fireEvent.press(screen.getAllByText(label)[SECTIONS[section]]);
};

const stateWithTags = (tags: string[]): AppStateModel => {
  const state = createAppState();
  state.passages = [
    { ...createPassage(createAddress(), "", undefined, undefined), tags }
  ];
  return state;
};

describe("FiltersScreen (8.2.2)", () => {
  it("shows every filter section the modal used to, in a screen", () => {
    const { screen } = renderFilters(stateWithTags(["memorized"]));

    expect(screen.getByText(t("TitleFilters"))).toBeTruthy();
    expect(screen.getByText(t("SelectedLevel"))).toBeTruthy();
    expect(screen.getByText(t("MaxLevel"))).toBeTruthy();
    expect(screen.getByText(t("Tags"))).toBeTruthy();
    expect(screen.getByText("memorized")).toBeTruthy();
    expect(screen.getByText(t("Translations"))).toBeTruthy();
    // no "close" button any more - a screen is backed out of
    expect(screen.queryByText(t("Close"))).toBeNull();
  });

  it("says so when there is no tag to filter by", () => {
    const { screen } = renderFilters(stateWithTags([]));
    expect(screen.getByText(t("NoTagsFound"))).toBeTruthy();
    expect(screen.queryByText(t("Tags"))).toBeNull();
  });

  it("toggles a selected-level filter into state and back out", () => {
    const { screen, seen } = renderFilters(createAppState());
    expect(seen.state.filters.selectedLevels).toEqual([]);

    pressLevel(screen, "selectedLevel", "1");
    expect(seen.state.filters.selectedLevels).toEqual([PASSAGELEVEL.l1]);
    expect(seen.state.filters.maxLevels).toEqual([]);

    pressLevel(screen, "selectedLevel", "1");
    expect(seen.state.filters.selectedLevels).toEqual([]);
  });

  it("keeps the max-level section on its own filter", () => {
    const { screen, seen } = renderFilters(createAppState());

    pressLevel(screen, "maxLevel", "3");
    expect(seen.state.filters.maxLevels).toEqual([PASSAGELEVEL.l3]);
    expect(seen.state.filters.selectedLevels).toEqual([]);
  });

  // A fresh state hides archived passages by filtering ARCHIVED_NAME out, so
  // the first press on it is the un-hiding one.
  it("toggles a tag filter, archived included", () => {
    const { screen, seen } = renderFilters(stateWithTags([ARCHIVED_NAME]));
    expect(seen.state.filters.tags).toEqual([ARCHIVED_NAME]);

    fireEvent.press(screen.getByText(t("Archived")));
    expect(seen.state.filters.tags).toEqual([]);

    fireEvent.press(screen.getByText(t("Archived")));
    expect(seen.state.filters.tags).toEqual([ARCHIVED_NAME]);
  });

  it("leaves by going back, not by dismissing a modal", () => {
    const { screen, goBack } = renderFilters(createAppState());
    // the header's back button is the first pressable host node on the screen
    fireEvent.press(screen.UNSAFE_getAllByProps({ accessible: true })[0]);
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
