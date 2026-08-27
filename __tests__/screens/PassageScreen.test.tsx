/**
 * 8.2.1c — the end of the add-passage journey: having just met a passage, the
 * user is offered a session on that one alone. These drive the real editor's
 * Save button rather than calling the handler, so they break if the offer stops
 * being reachable from where the user actually is.
 */
import { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "../../src/context/AppContext";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { PassageScreen } from "../../src/screens/PassageScreen";
import { LANGCODE, SCREEN, STUDY_ONE_REPEATS, THEMETYPE } from "../../src/constants";
import { createAddress, createAppState } from "../../src/initials";
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

const GENESIS_1_1 = {
  ...createAddress(),
  bookIndex: 0,
  startChapterNum: 0,
  startVerseNum: 0,
  endChapterNum: 0,
  endVerseNum: 0
};

const makeScreenProps = <T extends keyof RootStackParamList>(
  name: T,
  navigate: jest.Mock,
  params: RootStackParamList[T]
) =>
  ({
    navigation: { navigate, goBack: () => {}, addListener: () => () => {} },
    route: { key: `${String(name)}-stub`, name, params }
  }) as unknown as ScreenPropsModel<T>;

// A REAL stateful context: the offer's whole point is that the passage is saved
// first and the session generated from the saved state, so a no-op setState
// (renderWithContext's) would not exercise it. Everything else is inert.
const renderPassageScreen = (
  initialState: AppStateModel,
  params: RootStackParamList[SCREEN.passage]
) => {
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
          <PassageScreen
            {...makeScreenProps(SCREEN.passage, navigate, params)}
          />
        </SafeAreaProvider>
      </AppContext.Provider>
    );
  };
  const screen = render(<Harness />);
  return { screen, navigate, seen };
};

// A new passage seeded with an address AND text: text already present keeps the
// editor's mount effect from firing a network fetch.
const newPassageParams = {
  address: GENESIS_1_1,
  passageText: "In the beginning God created the heaven and the earth",
  translationId: 1
};

describe("PassageScreen study-one offer (8.2.1c)", () => {
  it("offers a session on the passage just added", () => {
    const { screen } = renderPassageScreen(createAppState(), newPassageParams);
    expect(screen.queryByText(t("StudyOneOfferText"))).toBeNull();

    fireEvent.press(screen.getByText(t("Save")));

    expect(screen.getByText(t("StudyOneOfferText"))).toBeTruthy();
    expect(screen.getByText(t("StudyOneOfferConfirm"))).toBeTruthy();
  });

  it("accepting it generates a session on that passage alone and opens training", () => {
    const { screen, navigate, seen } = renderPassageScreen(
      createAppState(),
      newPassageParams
    );

    fireEvent.press(screen.getByText(t("Save")));
    fireEvent.press(screen.getByText(t("StudyOneOfferConfirm")));

    const added = seen.state.passages[0];
    expect(added).toBeTruthy();
    expect(seen.state.testsActive).toHaveLength(STUDY_ONE_REPEATS);
    expect(seen.state.testsActive.every((tst) => tst.pi === added.id)).toBe(
      true
    );
    expect(navigate).toHaveBeenCalledWith(SCREEN.test);
  });

  it("declining it saves the passage and goes to the list, with no session", () => {
    const { screen, navigate, seen } = renderPassageScreen(
      createAppState(),
      newPassageParams
    );

    fireEvent.press(screen.getByText(t("Save")));
    fireEvent.press(screen.getByText(t("StudyOneOfferCancel")));

    expect(seen.state.passages).toHaveLength(1);
    expect(seen.state.testsActive).toHaveLength(0);
    expect(navigate).toHaveBeenCalledWith(SCREEN.listPassage);
  });

  it("does not offer anything when an existing passage is edited", () => {
    const state = createAppState();
    const { screen, navigate, seen } = renderPassageScreen(
      state,
      newPassageParams
    );
    // save once to get a stored passage, decline the offer
    fireEvent.press(screen.getByText(t("Save")));
    fireEvent.press(screen.getByText(t("StudyOneOfferCancel")));
    const stored = seen.state.passages[0];

    // reopen the SAME passage by id: now it is an edit, not a first meeting
    const editing = renderPassageScreen(seen.state, {
      passageId: stored.id
    });
    fireEvent.press(editing.screen.getByText(t("Save")));

    expect(editing.screen.queryByText(t("StudyOneOfferText"))).toBeNull();
    expect(editing.navigate).toHaveBeenCalledWith(SCREEN.listPassage);
    expect(navigate).toBeTruthy();
  });

  it("does not offer a drill on a passage with no text to be tested on", () => {
    const { screen, navigate } = renderPassageScreen(createAppState(), {
      address: GENESIS_1_1,
      passageText: "   ",
      translationId: 1
    });

    fireEvent.press(screen.getByText(t("Save")));

    expect(screen.queryByText(t("StudyOneOfferText"))).toBeNull();
    expect(navigate).toHaveBeenCalledWith(SCREEN.listPassage);
  });
});
