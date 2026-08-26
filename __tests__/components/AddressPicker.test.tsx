import { fireEvent } from "@testing-library/react-native";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { AddressPicker } from "../../src/components/AddressPicker";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";

describe("testing address picker", () => {
  const t = createT(LANGCODE.en);

  it("renders correctly", async () => {
    const tree = renderWithContext(
      <AddressPicker visible={true} onCancel={() => {}} onConfirm={() => {}} />,
      { langCode: LANGCODE.ua }
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("offers a primary 'add' action after a single start verse is picked (8.1.7)", () => {
    const onConfirm = jest.fn();
    const screen = renderWithContext(
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
    const screen = renderWithContext(
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
});
