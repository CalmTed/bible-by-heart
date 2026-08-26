import { StyleSheet } from "react-native";
import { Text } from "../../src/components/Text";
import { renderWithContext } from "../../test-utils/renderWithContext";
import { COLOR_DARK, COLOR_LIGHT, THEMETYPE } from "../../src/constants";

const colorOf = (element: { props: { style: unknown } }) =>
  StyleSheet.flatten(element.props.style)?.color;

describe("themed Text", () => {
  it("defaults to the primary text color of the active theme", () => {
    const dark = renderWithContext(<Text>hi</Text>, {
      themeType: THEMETYPE.dark
    });
    expect(colorOf(dark.getByText("hi"))).toBe(COLOR_DARK.text);

    const light = renderWithContext(<Text>hi</Text>, {
      themeType: THEMETYPE.light
    });
    expect(colorOf(light.getByText("hi"))).toBe(COLOR_LIGHT.text);
  });

  it("resolves the requested semantic color", () => {
    const { getByText } = renderWithContext(<Text color="textDanger">warn</Text>, {
      themeType: THEMETYPE.dark
    });
    expect(colorOf(getByText("warn"))).toBe(COLOR_DARK.textDanger);
  });

  it("lets caller style override the themed color", () => {
    const { getByText } = renderWithContext(
      <Text style={{ color: "#123456" }}>over</Text>,
      { themeType: THEMETYPE.dark }
    );
    expect(colorOf(getByText("over"))).toBe("#123456");
  });
});
