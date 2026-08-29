import { Input } from "../../src/components/Input";
import { renderWithContext } from "../../test-utils/renderWithContext";

describe("testing input", () => {
  it("renders correctly", async () => {
    const tree = renderWithContext(
      <Input onChange={() => {}} placeholder={""} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });

  // The levels that ask the user to TYPE the passage give the input the whole
  // answer area. `wrapperStyle` reaches the gradient inside the input's own two
  // outer views, so only the component itself can put a flex on them.
  it("fills the height it is given only when asked to", async () => {
    const flat = renderWithContext(
      <Input onChange={() => {}} placeholder={""} />
    ).toJSON();
    expect(flat?.props.style).not.toHaveProperty("flex");

    const grown = renderWithContext(
      <Input grow onChange={() => {}} placeholder={""} />
    ).toJSON();
    expect(grown?.props.style.flex).toBe(1);
    expect(grown?.children?.[0]?.props.style.flex).toBe(1);
  });
});
