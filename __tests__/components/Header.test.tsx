import { Text } from "react-native";
import { Header } from "../../src/components/Header";
import { IconButton } from "../../src/components/Button";
import { IconName } from "../../src/components/Icon";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing header", () => {
  it("renders correctly", async () => {
    const tree = renderWithContext(
      <SafeAreaProvider>
        <Header
          showBackButton={false}
          alignChildren="flex-start"
          additionalChildren={[
            <IconButton key="back" icon={IconName.back} onPress={() => {}} />,
            <Text key="title">Title</Text>
          ]}
        />
      </SafeAreaProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
