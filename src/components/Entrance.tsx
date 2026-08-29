import React, { FC, useEffect } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { ANIMATION } from "../constants";

interface EntranceModel {
  children?: React.ReactNode;
  // Replays the entrance whenever this value changes. Without it the entrance
  // plays once, on mount. With it, a surface that swaps its CONTENT without
  // unmounting (the training session moving to the next test) still arrives
  // rather than blinking into place.
  replayKey?: string | number;
  // Waits this long before entering, for a surface arriving behind something
  // that is already moving. `ANIMATION.staggerMs` is the app's one answer to
  // "how long" - see the Header, which staggers behind its screen transition.
  delayMs?: number;
  // Layout for the wrapper itself. It IS a real view in the tree, so whatever
  // flex/width the wrapped content needs from its parent belongs here.
  style?: StyleProp<ViewStyle>;
}

/**
 * The app's shared entrance, as a wrapper.
 *
 * `MiniModal` owns the entrance of a dialog and `Button` owns the press, by the
 * same argument: the motion is written once and reaches every call site. This is
 * that argument for everything else that arrives - it fades in on a timing and
 * rises `ANIMATION.riseDistance` on the shared spring, so a surface that enters
 * anywhere in the app enters at the same speed with the same overshoot.
 *
 * Deliberately no `scale`: MiniModal's card grows out of nothing in the middle
 * of a dimmed screen, but a full-width block of text scaling up reads as the
 * page zooming rather than as content arriving. Opacity and travel only, exactly
 * like the Header.
 *
 * The shared values are reset to 0 before every run. `withTiming(1)` from a
 * value that is already 1 is not an animation at all, so a replay without the
 * reset would silently do nothing - the same trap MiniModal has on reopen.
 */
export const Entrance: FC<EntranceModel> = ({
  children,
  replayKey,
  delayMs = 0,
  style
}) => {
  // Two drivers, as everywhere else: opacity rides a timing so it can never
  // overshoot past 1, travel rides the spring where the overshoot is the point.
  const fade = useSharedValue(0);
  const rise = useSharedValue(0);
  useEffect(() => {
    fade.value = 0;
    rise.value = 0;
    fade.value = withDelay(
      delayMs,
      withTiming(1, { duration: ANIMATION.fadeMs })
    );
    rise.value = withDelay(delayMs, withSpring(1, ANIMATION.spring));
  }, [replayKey, delayMs, fade, rise]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: (1 - rise.value) * ANIMATION.riseDistance }]
  }));
  return (
    <Animated.View style={[style, entranceStyle]}>{children}</Animated.View>
  );
};
