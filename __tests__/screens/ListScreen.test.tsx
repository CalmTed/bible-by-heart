/**
 * 8.2.1d — the add-passage flow, in order: translation -> address -> editor.
 * The translation is the FIRST thing the user meets (translations disagree on
 * verse numbering, so it must be settled before a verse number is shown), and
 * it is still skipped silently when the answer is not in doubt (8.2.1b).
 */
import { useState } from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { AppContext } from "../../src/context/AppContext";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { ListScreen } from "../../src/screens/ListScreen";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";
import {
  ARCHIVED_NAME,
  LANGCODE,
  SCREEN,
  SORTINGOPTION,
  THEMETYPE
} from "../../src/constants";
import {
  createAddress,
  createAppState,
  createPassage
} from "../../src/initials";
import { createT } from "../../src/l10n";
import type {
  AppStateModel,
  RootStackParamList,
  ScreenPropsModel
} from "../../src/models";

// Inert `{ route, navigation }` for a screen rendered outside a navigator — the
// same stub shape the e2e flow uses; `navigate` is a spy here because the flow
// under test is exactly which params the screen navigates with.
const makeScreenProps = <T extends keyof RootStackParamList>(
  name: T,
  navigate: jest.Mock
) =>
  ({
    navigation: {
      navigate,
      goBack: () => {},
      addListener: () => () => {}
    },
    route: { key: `${String(name)}-stub`, name, params: undefined }
  }) as unknown as ScreenPropsModel<T>;

// SafeAreaProvider renders nothing until it knows the insets.
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

const t = createT(LANGCODE.en);

// An empty passage list starts the add flow on mount (its entry point), so the
// test begins exactly where the user does.
const renderAddFlow = (state: AppStateModel) => {
  const navigate = jest.fn();
  const screen = renderWithContext(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <ListScreen {...makeScreenProps(SCREEN.listPassage, navigate)} />
    </SafeAreaProvider>,
    { state }
  );
  return { screen, navigate };
};

type Screen = ReturnType<typeof renderAddFlow>["screen"];

// The picker is a full-screen Modal of its own; src/ carries no testIDs, so it
// is identified by the only header title it can show before a book is picked.
const pickerModal = (screen: Screen) =>
  screen
    .UNSAFE_queryAllByType(Modal)
    .find(
      (node) =>
        node.props.visible === true &&
        within(node).queryByText(t("APSelectBook")) !== null
    );

// Its back action is the first pressable host node inside it (header, left) —
// the same node the AddressPicker suite presses for the 8.2.1a back behaviour.
const pressPickerBack = (screen: Screen) => {
  const modal = pickerModal(screen);
  expect(modal).toBeTruthy();
  fireEvent.press(within(modal!).UNSAFE_getAllByProps({ accessible: true })[0]);
};

// Genesis 1:1 through the picker, ending on its single-verse "add" action.
const pickGenesis11 = (screen: Screen) => {
  fireEvent.press(screen.getByText(t("bGenShrt")));
  fireEvent.press(screen.getByText("1")); // chapter 1
  fireEvent.press(screen.getByText("1")); // start verse 1
  fireEvent.press(screen.getByText(t("APAddVerse")));
};

const GENESIS_1_1 = {
  bookIndex: 0,
  startChapterNum: 0,
  startVerseNum: 0,
  endChapterNum: 0,
  endVerseNum: 0
};

describe("ListScreen add-passage flow (8.2.1d)", () => {
  it("asks for the translation before any verse number is on screen", () => {
    const state = createAppState();
    // fresh install ships ESV + UCVNTR — the choice is not clear
    expect(state.settings.translations.length).toBeGreaterThan(1);
    const { screen, navigate } = renderAddFlow(state);

    // the flow opens on the translation step, and the picker is nowhere yet
    expect(screen.getByText(t("SelectTranslationTitle"))).toBeTruthy();
    state.settings.translations.forEach((tr) =>
      expect(screen.getByText(tr.name)).toBeTruthy()
    );
    expect(pickerModal(screen)).toBeUndefined();

    fireEvent.press(screen.getByText(state.settings.translations[1].name));

    // only now does the address picker open
    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
    expect(pickerModal(screen)).toBeTruthy();

    pickGenesis11(screen);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(SCREEN.passage, {
      address: GENESIS_1_1,
      translationId: state.settings.translations[1].id
    });
  });

  it("omits the selector and uses the only translation there is", () => {
    const state = createAppState();
    state.settings.translations = [state.settings.translations[0]];
    const { screen, navigate } = renderAddFlow(state);

    // nothing to choose between: the flow starts at the picker
    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
    expect(pickerModal(screen)).toBeTruthy();

    pickGenesis11(screen);

    expect(navigate).toHaveBeenCalledWith(SCREEN.passage, {
      address: GENESIS_1_1,
      translationId: state.settings.translations[0].id
    });
  });

  it("goes nowhere when the translation step is dismissed", () => {
    const { screen, navigate } = renderAddFlow(createAppState());

    expect(screen.getByText(t("SelectTranslationTitle"))).toBeTruthy();

    // the only modal on screen at this point — dismissing it is the
    // hardware-back / backdrop path
    const [openModal] = screen
      .UNSAFE_getAllByType(Modal)
      .filter((node) => node.props.visible === true);
    fireEvent(openModal, "requestClose");

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
    expect(pickerModal(screen)).toBeUndefined();
  });

  it("backs out of the picker into the translation step, not out of the flow", () => {
    const state = createAppState();
    const { screen, navigate } = renderAddFlow(state);

    fireEvent.press(screen.getByText(state.settings.translations[0].name));
    expect(pickerModal(screen)).toBeTruthy();

    pressPickerBack(screen);

    // the step in front of the picker is where back lands
    expect(pickerModal(screen)).toBeUndefined();
    expect(screen.getByText(t("SelectTranslationTitle"))).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();

    // and the answer can be changed on the way through the second time
    fireEvent.press(screen.getByText(state.settings.translations[1].name));
    pickGenesis11(screen);
    expect(navigate).toHaveBeenCalledWith(SCREEN.passage, {
      address: GENESIS_1_1,
      translationId: state.settings.translations[1].id
    });
  });

  it("closes the flow when backing out of a picker with nothing in front of it", () => {
    const state = createAppState();
    state.settings.translations = [state.settings.translations[0]];
    const { screen, navigate } = renderAddFlow(state);

    pressPickerBack(screen);

    expect(pickerModal(screen)).toBeUndefined();
    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});

/**
 * 8.2.2 — the list's own toolbar after the modal purge: filters left for a
 * screen, sorting became a popup hanging off the button that opens it.
 */
describe("ListScreen toolbar (8.2.2)", () => {
  // A list with something in it, so the add flow does not open on mount.
  const stateWithAPassage = () => {
    const state = createAppState();
    state.passages = [createPassage(createAddress(), "", undefined, undefined)];
    return state;
  };

  const pressIcon = (screen: Screen, icon: IconName) => {
    const button = screen
      .UNSAFE_getAllByType(IconButton)
      .find((node) => node.props.icon === icon);
    expect(button).toBeTruthy();
    fireEvent.press(
      within(button!).UNSAFE_getAllByProps({ accessible: true })[0]
    );
  };

  it("sends the filter button to the filters screen instead of a modal", () => {
    const { screen, navigate } = renderAddFlow(stateWithAPassage());

    expect(screen.queryByText(t("TitleFilters"))).toBeNull();
    pressIcon(screen, IconName.filter);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(SCREEN.listFilters);
    // nothing opened on top of the list
    expect(screen.queryByText(t("SelectedLevel"))).toBeNull();
  });

  it("opens the sort popup and closes it as soon as a sort is picked", () => {
    const state = stateWithAPassage();
    const { screen, navigate } = renderAddFlow(state);

    expect(screen.queryByText(t("TitleSort"))).toBeNull();
    pressIcon(screen, IconName.sort);
    expect(screen.getByText(t("TitleSort"))).toBeTruthy();
    // every sorting option is offered
    Object.values(SORTINGOPTION).forEach((option) =>
      expect(screen.getByText(t(option))).toBeTruthy()
    );

    fireEvent.press(screen.getByText(t(SORTINGOPTION.resentlyCreated)));

    // a popup is a one-tap surface: picking is also dismissing
    expect(screen.queryByText(t("TitleSort"))).toBeNull();
    // and it never navigates anywhere
    expect(navigate).not.toHaveBeenCalled();
  });
});

/**
 * 8.2.4 — the row itself: swipe actions moved onto ReanimatedSwipeable and the
 * row's Pressable moved INSIDE it. jest cannot perform a swipe (the pan handler
 * needs a real gesture), but both action panels are in the tree at rest —
 * ReanimatedSwipeable renders them behind an opacity of 0 — so what each action
 * says and what it does is testable here. The drag itself is device work.
 */
describe("ListScreen row interactions (8.2.4)", () => {
  // A real stateful context, as in FiltersScreen.test: a swipe action only
  // proves anything if the state it writes comes back into the list.
  const renderList = (initialState: AppStateModel) => {
    const navigate = jest.fn();
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
            <ListScreen {...makeScreenProps(SCREEN.listPassage, navigate)} />
          </SafeAreaProvider>
        </AppContext.Provider>
      );
    };
    return { screen: render(<Harness />), navigate, seen };
  };

  // A distinct left-swipe tag is what keeps the two panels apart: with the
  // default (ARCHIVED_NAME) both sides of a row read "Archive" and neither is
  // findable by its text.
  const SWIPE_TAG = "soon";
  const VERSE = "in the beginning";
  const stateWith = (...passageTags: string[][]): AppStateModel => {
    const state = createAppState();
    state.passages = passageTags.map((tags) => ({
      ...createPassage(createAddress(), VERSE, undefined, undefined),
      tags
    }));
    state.settings.leftSwipeTag = SWIPE_TAG;
    return state;
  };

  it("puts the configured tag on the row the left action belongs to", () => {
    // Two tagged passages: the second keeps SWIPE_TAG alive (the reducer heals a
    // swipe tag no passage carries back to ARCHIVED_NAME), and a passage with no
    // tags at all would be filtered out of the list by the other one's tag.
    const { screen, seen } = renderList(stateWith(["read"], [SWIPE_TAG]));

    // only the row without it offers to add it — the other offers to remove
    fireEvent.press(screen.getByText(`${t("Add")} ${SWIPE_TAG}`));

    expect(seen.state.passages[0].tags).toContain(SWIPE_TAG);
    expect(seen.state.settings.leftSwipeTag).toBe(SWIPE_TAG);
  });

  it("archives from the right, and the row leaves the default view", () => {
    const { screen, seen } = renderList(stateWith([]));

    expect(screen.getByText(VERSE)).toBeTruthy();
    fireEvent.press(screen.getByText(t("Archive")));

    expect(seen.state.passages[0].tags).toContain(ARCHIVED_NAME);
    // archived is filtered out by default, so the row is gone and only the
    // hidden-count footer is left behind
    expect(screen.queryByText(VERSE)).toBeNull();
    expect(screen.getByText(`${t("PassagesHidden")} 1`)).toBeTruthy();
  });

  it("asks before removing an archived row", () => {
    const state = stateWith([ARCHIVED_NAME]);
    // show the archived ones, which is the only place the Remove action lives
    state.filters.tags = [];
    const { screen, seen } = renderList(state);

    expect(screen.queryByText(t("PassageDeleteConfirmationText"))).toBeNull();
    fireEvent.press(screen.getByText(t("Remove")));

    // a destructive action is still a question, not a swipe (CODING_RULES §4)
    expect(screen.getByText(t("PassageDeleteConfirmationText"))).toBeTruthy();
    expect(seen.state.passages).toHaveLength(1);

    // "Remove" now labels the dialog's confirm button as well as the action
    fireEvent.press(screen.getAllByText(t("Remove"))[1]);
    expect(seen.state.passages).toHaveLength(0);
  });

  it("opens the editor from a tap on the row", () => {
    const { screen, seen, navigate } = renderList(stateWith([]));

    // the Pressable is inside the swipeable now, wrapping the row and nothing
    // else — a tap on the verse still has to reach it
    fireEvent.press(screen.getByText(VERSE));

    expect(navigate).toHaveBeenCalledWith(SCREEN.passage, {
      passageId: seen.state.passages[0].id
    });
  });
});
