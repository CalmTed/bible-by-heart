import { fireEvent } from "@testing-library/react-native";
import { LANGCODE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { ConfirmModal } from "../../src/components/ConfirmModal";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing confirm modal", () => {
  const t = createT(LANGCODE.en);

  it("renders correctly", async () => {
    const tree = renderWithContext(
      <ConfirmModal
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
    const { getByText } = renderWithContext(
      <ConfirmModal
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
