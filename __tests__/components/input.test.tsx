import { Input } from "../../src/components/Input";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing input", () => {
  it("renders correctly", async () => {
    const tree = renderWithContext(
      <Input onChange={() => {}} placeholder={""} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
