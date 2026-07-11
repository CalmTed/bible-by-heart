import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import { Header } from "../../src/components/Header";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";
import { SafeAreaProvider } from "react-native-safe-area-context";

describe("testing header", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(
      <SafeAreaProvider>
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
      /></SafeAreaProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
