import { render } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { LANGCODE, THEMETYPE } from "../../src/constants";
import { createT } from "../../src/l10n";
import { MiniModal } from "../../src/components/miniModal";
import { Button } from "../../src/components/Button";

describe("testing mini modal", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const t = createT(LANGCODE.ua);
    const tree = render(
      <MiniModal theme={theme} shown={true} handleClose={() => {}}>
        <Text style={theme.theme.headerText}>{t("fetchPropositionText")}</Text>
        <View
          style={{
            ...theme.theme.rowView,
            ...theme.theme.marginVertical,
            ...theme.theme.gap20
          }}
        >
          <Button
            theme={theme}
            onPress={() => {}}
            type="secondary"
            title={t("Cancel")}
          />
          <Button
            theme={theme}
            onPress={() => {}}
            type="main"
            color="green"
            title={t("Fetch")}
          />
        </View>
      </MiniModal>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
