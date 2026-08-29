import { fireEvent } from "@testing-library/react-native";
import { View } from "react-native";
import { Button } from "../../src/components/Button";
import { ANIMATION } from "../../src/constants";
import { renderWithContext } from "../../test-utils/renderWithContext";

// The press handler is the innermost `accessible` host node — the Pressable.
const pressableOf = (screen: ReturnType<typeof renderWithContext>) =>
  screen.UNSAFE_getAllByProps({ accessible: true })[0];

describe("testing button", () => {
  it("Button renders correctly", async () => {
    const tree = renderWithContext(<Button onPress={() => {}} />).toJSON();

    expect(tree).toMatchSnapshot();
  });

  // 8.2.4. Same canary argument as MiniModal's: if babel-preset-expo ever stops
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

  // The animated wrapper replaced the plain View around the Pressable (8.2.4),
  // so the press itself is worth a guard: a button that sinks but does nothing
  // is worse than one that does nothing at all.
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
});
