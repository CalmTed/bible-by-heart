import { render } from "@testing-library/react-native";
import { AddressPicker } from "../../src/components/AddressPicker";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";

describe("testing address picker", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const t = createT(LANGCODE.ua);
    const tree = render(
      <AddressPicker
        theme={theme}
        visible={true}
        onCancel={() => {}}
        onConfirm={() => {}}
        t={t}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
