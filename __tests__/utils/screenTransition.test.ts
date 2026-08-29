/**
 * A direction per destination.
 *
 * Every screen used to arrive from the right, so four different places felt
 * like one place reached four times. Settings lives beyond the left edge, the
 * list beyond the right, practice above and stats below — and `HomeSwipe` moves
 * the finger the way the card travels, which is the half of the pairing tested
 * next door in `HomeSwipe.test.tsx`.
 */
import { Animated } from "react-native";
import type { StackCardInterpolationProps } from "@react-navigation/stack";
import {
  candyTransition,
  candyTransitions,
  ScreenEdge
} from "../../src/utils/screenTransition";
import { ANIMATION, LAYOUT } from "../../src/constants";

// `__getValue` is how an animated node's current number is read; it is real and
// it is what RN's own tests use, but it is not in the public typings. One narrow
// interface rather than a cast to `any`, which the rules ban outright.
interface AnimatedNodeValue {
  __getValue: () => number;
}
const valueOf = (node: unknown): number =>
  (node as AnimatedNodeValue).__getValue();

// What `@react-navigation/stack`'s own `getInvertedMultiplier` hands the
// interpolator for each gesture direction, in an LTR layout. Written out because
// it is the link in the chain this file cannot call directly: the edge decides
// the direction name, the library turns that name into this multiplier, and the
// interpolator below turns the multiplier into which way the card travels.
const INVERTED_FOR: Record<string, 1 | -1> = {
  horizontal: 1,
  "horizontal-inverted": -1,
  vertical: 1,
  "vertical-inverted": -1
};

const makeProps = (
  inverted: 1 | -1,
  progress: number,
  width = 390,
  height = 844
): StackCardInterpolationProps => {
  const asInterpolation = (value: number) =>
    new Animated.Value(value).interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    });
  return {
    current: { progress: asInterpolation(progress) },
    next: undefined,
    index: 1,
    closing: asInterpolation(0) as StackCardInterpolationProps["closing"],
    swiping: asInterpolation(0) as StackCardInterpolationProps["swiping"],
    inverted: asInterpolation(
      inverted
    ) as StackCardInterpolationProps["inverted"],
    layouts: { screen: { width, height } }
  };
};

// Where the incoming card sits before it has travelled anywhere, on the axis
// that edge moves along.
const restingOffset = (edge: ScreenEdge, width?: number, height?: number) => {
  const { cardStyleInterpolator, gestureDirection } = candyTransitions[edge];
  const props = makeProps(INVERTED_FOR[gestureDirection], 0, width, height);
  const transform = cardStyleInterpolator(props).cardStyle?.transform;
  const first = Array.isArray(transform) ? transform[0] : undefined;
  const axis = edge === "left" || edge === "right" ? "translateX" : "translateY";
  const node =
    first && typeof first === "object" && axis in first
      ? (first as Record<string, unknown>)[axis]
      : undefined;
  return { offset: valueOf(node), moved: axis };
};

describe("candyTransitions", () => {
  it("gives each destination the edge it lives beyond", () => {
    expect(candyTransitions.right.gestureDirection).toBe("horizontal");
    expect(candyTransitions.left.gestureDirection).toBe("horizontal-inverted");
    expect(candyTransitions.bottom.gestureDirection).toBe("vertical");
    expect(candyTransitions.top.gestureDirection).toBe("vertical-inverted");
  });

  it("moves a horizontal card sideways and a vertical one up and down", () => {
    expect(restingOffset("right").moved).toBe("translateX");
    expect(restingOffset("left").moved).toBe("translateX");
    expect(restingOffset("top").moved).toBe("translateY");
    expect(restingOffset("bottom").moved).toBe("translateY");
  });

  it("starts each card outside the edge it is named after", () => {
    // positive x is off the right of the screen, positive y is off the bottom
    expect(restingOffset("right").offset).toBeGreaterThan(0);
    expect(restingOffset("left").offset).toBeLessThan(0);
    expect(restingOffset("bottom").offset).toBeGreaterThan(0);
    expect(restingOffset("top").offset).toBeLessThan(0);
  });

  it("lands every card exactly where it belongs", () => {
    (["right", "left", "top", "bottom"] as ScreenEdge[]).forEach((edge) => {
      const { cardStyleInterpolator, gestureDirection } =
        candyTransitions[edge];
      const props = makeProps(INVERTED_FOR[gestureDirection], 1);
      const transform = cardStyleInterpolator(props).cardStyle?.transform;
      const first = Array.isArray(transform) ? transform[0] : undefined;
      const node = Object.values(first as Record<string, unknown>)[0];
      // `toBe` would fail on the -0 the inverted pair produces, which is the
      // same place on the screen as 0
      expect(valueOf(node)).toBeCloseTo(0, 10);
    });
  });

  it("caps the travel so it is not a lunge across an unfolded foldable", () => {
    const phone = Math.abs(restingOffset("right", 390, 844).offset);
    const unfolded = Math.abs(restingOffset("right", 1800, 2200).offset);
    expect(phone).toBeLessThan(unfolded);
    expect(unfolded).toBeLessThanOrEqual(140);
    // and the vertical pair is capped by the same number, not by the height
    expect(Math.abs(restingOffset("bottom", 390, 2200).offset)).toBe(unfolded);
  });

  it("gives the vertical pair a gesture band one bar deep, not the default 135", () => {
    // The dismissing drag for a vertical card starts within this many px of the
    // edge it came from. At the default it reaches into the stats list, and a
    // scroll up from near the top pops the screen instead.
    expect(candyTransitions.bottom.gestureResponseDistance).toBe(
      LAYOUT.headerHeight
    );
    expect(candyTransitions.top.gestureResponseDistance).toBe(
      LAYOUT.headerHeight
    );
    // the horizontal pair keeps the library's 50px edge zone
    expect(candyTransitions.right.gestureResponseDistance).toBeUndefined();
    expect(candyTransitions.left.gestureResponseDistance).toBeUndefined();
  });

  it("keeps one spring and one overlay for all four", () => {
    (["right", "left", "top", "bottom"] as ScreenEdge[]).forEach((edge) => {
      const preset = candyTransitions[edge];
      expect(preset.cardOverlayEnabled).toBe(true);
      expect(preset.transitionSpec.open).toBe(preset.transitionSpec.close);
      expect(preset.transitionSpec.open.config).toMatchObject(ANIMATION.spring);
      // a full-screen card that overshoots uncovers what is behind it
      expect(preset.transitionSpec.open.config).toMatchObject({
        overshootClamping: true
      });
    });
  });

  it("still answers to one navigator-wide default", () => {
    expect(candyTransition).toBe(candyTransitions.right);
  });
});
