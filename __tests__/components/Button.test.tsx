import { fireEvent } from "@testing-library/react-native";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Button } from "../../src/components/Button";
import { ANIMATION, THEMETYPE } from "../../src/constants";
import { getThemeFromScheme } from "../../src/utils/getThemeFromScheme";
import { renderWithContext } from "../../test-utils/renderWithContext";

// The press handler is the innermost `accessible` host node — the Pressable.
const pressableOf = (screen: ReturnType<typeof renderWithContext>) =>
  screen.UNSAFE_getAllByProps({ accessible: true })[0];

describe("testing button", () => {
  it("Button renders correctly", async () => {
    const tree = renderWithContext(<Button onPress={() => {}} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  // Same canary argument as MiniModal's: if babel-preset-expo ever stops
  // applying react-native-worklets/plugin, useAnimatedStyle produces no style at
  // all — and because this one wraps EVERY button in the app, that failure would
  // be the whole UI, silently, at build time.
  // What jest cannot show: the press actually travelling to ANIMATION.pressScale.
  // jest-expo's mock never advances frames, so the sink-and-return is verified on
  // a device by the build this step ends with.
  it("computes its resting frame from a real press worklet", () => {
    const screen = renderWithContext(<Button onPress={() => {}} />);
    const animated = screen
      .UNSAFE_getAllByType(View)
      .filter((node) => node.props.jestAnimatedStyle !== undefined);

    // exactly one animated wrapper — the button's own, not a nested pile
    expect(animated).toHaveLength(1);
    expect(animated[0].props.jestAnimatedStyle.value).toEqual({
      transform: [{ scale: 1 }]
    });
    expect(ANIMATION.pressScale).toBeLessThan(1);
  });

  // The animated wrapper replaced the plain View around the Pressable, so the
  // press itself is worth a guard: a button that sinks but does nothing is
  // worse than one that does nothing at all.
  it("still presses, and a disabled one still does not", () => {
    const onPress = jest.fn();
    const screen = renderWithContext(<Button title="tap" onPress={onPress} />);

    fireEvent(pressableOf(screen), "pressIn");
    fireEvent.press(pressableOf(screen));
    fireEvent(pressableOf(screen), "pressOut");
    expect(onPress).toHaveBeenCalledTimes(1);

    const disabled = renderWithContext(
      <Button title="tap" onPress={onPress} disabled />
    );
    fireEvent.press(disabled.getByText("tap"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // expo-linear-gradient bakes its ramp at layout size, so a scaled
  // gradient stretches instead of scaling and visibly drops out mid-press. The
  // press handlers are therefore not attached at all on a gradient button, which
  // is what this asserts - jest-expo never advances frames, so the shared value
  // itself would read 1 either way and could not tell the two apart.
  it("does not animate the press of a gradient button", () => {
    const gradients = [
      { type: "main", color: "green" },
      { type: "outline", color: "green" },
      { type: "main", color: "red" }
    ] as const;
    // Searched by prop rather than by type: RN turns onPressIn into responder
    // handlers on the way down, so the host View never carries it, and the
    // composite that does is not the `Pressable` this file could import.
    const pressHandlerCount = (screen: ReturnType<typeof renderWithContext>) =>
      screen.UNSAFE_root.findAll((node) => node.props?.onPressIn !== undefined)
        .length;

    gradients.forEach(({ type, color }) => {
      const screen = renderWithContext(
        <Button title="tap" type={type} color={color} onPress={() => {}} />
      );
      expect(pressHandlerCount(screen)).toBe(0);
    });

    const flats = [
      { type: "transparent", color: "green" },
      { type: "main", color: "gray" }
    ] as const;
    flats.forEach(({ type, color }) => {
      const screen = renderWithContext(
        <Button title="tap" type={type} color={color} onPress={() => {}} />
      );
      expect(pressHandlerCount(screen)).toBe(1);
    });
  });

  // `disabled` used to win over `transparent`, so a dead icon button drew
  // a bg->bgSecond plate under itself - the "shadow" on the calendar's month
  // arrows, which are disabled at the ends of the available range.
  it("keeps a transparent button transparent when it is disabled", () => {
    const colorsOf = (screen: ReturnType<typeof renderWithContext>) =>
      screen.UNSAFE_getAllByType(LinearGradient)[0].props.colors;

    expect(
      colorsOf(renderWithContext(<Button onPress={() => {}} disabled />))
    ).toEqual(["transparent", "transparent"]);

    const { colors } = getThemeFromScheme(THEMETYPE.dark);
    expect(
      colorsOf(
        renderWithContext(
          <Button onPress={() => {}} type="main" color="green" disabled />
        )
      )
    ).toEqual([colors.bg, colors.bgSecond]);
  });
});
