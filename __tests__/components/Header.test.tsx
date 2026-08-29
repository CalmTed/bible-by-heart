import { StyleSheet, Text, ViewStyle } from "react-native";
import { fireEvent, within } from "@testing-library/react-native";
import type { ReactTestRendererJSON } from "react-test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Header, HEADER_HEIGHT } from "../../src/components/Header";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";
import { renderWithContext } from "../../test-utils/renderWithContext";

// SafeAreaProvider renders nothing until it knows the insets — the old version
// of this file wrapped the Header in a bare provider, so it snapshotted an
// empty tree and asserted nothing about the Header at all (found in 8.2.3).
const TOP_INSET = 47;
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: TOP_INSET, left: 0, right: 0, bottom: 34 }
};

const renderHeader = (ui: React.ReactElement) =>
  renderWithContext(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>{ui}</SafeAreaProvider>
  );

type Screen = ReturnType<typeof renderHeader>;

// The bar is the Header's own root view; find it by the one style property only
// it carries rather than by walking a fixed number of parents, so the test does
// not break the next time the tree gains a wrapper.
const findStyleWith = (
  node: ReactTestRendererJSON | string | null,
  key: keyof ViewStyle
): ViewStyle | null => {
  if (!node || typeof node === "string") {
    return null;
  }
  const style = StyleSheet.flatten(node.props.style as ViewStyle);
  if (style && style[key] !== undefined) {
    return style;
  }
  for (const child of node.children ?? []) {
    const found = findStyleWith(child, key);
    if (found) {
      return found;
    }
  }
  return null;
};

const pressIcon = (screen: Screen, icon: IconName) => {
  const button = screen
    .UNSAFE_getAllByType(IconButton)
    .find((node) => node.props.icon === icon);
  expect(button).toBeTruthy();
  fireEvent.press(within(button!).UNSAFE_getAllByProps({ accessible: true })[0]);
};

/**
 * The app's one header (8.2.3). What matters is that every screen gets the same
 * bar in the same place — so these test the contract screens rely on, not the
 * markup.
 */
describe("Header (8.2.3)", () => {
  it("renders its title", () => {
    const screen = renderHeader(<Header title="Passages" />);

    expect(screen.getByText("Passages")).toBeTruthy();
  });

  it("takes its top margin from the device, not from a constant", () => {
    const screen = renderHeader(<Header title="Passages" />);

    // The bar clears the real status bar / cutout with the device's own inset
    // and is exactly that much taller than its own height. A fixed guess here
    // is a header behind the camera on one phone and floating on another.
    const bar = findStyleWith(screen.toJSON(), "paddingTop");
    expect(bar?.paddingTop).toBe(TOP_INSET);
    expect(bar?.height).toBe(HEADER_HEIGHT + TOP_INSET);
  });

  it("with nothing in it, is the device margin and no bar", () => {
    // How home and the finish screen get the same top clearance as every other
    // screen without touching `insets` themselves. A bare 60px band would be
    // dead space, so only the inset is reserved.
    const screen = renderHeader(<Header />);

    const bar = findStyleWith(screen.toJSON(), "paddingTop");
    expect(bar?.paddingTop).toBe(TOP_INSET);
    expect(bar?.height).toBe(TOP_INSET);
  });

  it("shows no leading button until it is given something to do", () => {
    const screen = renderHeader(<Header title="Passages" />);

    expect(screen.UNSAFE_queryAllByType(IconButton)).toHaveLength(0);
  });

  it("calls onBack from the leading button", () => {
    const onBack = jest.fn();
    const screen = renderHeader(<Header title="Passages" onBack={onBack} />);

    pressIcon(screen, IconName.back);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("wears the back arrow by default and the given icon when asked", () => {
    const onBack = jest.fn();
    const back = renderHeader(<Header title="A" onBack={onBack} />);
    expect(
      back.UNSAFE_getAllByType(IconButton)[0].props.icon
    ).toBe(IconName.back);

    // the training session is left, not returned from — hence a cross
    const exit = renderHeader(
      <Header onBack={onBack} backIcon={IconName.cross} />
    );
    expect(
      exit.UNSAFE_getAllByType(IconButton)[0].props.icon
    ).toBe(IconName.cross);
  });

  it("renders trailing actions", () => {
    const onAdd = jest.fn();
    const screen = renderHeader(
      <Header
        title="Passages"
        right={<IconButton icon={IconName.add} onPress={onAdd} />}
      />
    );

    pressIcon(screen, IconName.add);

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("renders children in the centre when there is no title", () => {
    const screen = renderHeader(
      <Header>
        <Text>dots</Text>
      </Header>
    );

    expect(screen.getByText("dots")).toBeTruthy();
  });

  it("prefers a title over children, so the two can never both show", () => {
    const screen = renderHeader(
      <Header title="Passages">
        <Text>dots</Text>
      </Header>
    );

    expect(screen.getByText("Passages")).toBeTruthy();
    expect(screen.queryByText("dots")).toBeNull();
  });

  it("keeps a long title on one line instead of growing the bar", () => {
    const screen = renderHeader(
      <Header title="A title far too long to fit across a phone header" />
    );

    expect(
      screen.getByText("A title far too long to fit across a phone header").props
        .numberOfLines
    ).toBe(1);
  });

  it("exports its own height, so screens can lay out under it", () => {
    expect(HEADER_HEIGHT).toBeGreaterThan(0);
  });
});
