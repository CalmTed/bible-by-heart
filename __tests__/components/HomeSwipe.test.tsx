/**
 * 8.2.28 — home's four swipes. The finger runs the way the card travels:
 * settings lives beyond the LEFT edge, so a rightward swipe pulls it in; the
 * list beyond the right; stats below; practice above, and that one is a
 * pull-to-reload with an arrow because it starts a session rather than opening
 * a screen.
 *
 * What jest can prove here is the mapping, the thresholds and the affordance.
 * Whether the pull FEELS like a pull is what the build at the end of the step is
 * for — the same split the animation rules describe (`docs/CODING_RULES.md` §4).
 */
import { Text } from "react-native";
import {
  fireGestureHandler,
  getByGestureTestId
} from "react-native-gesture-handler/jest-utils";
import type { PanGesture } from "react-native-gesture-handler";
import { SvgXml } from "react-native-svg";
import { renderWithContext } from "../../test-utils/renderWithContext";
import {
  HomeSwipe,
  HOME_SWIPE_TEST_ID,
  SwipeDirection
} from "../../src/components/HomeSwipe";
import { ANIMATION } from "../../src/constants";

const ALL_DIRECTIONS: SwipeDirection[] = ["left", "right", "up", "down"];

const renderSwipe = (
  onSwipe: (direction: SwipeDirection) => void,
  available: SwipeDirection[] = ALL_DIRECTIONS
) =>
  renderWithContext(
    <HomeSwipe onSwipe={onSwipe} available={available}>
      <Text>home</Text>
    </HomeSwipe>
  );

// One drag, from nothing to (x, y), released there.
//
// Awaited because the handler runs as a worklet: `runOnJS` hands the call back
// to the JS thread rather than making it inline, so a synchronous assertion
// right after the release always sees zero calls. On a device that hop is the
// whole point - the gesture is not allowed to block on JS.
const drag = async (x: number, y: number) => {
  fireGestureHandler<PanGesture>(getByGestureTestId(HOME_SWIPE_TEST_ID), [
    { translationX: 0, translationY: 0 },
    { translationX: x / 2, translationY: y / 2 },
    { translationX: x, translationY: y }
  ]);
  await new Promise((resolve) => setTimeout(resolve, 0));
};

describe("HomeSwipe (8.2.28)", () => {
  const far = ANIMATION.swipeThreshold + 20;

  it.each<[direction: SwipeDirection, x: number, y: number]>([
    ["right", far, 0],
    ["left", -far, 0],
    ["up", 0, -far],
    ["down", 0, ANIMATION.pullTrigger + 20]
  ])("sends %s to the destination beyond that edge", async (direction, x, y) => {
    const onSwipe = jest.fn();
    renderSwipe(onSwipe);
    await drag(x, y);
    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledWith(direction);
  });

  it("ignores a drag too short to be anything but a twitch", async () => {
    const onSwipe = jest.fn();
    renderSwipe(onSwipe);
    await drag(ANIMATION.swipeThreshold - 10, 0);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("asks more of the pull than of the other three, because it starts a session", async () => {
    expect(ANIMATION.pullTrigger).toBeGreaterThan(ANIMATION.swipeThreshold);
    const onSwipe = jest.fn();
    renderSwipe(onSwipe);
    // far enough to have been a swipe in any other direction, not far enough to
    // fall into a training session
    await drag(0, ANIMATION.swipeThreshold + 5);
    expect(onSwipe).not.toHaveBeenCalled();
  });

  it("resolves a diagonal drag to the axis it was mostly going", async () => {
    const onSwipe = jest.fn();
    renderSwipe(onSwipe);
    await drag(far + 40, far);
    expect(onSwipe).toHaveBeenCalledTimes(1);
    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("does not fire toward a direction that leads nowhere", async () => {
    const onSwipe = jest.fn();
    // an empty library: nothing to practise, nothing for stats to be about
    renderSwipe(onSwipe, ["left", "right"]);
    await drag(0, ANIMATION.pullTrigger + 40);
    await drag(0, -far);
    expect(onSwipe).not.toHaveBeenCalled();
    // and the two that still lead somewhere are untouched
    await drag(far, 0);
    expect(onSwipe).toHaveBeenCalledWith("right");
  });

  it("draws the pull arrow only where there is something to pull", () => {
    const withPractice = renderSwipe(jest.fn(), ALL_DIRECTIONS);
    expect(withPractice.UNSAFE_queryAllByType(SvgXml)).toHaveLength(1);

    const withoutPractice = renderSwipe(jest.fn(), ["left", "right"]);
    expect(withoutPractice.UNSAFE_queryAllByType(SvgXml)).toHaveLength(0);
  });
});
