/**
 * 8.2.5 — the finish screen as a shell.
 *
 * The screen says one thing today, so what is worth pinning is the SHAPE 8.5.2
 * will fill: the device's top margin through a bare Header, a body that can
 * scroll (the old `flex: 4` hero over a `flex: 1` button could not host a
 * session summary at all), and a Continue button that leaves for home.
 *
 * The rule that a finish screen must never show an error count already has its
 * own guard, against real finished sessions, in `e2e/flow.test.tsx`.
 */
import { fireEvent } from "@testing-library/react-native";
import { ScrollView } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { FinishScreen } from "../../src/screens/FinishScreen";
import { Header } from "../../src/components/Header";
import { LANGCODE, SCREEN } from "../../src/constants";
import { createT } from "../../src/l10n";
import type {
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

const renderFinish = () => {
  const navigate = jest.fn();
  const screen = renderWithContext(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <FinishScreen {...makeScreenProps(SCREEN.testResults, navigate)} />
    </SafeAreaProvider>
  );
  return { screen, navigate };
};

describe("FinishScreen (8.2.5)", () => {
  it("congratulates and offers the way out", () => {
    const { screen, navigate } = renderFinish();

    expect(screen.getByText(t("titleWelldone"))).toBeTruthy();
    fireEvent.press(screen.getByText(t("Continue")));
    expect(navigate).toHaveBeenCalledWith(SCREEN.home);
  });

  it("takes its top margin from the device, through a bare Header", () => {
    const { screen } = renderFinish();

    const header = screen.UNSAFE_getAllByType(Header);
    expect(header).toHaveLength(1);
    // bare: no title, no back, no actions - the margin and nothing else
    expect(header[0].props).toEqual({});
  });

  it("gives the session summary (8.5.2) a body that can scroll", () => {
    const { screen } = renderFinish();

    const body = screen.UNSAFE_getAllByType(ScrollView);
    expect(body).toHaveLength(1);
    // flexGrow, not flex: with nothing in it yet the cup still centres, and a
    // summary longer than the screen scrolls instead of squeezing the hero
    expect(body[0].props.contentContainerStyle).toEqual(
      expect.objectContaining({ flexGrow: 1, justifyContent: "center" })
    );
  });
});
