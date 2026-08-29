import React, { FC, ReactNode } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { Icon, IconName } from "./Icon";
import { useAppContext } from "../context/AppContext";
import { ANIMATION } from "../constants";

/** Which way the finger went. Home's four destinations, one each. */
export type SwipeDirection = "left" | "right" | "up" | "down";

// A gesture is not a node in the tree, so a test cannot find it by rendering —
// `withTestId` is how react-native-gesture-handler makes one addressable
// (`getByGestureTestId`). Exported so the test names it rather than repeats it.
export const HOME_SWIPE_TEST_ID = "homeSwipePan";

interface HomeSwipeModel {
  // Fired once, on release, when the finger travelled far enough. A direction
  // with nothing behind it simply is not passed here by the caller.
  onSwipe: (direction: SwipeDirection) => void;
  // Which directions currently lead somewhere. A swipe toward a direction that
  // is not in here does nothing — an empty library has nothing to practise and
  // nothing to show in stats — and, for "down", the pull arrow never appears.
  available: SwipeDirection[];
  children?: ReactNode;
}

// The chevron the pull draws. Big enough to read as an affordance rather than
// as a stray glyph, and it is the same icon the practice button wears when it
// has a train mode to choose.
const ARROW_SIZE = 34;
// Where the arrow sits when the finger has not moved: just above the top of the
// content, i.e. off-screen behind the header, so it is uncovered by the pull
// rather than fading in on the spot.
const ARROW_REST_OFFSET = -ARROW_SIZE;
// The arrow follows the finger at less than 1:1. Pull-to-reload everywhere else
// does the same: the indicator lagging the finger is what tells the eye the
// finger is the thing dragging it.
const ARROW_FOLLOW = 0.5;

/**
 * Home's four swipes (8.2.28).
 *
 * Every screen used to arrive from the same edge, and the only way in was a
 * button. Now each destination lives beyond an edge — settings to the left, the
 * list to the right, practice above, stats below — and the swipe that asks for
 * one runs the same way the card that answers travels
 * (`utils/screenTransition.ts` holds the other half of that pairing). The
 * gesture and the transition are one motion instead of two.
 *
 * **Pulling practice down is a pull-to-reload, on purpose.** It is the one of
 * the four that does something rather than goes somewhere — it generates a
 * session — so it gets the gesture the whole platform already uses for "fetch
 * me something new", arrow and all, and a longer trigger distance than the
 * other three (`ANIMATION.pullTrigger`): a training session is not something to
 * fall into by brushing the screen.
 *
 * The buttons underneath still work. The pan only claims the touch once the
 * finger has moved `ANIMATION.swipeThreshold` / 3, which is well past a tap, so
 * a press that never travels stays a press.
 */
export const HomeSwipe: FC<HomeSwipeModel> = ({
  onSwipe,
  available,
  children
}) => {
  const { theme } = useAppContext();
  // How far the practice pull has been dragged, in px. Drives the arrow only —
  // the content does not move, because the screen it is asking for arrives ON
  // TOP of home rather than pushing it anywhere.
  const pull = useSharedValue(0);
  // Read out as four booleans rather than kept as the array: a worklet closes
  // over primitives cleanly, and the check has to live INSIDE the gesture —
  // "there is nothing to practise" must stop the swipe, not just hide its arrow.
  const canSwipeLeft = available.includes("left");
  const canSwipeRight = available.includes("right");
  const canSwipeUp = available.includes("up");
  const canPullDown = available.includes("down");

  // Deliberately NOT memoized. `onSwipe` closes over the caller's current state
  // (which train modes are active, whether the library is empty), so a gesture
  // cached across renders would keep calling last render's answer. Rebuilding it
  // is a diff inside GestureDetector, on a screen that re-renders rarely.
  const pan = Gesture.Pan()
    .withTestId(HOME_SWIPE_TEST_ID)
    // Both axes, so the gesture waits for real travel in ANY direction before
    // taking the touch away from whatever button is under the finger.
    .activeOffsetX([-ACTIVATION, ACTIVATION])
    .activeOffsetY([-ACTIVATION, ACTIVATION])
    .onUpdate((event) => {
      "worklet";
      const isDownward =
        Math.abs(event.translationY) > Math.abs(event.translationX) &&
        event.translationY > 0;
      pull.value =
        canPullDown && isDownward
          ? Math.min(event.translationY, ANIMATION.pullMax)
          : 0;
    })
    .onEnd((event) => {
      "worklet";
      const { translationX, translationY } = event;
      // The arrow always goes home, whether or not the pull counted.
      pull.value = withSpring(0, ANIMATION.spring);
      // The dominant axis decides, so a diagonal drag resolves to the direction
      // it was mostly going instead of firing two destinations or none.
      if (Math.abs(translationX) > Math.abs(translationY)) {
        if (canSwipeRight && translationX >= ANIMATION.swipeThreshold) {
          runOnJS(onSwipe)("right");
        } else if (canSwipeLeft && translationX <= -ANIMATION.swipeThreshold) {
          runOnJS(onSwipe)("left");
        }
        return;
      }
      if (canSwipeUp && translationY <= -ANIMATION.swipeThreshold) {
        runOnJS(onSwipe)("up");
      } else if (canPullDown && translationY >= ANIMATION.pullTrigger) {
        runOnJS(onSwipe)("down");
      }
    });

  // Opacity and rotation both ride the same 0..1 progress, so the arrow is
  // fully drawn and fully flipped at exactly the distance that will fire it:
  // pointing down it means "keep pulling", pointing up it means "let go".
  const arrowStyle = useAnimatedStyle(() => {
    const progress = Math.min(pull.value / ANIMATION.pullTrigger, 1);
    return {
      opacity: progress,
      transform: [
        { translateY: ARROW_REST_OFFSET + pull.value * ARROW_FOLLOW },
        { rotate: `${progress * 180}deg` }
      ]
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={homeSwipeStyle.root}>
        {children}
        {canPullDown && (
          <Animated.View
            style={[homeSwipeStyle.arrow, arrowStyle]}
            pointerEvents="none"
          >
            <Icon
              iconName={IconName.selectArrow}
              color={theme.colors.mainColor}
              size={ARROW_SIZE}
            />
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

// A third of the swipe distance: far enough that a tap never reaches it, short
// enough that the gesture feels like it started when the finger did.
const ACTIVATION = ANIMATION.swipeThreshold / 3;

const homeSwipeStyle = StyleSheet.create({
  // Takes exactly the room its child asked for. The wrapper must not change
  // home's layout - the column inside is what spaces the screen (8.2.31).
  root: {
    flex: 1,
    width: "100%",
    alignItems: "center"
  },
  arrow: {
    position: "absolute",
    top: 0,
    alignSelf: "center"
  }
});
