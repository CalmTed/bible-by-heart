import { Button } from "../../src/components/Button";
import { render } from "@testing-library/react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";

describe("testing button", () => {
  it("Button renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(<Button theme={theme} onPress={() => {}} />).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
