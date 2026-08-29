import { Animated } from "react-native";
import type {
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  TransitionPreset
} from "@react-navigation/stack";
import { ANIMATION } from "../constants";

/**
 * `TransitionSpec` is declared by `@react-navigation/stack` but not re-exported
 * from its index in v7, so it is derived from the preset that carries it. The
 * alternative - importing through a raw `node_modules/...` path - is the thing
 * 8.1.14 removed from this codebase.
 */
type TransitionSpec = TransitionPreset["transitionSpec"]["open"];

/**
 * The app's one screen transition (8.2.3).
 *
 * Without this the stack picks a preset from `Platform.Version`
 * (`@react-navigation/stack` `DefaultTransition`), so the same app slides on an
 * Android 14 phone, zooms on an Android 10 one and rises from the bottom on a
 * Pie one — four different apps depending on whose phone it is. This is the
 * explicit one, identical on every device.
 *
 * Motion comes from `ANIMATION` in `constants.ts`, the same block MiniModal and
 * AnchoredPopup spring from.
 */

// How far the incoming card travels, as a share of the screen width — capped so
// the same gesture does not turn into a lunge across an unfolded foldable.
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
 * `current.progress` is driven by the swipe-back gesture as well as by the
 * spring, and nothing guarantees it stays inside [0, 1] — hence `clamp` on
 * every interpolation. An unclamped opacity would go above 1 mid-gesture.
 */
export const forCandyCard = ({
  current,
  next,
  inverted,
  layouts: { screen }
}: StackCardInterpolationProps): StackCardInterpolatedStyle => {
  const travel = Math.min(screen.width * TRAVEL_RATIO, TRAVEL_MAX);
  // `inverted` is -1 in an RTL layout, so the whole transition mirrors itself
  // instead of sliding out of the wrong edge.
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
      transform: [
        // this card's own travel
        { translateX: translateFocused },
        // and the shove it gets from the card opening on top of it
        { translateX: translateUnfocused }
      ]
    },
    overlayStyle: {
      opacity: overlayOpacity
    }
  };
};

/**
 * Everything the navigator needs to stop asking the platform what a transition
 * should look like. `headerStyleInterpolator` is left out on purpose: this app
 * renders `headerShown: false` and draws its own `Header`.
 *
 * `cardOverlayEnabled` is set rather than left to its default, which is
 * `Platform.OS !== "ios"` - i.e. the overlay above would silently not render on
 * iOS, and the one transition would not be one transition after all.
 */
export const candyTransition: Omit<
  TransitionPreset,
  "headerStyleInterpolator"
> & {
  cardOverlayEnabled: boolean;
} = {
  gestureDirection: "horizontal",
  transitionSpec: {
    open: CANDY_SPRING,
    close: CANDY_SPRING
  },
  cardStyleInterpolator: forCandyCard,
  cardOverlayEnabled: true
};
