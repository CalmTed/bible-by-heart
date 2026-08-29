import { Animated } from "react-native";
import type {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackCardStyleInterpolator,
  TransitionPreset
} from "@react-navigation/stack";
import { ANIMATION, LAYOUT } from "../constants";

/**
 * `TransitionSpec` and `GestureDirection` are declared by
 * `@react-navigation/stack` but not re-exported from its index in v7, so they
 * are derived from the preset that carries them. The alternative - importing
 * through a raw `node_modules/...` path - is exactly what typed navigation took
 * out of this codebase.
 */
type TransitionSpec = TransitionPreset["transitionSpec"]["open"];
type GestureDirection = TransitionPreset["gestureDirection"];

/**
 * The app's screen transitions, one direction per destination.
 *
 * Without this the stack picks a preset from `Platform.Version`
 * (`@react-navigation/stack` `DefaultTransition`), so the same app slides on an
 * Android 14 phone, zooms on an Android 10 one and rises from the bottom on a
 * Pie one — four different apps depending on whose phone it is. These are the
 * explicit ones, identical on every device.
 *
 * **The edge is the destination's, not the navigator's.** Every screen
 * used to arrive from the right, so four different places felt like one place
 * reached four times. Settings lives to the left of home, the list to the right,
 * practice above and stats below — and `HomeSwipe` moves the finger the same way
 * the card moves, so the gesture and the transition are one motion instead of
 * two. A destination's edge is written once, here, and the screen that arrives
 * from it and the swipe that asks for it both read it from the same place.
 *
 * Motion comes from `ANIMATION` in `constants.ts`, the same block MiniModal and
 * the Header spring from.
 */

/** Which edge of the screen a destination lives beyond. */
export type ScreenEdge = "right" | "left" | "top" | "bottom";

// `gestureDirection` decides BOTH which edge the card comes from and which way
// the dismissing swipe runs, which is exactly the pairing this step is about:
// an inverted horizontal card enters from the left and is pushed back out to
// the left, a vertical one rises from the bottom and is thrown back down.
const GESTURE_DIRECTIONS: Record<ScreenEdge, GestureDirection> = {
  right: "horizontal",
  left: "horizontal-inverted",
  bottom: "vertical",
  top: "vertical-inverted"
};

// How far the incoming card travels, as a share of the screen — capped so the
// same gesture does not turn into a lunge across an unfolded foldable.
const TRAVEL_RATIO = 0.25;
const TRAVEL_MAX = 140;
// The card underneath drifts the opposite way by this share of the travel. The
// parallax is what makes the two screens read as stacked instead of as a
// crossfade; without it the outgoing screen looks painted on.
const PARALLAX_RATIO = 0.4;
// How far the screen underneath is dimmed while a card sits on top of it.
const OVERLAY_OPACITY = 0.12;
// Progress at which the incoming card is fully opaque. It is deliberately early:
// a card still translucent late in its travel shows the screen underneath
// through it, which reads as a glitch rather than as a fade.
const FADE_IN_AT = 0.4;

/**
 * Both directions ride the same spring, so a push and a pop feel like the same
 * motion played forwards and backwards.
 *
 * `overshootClamping` is the deliberate part: a full-screen card that springs
 * past its resting place uncovers a strip of whatever is behind it. The bounce
 * this app is named for lives in the `Header` riding on the card instead, which
 * can move without exposing anything. With the spring clamped the push settles
 * in ~210ms — well under the 400–450ms of the Android presets it replaces.
 *
 * The animated value here is the gesture distance in px, so the rest thresholds
 * are in px too; the defaults (0.001) would keep the transition formally
 * running for most of a second after it is visually over, and screens are only
 * detached once it ends.
 */
const CANDY_SPRING: TransitionSpec = {
  animation: "spring",
  config: {
    ...ANIMATION.spring,
    overshootClamping: true,
    restDisplacementThreshold: 0.5,
    restSpeedThreshold: 5
  }
};

/**
 * One interpolator per axis. `inverted` is the multiplier the stack derives from
 * `gestureDirection` (-1 for the two `*-inverted` ones, and for a horizontal
 * card in an RTL layout), so the same maths draws all four edges: it is what
 * turns "comes from the right" into "comes from the left" without a second
 * interpolator, and what mirrors the whole transition in RTL rather than sliding
 * it out of the wrong side.
 *
 * `current.progress` is driven by the dismissing gesture as well as by the
 * spring, and nothing guarantees it stays inside [0, 1] — hence `clamp` on
 * every interpolation. An unclamped opacity would go above 1 mid-gesture.
 */
const makeCandyCard: (axis: "x" | "y") => StackCardStyleInterpolator =
  (axis) =>
  ({
    current,
    next,
    inverted,
    layouts: { screen }
  }: StackCardInterpolationProps): StackCardInterpolatedStyle => {
    const span = axis === "x" ? screen.width : screen.height;
    const travel = Math.min(span * TRAVEL_RATIO, TRAVEL_MAX);
    const translateFocused = Animated.multiply(
      current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [travel, 0],
        extrapolate: "clamp"
      }),
      inverted
    );
    const translateUnfocused = next
      ? Animated.multiply(
          next.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -travel * PARALLAX_RATIO],
            extrapolate: "clamp"
          }),
          inverted
        )
      : 0;
    const opacity = current.progress.interpolate({
      inputRange: [0, FADE_IN_AT, 1],
      outputRange: [0, 1, 1],
      extrapolate: "clamp"
    });
    const overlayOpacity = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, OVERLAY_OPACITY],
      extrapolate: "clamp"
    });
    return {
      cardStyle: {
        opacity,
        transform:
          axis === "x"
            ? [
                // this card's own travel
                { translateX: translateFocused },
                // and the shove it gets from the card opening on top of it
                { translateX: translateUnfocused }
              ]
            : [
                { translateY: translateFocused },
                { translateY: translateUnfocused }
              ]
      },
      overlayStyle: {
        opacity: overlayOpacity
      }
    };
  };

export const forCandyCard = makeCandyCard("x");
export const forCandyCardVertical = makeCandyCard("y");

/**
 * A vertical card is dismissed by a drag that starts within
 * `gestureResponseDistance` of the edge it came from, and the default is 135px —
 * deep enough on a stats screen to swallow the top of the list. The bar is the
 * one band up there that never scrolls, so that is the band the gesture gets.
 */
const VERTICAL_GESTURE_BAND = LAYOUT.headerHeight;

export interface CandyTransition {
  gestureDirection: GestureDirection;
  gestureResponseDistance?: number;
  transitionSpec: TransitionPreset["transitionSpec"];
  cardStyleInterpolator: StackCardStyleInterpolator;
  cardOverlayEnabled: boolean;
}

/**
 * Everything the navigator needs to stop asking the platform what a transition
 * should look like. `headerStyleInterpolator` is left out on purpose: this app
 * renders `headerShown: false` and draws its own `Header`.
 *
 * `cardOverlayEnabled` is set rather than left to its default, which is
 * `Platform.OS !== "ios"` - i.e. the overlay above would silently not render on
 * iOS, and the one transition would not be one transition after all.
 */
const candyTransitionFrom: (edge: ScreenEdge) => CandyTransition = (edge) => {
  const isVertical = edge === "top" || edge === "bottom";
  return {
    gestureDirection: GESTURE_DIRECTIONS[edge],
    ...(isVertical ? { gestureResponseDistance: VERTICAL_GESTURE_BAND } : {}),
    transitionSpec: {
      open: CANDY_SPRING,
      close: CANDY_SPRING
    },
    cardStyleInterpolator: isVertical ? forCandyCardVertical : forCandyCard,
    cardOverlayEnabled: true
  };
};

/**
 * The four edges, built once so a screen's options object keeps a stable
 * identity across renders (react-navigation compares interpolators by identity
 * when it decides how many cards share an interpolation).
 *
 * `right` is also the navigator-wide default: a screen that has no opinion about
 * where it lives arrives the way the app has always arrived.
 */
export const candyTransitions: Record<ScreenEdge, CandyTransition> = {
  right: candyTransitionFrom("right"),
  left: candyTransitionFrom("left"),
  top: candyTransitionFrom("top"),
  bottom: candyTransitionFrom("bottom")
};

export const candyTransition = candyTransitions.right;
