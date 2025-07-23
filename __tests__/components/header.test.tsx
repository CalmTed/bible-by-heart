import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { Header } from "../../src/components/Header";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";

describe("testing header", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(
      <Header
        theme={theme}
        showBackButton={false}
        alignChildren="flex-start"
        additionalChildren={[
          <IconButton
            key="back"
            theme={theme}
            icon={IconName.back}
            onPress={() => {}}
          />,
          <Text key="title">Title</Text>
        ]}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
