import { Input } from "../../src/components/Input";
import { render } from "@testing-library/react-native";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";

describe("testing input", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(
      <Input onChange={() => {}} placeholder={""} theme={theme} />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
