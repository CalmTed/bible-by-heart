import { render } from "@testing-library/react-native";
import { Select } from "../../src/components/Select";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { THEMETYPE } from "../../src/constants";

describe("testing select", () => {
  it("renders correctly", async () => {
    const theme = getThemeFromScheme(THEMETYPE.dark);
    const tree = render(
      <Select
        theme={theme}
        options={[]}
        selectedIndex={0}
        onSelect={() => {}}
      />
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
