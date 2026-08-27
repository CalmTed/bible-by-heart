/**
 * 8.2.1b — the add-passage flow: after the address, the translation is the next
 * thing the user meets, and only when it is not already clear.
 */
import { fireEvent } from "@testing-library/react-native";
import { Modal } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { ListScreen } from "../../src/screens/ListScreen";
import { LANGCODE, SCREEN } from "../../src/constants";
import { createAppState } from "../../src/initials";
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

// An empty passage list opens the address picker on mount (the add flow's
// entry point), so the test starts exactly where the user does.
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

// Genesis 1:1 through the picker, ending on its single-verse "add" action.
const pickGenesis11 = (screen: ReturnType<typeof renderAddFlow>["screen"]) => {
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

describe("ListScreen add-passage flow (8.2.1b)", () => {
  it("asks for the translation right after the address when several exist", () => {
    const state = createAppState();
    // fresh install ships ESV + UCVNTR — the choice is not clear
    expect(state.settings.translations.length).toBeGreaterThan(1);
    const { screen, navigate } = renderAddFlow(state);

    pickGenesis11(screen);

    // the editor is not reached yet: the translation step comes first
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText(t("SelectTranslationTitle"))).toBeTruthy();
    state.settings.translations.forEach((tr) =>
      expect(screen.getByText(tr.name)).toBeTruthy()
    );

    fireEvent.press(screen.getByText(state.settings.translations[1].name));

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

    pickGenesis11(screen);

    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
    expect(navigate).toHaveBeenCalledWith(SCREEN.passage, {
      address: GENESIS_1_1,
      translationId: state.settings.translations[0].id
    });
  });

  it("goes nowhere when the translation step is dismissed", () => {
    const { screen, navigate } = renderAddFlow(createAppState());

    pickGenesis11(screen);
    expect(screen.getByText(t("SelectTranslationTitle"))).toBeTruthy();

    // the only modal on screen at this point (the address picker closed on
    // confirm) — dismissing it is the hardware-back / backdrop path
    const [openModal] = screen.UNSAFE_getAllByType(Modal).filter(
      (node) => node.props.visible === true
    );
    fireEvent(openModal, "requestClose");

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByText(t("SelectTranslationTitle"))).toBeNull();
  });
});
