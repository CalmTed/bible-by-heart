/**
 * The shared entrance wrapper.
 *
 * Same canary argument as MiniModal.test.tsx: this asserts the reanimated
 * TOOLCHAIN, not the library. If babel-preset-expo ever stops applying
 * react-native-worklets/plugin, the useAnimatedStyle callback is never turned
 * into a worklet, no style is produced, and every surface wrapped in this ships
 * stuck at opacity 0. That failure is silent at build time.
 *
 * What jest CANNOT show: the animation progressing, or the replay firing.
 * jest-expo's mock never advances frames, so a replayed entrance and a fresh one
 * are the same first frame. The travel is verified on the device by the build
 * this step ends with.
 */
import { Text, View } from "react-native";
import { Entrance } from "../../src/components/Entrance";
import { ANIMATION } from "../../src/constants";
import { renderWithContext } from "../../test-utils/renderWithContext";

const animatedNodes = (screen: ReturnType<typeof renderWithContext>) =>
  screen.UNSAFE_getAllByType(View).filter(
    (node) => node.props.jestAnimatedStyle !== undefined
  );

describe("Entrance", () => {
  it("renders its children and keeps the style it was given", () => {
    const screen = renderWithContext(
      <Entrance style={{ flex: 1 }}>
        <Text>wrapped</Text>
      </Entrance>
    );
    expect(screen.getByText("wrapped")).toBeTruthy();
    const [wrapper] = animatedNodes(screen);
    // the layout style is merged, not replaced by the animated one
    expect(wrapper.props.style).toEqual(
      expect.arrayContaining([{ flex: 1 }])
    );
  });

  it("computes the first frame from ANIMATION through a real worklet", () => {
    const screen = renderWithContext(
      <Entrance>
        <Text>wrapped</Text>
      </Entrance>
    );
    const [wrapper] = animatedNodes(screen);
    expect(wrapper.props.jestAnimatedStyle.value).toEqual({
      opacity: 0,
      // opacity and travel only — deliberately no scale, unlike MiniModal's card
      transform: [{ translateY: ANIMATION.riseDistance }]
    });
  });

  it("wraps exactly one animated view, whatever the children are", () => {
    const screen = renderWithContext(
      <Entrance>
        <View>
          <Text>a</Text>
        </View>
        <View>
          <Text>b</Text>
        </View>
      </Entrance>
    );
    expect(animatedNodes(screen)).toHaveLength(1);
  });
});
