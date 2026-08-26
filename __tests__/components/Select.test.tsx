import { Select } from "../../src/components/Select";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing select", () => {
  it("renders correctly", async () => {
    const tree = renderWithContext(
      <Select options={[]} selectedIndex={0} onSelect={() => {}} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
