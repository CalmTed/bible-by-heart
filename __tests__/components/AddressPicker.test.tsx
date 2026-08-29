import { fireEvent } from "@testing-library/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  renderWithContext,
  RenderWithContextOptions
} from "../../test-utils/renderWithContext";
import { AddressPicker } from "../../src/components/AddressPicker";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { createT } from "../../src/l10n";

// The picker draws the app's `Header` since 8.2.3, and the Header takes its top
// margin from the device — so it needs a provider that knows the insets.
// SafeAreaProvider renders nothing until it does.
const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 }
};

const renderPicker = (
  ui: React.ReactElement,
  options: RenderWithContextOptions = {}
) =>
  renderWithContext(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>{ui}</SafeAreaProvider>,
    options
  );

describe("testing address picker", () => {
  const t = createT(LANGCODE.en);

  it("renders correctly", async () => {
    const tree = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />,
      { langCode: LANGCODE.ua }
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("offers a primary 'add' action after a single start verse is picked (8.1.7)", () => {
    const onConfirm = jest.fn();
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={onConfirm} />
    );
    // Genesis -> chapter 1 -> verse 1
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1

    // footer is shown; picking a verse does NOT auto-advance into range mode
    expect(screen.getByText(t("APAddVerse"))).toBeTruthy();
    expect(screen.getByText(t("APExtendRange"))).toBeTruthy();

    fireEvent.press(screen.getByText(t("APAddVerse")));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({
      bookIndex: 0,
      startChapterNum: 0,
      startVerseNum: 0,
      endChapterNum: 0,
      endVerseNum: 0
    });
  });

  it("lets the user extend the range instead of adding one verse (8.1.7)", () => {
    const onConfirm = jest.fn();
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={onConfirm} />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1

    fireEvent.press(screen.getByText(t("APExtendRange")));

    // footer gone, we are now picking the end chapter — no early confirm yet
    expect(screen.queryByText(t("APAddVerse"))).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("titles the header from what is picked, not from the part being edited (8.2.1a)", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    // nothing picked yet
    expect(screen.getByText(t("APSelectBook"))).toBeTruthy();

    fireEvent.press(screen.getByText(t("bGenShrt")));
    expect(screen.getByText(t("bGenLong"))).toBeTruthy();

    fireEvent.press(screen.getByText("1")); // chapter 1
    expect(screen.getByText(`${t("bGenLong")} 1`)).toBeTruthy();

    // the start verse used to stay invisible: the picker stops here (8.1.7), so a
    // curPartIndex-driven title could never reach it
    fireEvent.press(screen.getByText("1")); // start verse 1
    expect(screen.getByText(`${t("bGenLong")} 1:1`)).toBeTruthy();
  });

  it("shows the range being built in the header title (8.2.1a)", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1
    fireEvent.press(screen.getByText(t("APExtendRange")));

    fireEvent.press(screen.getByText("3")); // end chapter 3
    expect(screen.getByText(`${t("bGenLong")} 1:1-3`)).toBeTruthy();
  });

  it("drops the un-picked part from the title when going back (8.2.1a)", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    expect(screen.getByText(`${t("bGenLong")} 1`)).toBeTruthy();

    // the back action is the first pressable host node in the tree (the header's
    // left IconButton); it carries no text or testID to query by
    fireEvent.press(screen.UNSAFE_getAllByProps({ accessible: true })[0]);
    // back un-picks the chapter, so the title recedes to the book alone
    expect(screen.getByText(t("bGenLong"))).toBeTruthy();
  });

  it("marks the selected start verse with a gradient outline, not a flat fill (8.2.1a)", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    // the ring is the only round (66px) gradient in the tree — src/ carries no
    // testIDs and one test is not a reason to start that convention
    const rings = () =>
      screen
        .UNSAFE_queryAllByType(LinearGradient)
        .filter((node) => (node.props.style as { width?: number }).width === 66);

    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    expect(rings()).toHaveLength(0);

    fireEvent.press(screen.getByText("1")); // start verse 1
    const { colors } = getThemeFromScheme(THEMETYPE.dark);
    expect(rings()).toHaveLength(1);
    expect(rings()[0].props.colors).toEqual([
      colors.gradient1,
      colors.gradient2
    ]);
  });

  it("renders the single-verse state with an in-flow footer (8.2.1a)", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1
    expect(screen.toJSON()).toMatchSnapshot();
  });
});
