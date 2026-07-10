import { render, fireEvent } from "@testing-library/react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { ConfirmModal } from "../../src/components/ConfirmModal";

describe("testing confirm modal", () => {
  const theme = getThemeFromScheme(THEMETYPE.dark);
  const t = createT(LANGCODE.en);

  it("renders correctly", async () => {
    const tree = render(
      <ConfirmModal
        theme={theme}
        shown={true}
        text={t("PassageDeleteConfirmationText")}
        confirmTitle={t("Remove")}
        cancelTitle={t("Cancel")}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it("fires onConfirm and onCancel on the matching buttons", () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConfirmModal
        theme={theme}
        shown={true}
        text={t("PassageDeleteConfirmationText")}
        confirmTitle={t("Remove")}
        cancelTitle={t("Cancel")}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.press(getByText(t("Remove")));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.press(getByText(t("Cancel")));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
