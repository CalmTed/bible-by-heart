import { render } from "@testing-library/react-native";
import { Icon, IconName } from "../../src/components/Icon";

describe("testing icon", () => {
  it("renders correctly", async () => {
    const tree = render(<Icon iconName={IconName.back} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
