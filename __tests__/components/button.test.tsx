import renderer from "react-test-renderer";
import { Button } from "../../src/components/Button";
import { getTheme } from "../../src/utils/getTheme";
import { THEMETYPE } from "../../src/constants";

describe("testinmg button", () => {
  it("Button renders correctly", () => {
    const theme = getTheme(THEMETYPE.dark);
    const tree = renderer
      .create(<Button theme={theme} onPress={() => {}} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
