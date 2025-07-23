import { render } from "@testing-library/react-native";
import { Checkbox } from "../../src/components/Checkbox";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";

describe("testing select", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(<Checkbox theme={theme} isEnabled={false} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
