import { Button } from "../../src/components/Button";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing button", () => {
  it("Button renders correctly", async () => {
    const tree = renderWithContext(<Button onPress={() => {}} />).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
