/**
 * 8.2.5 — the training session's wrapper.
 *
 * The session is the core product, so what is pinned here is the wrapper's
 * behaviour rather than its looks: which test is on screen, the dot row that
 * moves between them, and the one way out. The dot row in particular is why this
 * file exists — it used to be a component built inside TestsScreen's render, so
 * it was a new component type on every render and React remounted the whole row
 * each time anything in the session changed.
 *
 * The level components underneath have their own suites; this one drives L10
 * because it is the level whose right answer is a single button press.
 */
import { useState } from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "../../src/context/AppContext";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { TestsScreen } from "../../src/screens/TestsScreen";
import { TestNavDot } from "../../src/components/TestNavDot";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";
import { Address } from "../../src/utils/address";
import { LANGCODE, SCREEN, TESTLEVEL, THEMETYPE } from "../../src/constants";
import { createAppState, createPassage } from "../../src/initials";
import { createT } from "../../src/l10n";
import type {
  AddressType,
  AppStateModel,
  PassageModel,
  RootStackParamList,
  ScreenPropsModel,
  TestModel
} from "../../src/models";

// The screen bounces out of an invalid session only while it is FOCUSED, and
// `useIsFocused` needs a real navigator to answer. Rendered outside one, the
// screen is the focused screen.
// Only that one hook is replaced: AppContext pulls in the navigator, which needs
// the rest of the module to be the real thing.
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: () => true
}));

const t = createT(LANGCODE.en);

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

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

const JOHN_3_16: AddressType = {
  bookIndex: 42,
  startChapterNum: 2,
  startVerseNum: 15,
  endChapterNum: null,
  endVerseNum: null
};
const PSALM_23_1: AddressType = {
  bookIndex: 18,
  startChapterNum: 22,
  startVerseNum: 0,
  endChapterNum: null,
  endVerseNum: null
};

/**
 * An l10 test: the verse is shown, and the answer is one of the address buttons.
 * Built by hand rather than through `createTest`, which picks l10 or l11 at
 * random for a level-1 passage — a coin flip is not a fixture.
 */
const makeL10Test = (
  passage: PassageModel,
  options: AddressType[],
  overrides: Partial<TestModel> = {}
): TestModel => ({
  i: passage.id + 1,
  si: 777,
  pi: passage.id,
  ui: null,
  td: [],
  f: false,
  l: TESTLEVEL.l10,
  d: { addressOptions: options },
  en: null,
  et: [],
  wa: [],
  wp: [],
  ww: [],
  ...overrides
});

const makeSession = (overrides: Partial<TestModel>[] = [{}, {}]) => {
  const base = createAppState();
  const john = createPassage(JOHN_3_16, "For God so loved the world.", 1);
  const psalm = createPassage(PSALM_23_1, "The Lord is my shepherd.", 1);
  const options = [JOHN_3_16, PSALM_23_1];
  return {
    ...base,
    passages: [john, psalm],
    testsActive: [
      makeL10Test(john, options, overrides[0]),
      makeL10Test(psalm, options, overrides[1])
    ]
  } as AppStateModel;
};

// A real stateful context: every assertion below is about what the session
// looks like AFTER the reducer answered, so renderWithContext's no-op setState
// would prove nothing.
const renderSession = (initialState: AppStateModel) => {
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
          <TestsScreen {...makeScreenProps(SCREEN.test, navigate)} />
        </SafeAreaProvider>
      </AppContext.Provider>
    );
  };
  const screen = render(<Harness />);
  return { screen, navigate, seen };
};

type Screen = ReturnType<typeof renderSession>["screen"];

const dots = (screen: Screen) => screen.UNSAFE_getAllByType(TestNavDot);

const pressIcon = (screen: Screen, icon: IconName) => {
  const button = screen
    .UNSAFE_getAllByType(IconButton)
    .find((node) => node.props.icon === icon);
  expect(button).toBeTruthy();
  fireEvent.press(
    within(button!).UNSAFE_getAllByProps({ accessible: true })[0]
  );
};

describe("TestsScreen (8.2.5)", () => {
  it("shows the first unfinished test and one dot per test", () => {
    const { screen } = renderSession(makeSession());

    // the level content is the first test's verse, not the second's
    expect(screen.getByText("For God so loved the world.")).toBeTruthy();
    expect(screen.queryByText("The Lord is my shepherd.")).toBeNull();
    // both answers are offered, and the level label came from the test's level
    expect(screen.getByText(Address.format(JOHN_3_16, t))).toBeTruthy();
    expect(screen.getByText(Address.format(PSALM_23_1, t))).toBeTruthy();
    expect(screen.getByText(`${t("Level")} 1`)).toBeTruthy();

    const bar = dots(screen);
    expect(bar).toHaveLength(2);
    expect(bar.map((dot) => dot.props.isCurrent)).toEqual([true, false]);
  });

  it("opens the session on the first UNFINISHED test, not the first one", () => {
    const { screen } = renderSession(makeSession([{ f: true }, {}]));

    expect(screen.getByText("The Lord is my shepherd.")).toBeTruthy();
    expect(dots(screen).map((dot) => dot.props.isCurrent)).toEqual([
      false,
      true
    ]);
  });

  it("moves back to a finished test when its dot is pressed", () => {
    const { screen } = renderSession(makeSession([{ f: true }, {}]));

    fireEvent.press(
      within(dots(screen)[0]).UNSAFE_getAllByProps({ accessible: true })[0]
    );

    expect(screen.getByText("For God so loved the world.")).toBeTruthy();
    expect(dots(screen).map((dot) => dot.props.isCurrent)).toEqual([
      true,
      false
    ]);
  });

  it("ignores a dot the user has not reached yet", () => {
    // second test is neither finished, nor errored, nor next in line
    const { screen } = renderSession(makeSession());

    fireEvent.press(
      within(dots(screen)[1]).UNSAFE_getAllByProps({ accessible: true })[0]
    );

    expect(screen.getByText("For God so loved the world.")).toBeTruthy();
  });

  it("answers a test and advances to the next one", () => {
    const { screen, seen, navigate } = renderSession(makeSession());

    fireEvent.press(screen.getByText(Address.format(JOHN_3_16, t)));

    expect(seen.state.testsActive[0].f).toBe(true);
    expect(screen.getByText("The Lord is my shepherd.")).toBeTruthy();
    // the session is not over, so nothing navigated anywhere
    expect(navigate).not.toHaveBeenCalled();
  });

  it("commits the session to history and opens the finish screen on the last answer", () => {
    const { screen, seen, navigate } = renderSession(
      makeSession([{ f: true }, {}])
    );

    fireEvent.press(screen.getByText(Address.format(PSALM_23_1, t)));

    expect(seen.state.testsActive).toHaveLength(0);
    expect(seen.state.testsHistory).toHaveLength(2);
    expect(navigate).toHaveBeenCalledWith(SCREEN.testResults);
  });

  it("asks before leaving, and cancelling keeps the session", () => {
    const { screen, seen, navigate } = renderSession(makeSession());

    expect(screen.queryByText(t("TestExitConfirmationText"))).toBeNull();
    pressIcon(screen, IconName.cross);

    expect(screen.getByText(t("TestExitConfirmationText"))).toBeTruthy();
    fireEvent.press(screen.getByText(t("Cancel")));

    expect(seen.state.testsActive).toHaveLength(2);
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByText("For God so loved the world.")).toBeTruthy();
  });

  it("throws the session away and goes home when the exit is confirmed", () => {
    const { screen, seen, navigate } = renderSession(makeSession());

    pressIcon(screen, IconName.cross);
    fireEvent.press(screen.getByText(t("ExitTesting")));

    // "passed tests will not be saved" — nothing reached history
    expect(seen.state.testsActive).toHaveLength(0);
    expect(seen.state.testsHistory).toHaveLength(0);
    expect(navigate).toHaveBeenCalledWith(SCREEN.home);
  });

  it("leaves an empty session instead of rendering one", () => {
    const { screen, navigate } = renderSession({
      ...makeSession(),
      testsActive: []
    });

    expect(screen.queryByText("For God so loved the world.")).toBeNull();
    expect(navigate).toHaveBeenCalledWith(SCREEN.home);
  });

  it("leaves a session whose passage was deleted, without answering it", () => {
    const session = makeSession();
    const { seen, navigate } = renderSession({
      ...session,
      passages: session.passages.filter(
        (p) => p.id !== session.testsActive[0].pi
      )
    });

    expect(navigate).toHaveBeenCalledWith(SCREEN.home);
    expect(seen.state.testsHistory).toHaveLength(0);
  });
});
