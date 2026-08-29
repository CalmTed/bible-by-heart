/**
 * 8.2.31 — the home column. The screen used to hold its logo in a `flex: 1`
 * box that centred it, so every pixel of slack collected in two equal voids —
 * one above the mark, one under "Days stroke" — while the week row sat pinned
 * above the buttons. The mark is a share of the screen now and the blocks are
 * spaced on purpose.
 */
import { render } from "@testing-library/react-native";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { SvgXml } from "react-native-svg";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppContext } from "../../src/context/AppContext";
import { makeContextValue } from "../../test-utils/renderWithContext";
import { HomeScreen } from "../../src/screens/HomeScreen";
import { HomeSwipe } from "../../src/components/HomeSwipe";
import { LAYOUT, LOGO_RATIO, SCREEN } from "../../src/constants";
import { createAppState } from "../../src/initials";
import { makeLevelPassage } from "../fixtures/levelPassages";
import type {
  AppStateModel,
  RootStackParamList,
  ScreenPropsModel
} from "../../src/models";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions");

const mockedDimensions = useWindowDimensions as jest.MockedFunction<
  typeof useWindowDimensions
>;

const setWindow = (width: number, height: number) =>
  mockedDimensions.mockReturnValue({
    width,
    height,
    scale: 2,
    fontScale: 1
  });

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

const makeScreenProps = <T extends keyof RootStackParamList>(name: T) =>
  ({
    navigation: { navigate: jest.fn(), goBack: () => {}, addListener: () => () => {} },
    route: { key: `${String(name)}-stub`, name, params: undefined }
  }) as unknown as ScreenPropsModel<T>;

const renderHome = (
  screenProps: ScreenPropsModel<SCREEN.home> = makeScreenProps(SCREEN.home),
  state?: AppStateModel
) =>
  render(
    <AppContext.Provider value={makeContextValue({ state })}>
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <HomeScreen {...screenProps} />
      </SafeAreaProvider>
    </AppContext.Provider>
  );

/** A library with something in it, so practice and stats lead somewhere. */
const stateWithPassages = (): AppStateModel =>
  ({
    ...createAppState(),
    passages: [makeLevelPassage()]
  }) as AppStateModel;

const logoSize = (screen: ReturnType<typeof renderHome>) => {
  const svg = screen.UNSAFE_getAllByType(SvgXml)[0];
  return {
    width: Number(svg.props.width),
    height: Number(svg.props.height)
  };
};

describe("HomeScreen layout (8.2.31)", () => {
  it("grows the mark with the screen instead of drawing 160px everywhere", () => {
    setWindow(390, 844);
    const tall = logoSize(renderHome());
    setWindow(390, 1180);
    const taller = logoSize(renderHome());

    expect(taller.height).toBeGreaterThan(tall.height);
    // and never distorted: the artwork's own ratio decides the width
    expect(tall.width / tall.height).toBeCloseTo(LOGO_RATIO, 5);
    expect(taller.width / taller.height).toBeCloseTo(LOGO_RATIO, 5);
  });

  it("keeps it a logo rather than an icon on a short phone", () => {
    setWindow(320, 480);
    expect(logoSize(renderHome()).height).toBeGreaterThanOrEqual(96);
  });

  it("stops the mark at the content column on an unfolded foldable", () => {
    setWindow(1800, 2200);
    expect(logoSize(renderHome()).width).toBeLessThanOrEqual(
      LAYOUT.maxContentWidth
    );
  });

  it("spaces the blocks instead of centring one of them in all the slack", () => {
    setWindow(390, 844);
    const screen = renderHome();
    // the column that holds logo / week / buttons distributes the leftover
    const column = screen.UNSAFE_getAllByType(View).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.justifyContent === "space-between" && style?.flex === 1;
    });
    expect(column).toBeTruthy();
  });
});

describe("HomeScreen swipes (8.2.28)", () => {
  // The finger runs the way the card travels: settings lives beyond the LEFT
  // edge, so a swipe to the RIGHT is what pulls it in.
  it.each([
    ["right", SCREEN.settings],
    ["left", SCREEN.listPassage],
    ["up", SCREEN.stats]
  ] as const)("sends a %s swipe to its screen", (direction, screen) => {
    setWindow(390, 844);
    const screenProps = makeScreenProps(SCREEN.home);
    const home = renderHome(screenProps, stateWithPassages());
    home.UNSAFE_getByType(HomeSwipe).props.onSwipe(direction);
    expect(screenProps.navigation.navigate).toHaveBeenCalledWith(screen);
  });

  it("starts a session on the pull down, exactly as the button does", () => {
    setWindow(390, 844);
    const screenProps = makeScreenProps(SCREEN.home);
    const home = renderHome(screenProps, stateWithPassages());
    home.UNSAFE_getByType(HomeSwipe).props.onSwipe("down");
    expect(screenProps.navigation.navigate).toHaveBeenCalledWith(SCREEN.test);
  });

  it("offers nothing to practise or count when the library is empty", () => {
    setWindow(390, 844);
    const home = renderHome();
    expect(home.UNSAFE_getByType(HomeSwipe).props.available).toEqual([
      "left",
      "right"
    ]);
  });
});
