import { Checkbox } from "../../src/components/Checkbox";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing checkbox", () => {
  it("renders correctly", async () => {
    const tree = renderWithContext(<Checkbox isEnabled={false} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
