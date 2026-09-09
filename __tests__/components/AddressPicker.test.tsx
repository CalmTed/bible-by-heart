import { fireEvent } from "@testing-library/react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  renderWithContext,
  RenderWithContextOptions
} from "../../test-utils/renderWithContext";
import { AddressPicker } from "../../src/components/AddressPicker";
import { createAddressT } from "../../src/addressLanguage";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { SHIPPED_TRANSLATION_IDS } from "../../src/initials";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { createT } from "../../src/l10n";

// The picker draws the app's `Header`, and the Header takes its top margin from
// the device — so it needs a provider that knows the insets. SafeAreaProvider
// renders nothing until it does.
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
  // the picker names books in the language of the ADDRESS, so a test that
  // presses a book has to ask for it in the language that translation is in
  const ua = createAddressT(LANGCODE.ua);
  const ru = createAddressT("ru");

  it("renders correctly", async () => {
    const tree = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />,
      { langCode: LANGCODE.ua }
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("offers a primary 'add' action after a single start verse is picked", () => {
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

  it("lets the user extend the range instead of adding one verse", () => {
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

  it("titles the header from what is picked, not from the part being edited", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    // nothing picked yet
    expect(screen.getByText(t("APSelectBook"))).toBeTruthy();

    fireEvent.press(screen.getByText(t("bGenShrt")));
    expect(screen.getByText(t("bGenLong"))).toBeTruthy();

    fireEvent.press(screen.getByText("1")); // chapter 1
    expect(screen.getByText(`${t("bGenLong")} 1`)).toBeTruthy();

    // the start verse used to stay invisible: the picker stops here, so a
    // curPartIndex-driven title could never reach it
    fireEvent.press(screen.getByText("1")); // start verse 1
    expect(screen.getByText(`${t("bGenLong")} 1:1`)).toBeTruthy();
  });

  it("shows the range being built in the header title", () => {
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

  it("drops the un-picked part from the title when going back", () => {
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

  it("marks the selected start verse with a gradient outline, not a flat fill", () => {
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

  it("renders the single-verse state with an in-flow footer", () => {
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1
    expect(screen.toJSON()).toMatchSnapshot();
  });

  // Last on purpose: the two snapshots above carry react-test-renderer `nativeID`
  // counters, so a test inserted ahead of them renumbers the snapshot instead of
  // testing anything.
  it("says what the confirm actually does, not always 'Add'", () => {
    const screen = renderPicker(
      <AddressPicker
        confirmTitle="Submit"
        visible={true}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.press(screen.getByText(t("bGenShrt")));
    fireEvent.press(screen.getByText("1")); // chapter 1
    fireEvent.press(screen.getByText("1")); // start verse 1

    // the level screens open this very picker to ANSWER a test, and "Add" is a
    // lie about what the button is going to do there
    expect(screen.getByText(t("Submit"))).toBeTruthy();
    expect(screen.queryByText(t("APAddVerse"))).toBeNull();
  });

  it("offers the chapters the chosen translation has, not the fallback's", () => {
    // Огієнко splits Joel into four chapters; the KJV table the picker falls
    // back to stops at three, so the fourth button is the whole difference
    const fallback = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />
    );
    fireEvent.press(fallback.getByText(t("bJoelShrt")));
    expect(fallback.queryByText("4")).toBeNull();

    const ogi = renderPicker(
      <AddressPicker
        visible={true}
        translationId={SHIPPED_TRANSLATION_IDS["ukr-ogi"]}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.press(ogi.getByText(ua("bJoelShrt")));
    expect(ogi.getByText("4")).toBeTruthy();
  });

  it("draws no button for a chapter the translation does not have", () => {
    // Турконяк used to number 151 psalms; the psalm left the file it is served
    // from, so there is no 151st chapter to offer
    const screen = renderPicker(
      <AddressPicker
        visible={true}
        translationId={SHIPPED_TRANSLATION_IDS["ukr-turk"]}
        onCancel={() => {}}
        onConfirm={() => {}}
      />
    );
    fireEvent.press(screen.getByText(ua("bPsShrt")));
    expect(screen.getByText("150")).toBeTruthy();
    expect(screen.queryByText("151")).toBeNull();
  });

  it("names the books in the language of the address, not of the interface", () => {
    // a passage picked in the Синодальний is shown as "Иоанна 3:16" everywhere
    // else in the app, so the picker offering "John" was the one disagreement
    const screen = renderPicker(
      <AddressPicker
        visible={true}
        translationId={SHIPPED_TRANSLATION_IDS["rus-syn"]}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
      { langCode: LANGCODE.en }
    );
    expect(screen.getByText(ru("bJohnShrt"))).toBeTruthy();
    expect(screen.queryByText(t("bJohnShrt"))).toBeNull();
  });

  it("titles itself in the address language once a book is picked", () => {
    const screen = renderPicker(
      <AddressPicker
        visible={true}
        translationId={SHIPPED_TRANSLATION_IDS["rus-syn"]}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
      { langCode: LANGCODE.en }
    );
    fireEvent.press(screen.getByText(ru("bJohnShrt")));
    expect(screen.getByText(ru("bJohnLong"))).toBeTruthy();
  });

  it("falls back to the interface language when no translation is chosen", () => {
    // a translation the user typed themselves has no address language of its
    // own, and neither has a picker opened before anything is chosen
    const screen = renderPicker(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />,
      { langCode: LANGCODE.en }
    );
    expect(screen.getByText(t("bJohnShrt"))).toBeTruthy();
  });
});
