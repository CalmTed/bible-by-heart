import React, { FC, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { Text } from "./Text";
import { IconButton } from "./Button";
import { IconName } from "./Icon";
import { useAppContext } from "../context/AppContext";
import { ANIMATION } from "../constants";

interface HeaderModel {
  // The screen's name. Rendered in the app's one header typography
  // (`theme.headerText`), clipped to a single line rather than growing the bar.
  title?: string;
  // Given a handler, the leading button appears. Screens that navigate
  // somewhere specific (list -> home) pass their own; the shells pass goBack.
  onBack?: () => void;
  // Which leading icon that button wears — `back` everywhere except a surface
  // the user leaves rather than returns from (the training session's cross).
  backIcon?: IconName;
  // Trailing actions, at the right edge.
  right?: React.ReactNode;
  // Centre content for a header that has no plain title (the training
  // session's dots). Ignored when `title` is set.
  children?: React.ReactNode;
}

/**
 * The app's one header (8.2.3). Every screen AND every full-screen modal goes
 * through it, so a title sits in the same place, in the same typography, at the
 * same height, everywhere.
 *
 * **The top margin is the device's, never a number.** `insets.top` is the real
 * status-bar / cutout height on this phone; the app is `edgeToEdgeEnabled`, so
 * it draws *under* the system bars and a fixed guess is a header that hides
 * behind the camera on one phone and floats on another. This component is the
 * only place that inset is applied — screens must not add their own, and
 * `theme.screen` must not carry a fixed `paddingTop` for it either (8.2.3
 * removed one, which every header screen was silently sitting on top of).
 *
 * A screen with no bar still renders a bare `<Header />` for the margin, so
 * "every screen goes through the Header" has no exceptions to remember.
 *
 * It springs in on mount with the shared `ANIMATION` vocabulary, staggered
 * behind the screen transition. That is where the app's bounce lives: the card
 * itself is clamped (`utils/screenTransition.ts`), because a full-screen card
 * that overshoots uncovers the screen behind it, while a header has room.
 */
export const Header: FC<HeaderModel> = ({
  title,
  onBack,
  backIcon = IconName.back,
  right,
  children
}) => {
  const { theme } = useAppContext();
  const insets = useSafeAreaInsets();
  // A Header with nothing in it is still the device's top margin, and that is
  // how a screen with no bar of its own (home, the finish screen) gets exactly
  // the same clearance as every other screen without reaching for `insets`
  // itself. It reserves the inset only - a bare 60px band would be dead space.
  const isBare = !title && !children && !onBack && !right;
  // Two drivers, exactly as in MiniModal: opacity on a timing so it can never
  // overshoot past 1, travel on the spring where the overshoot is the point.
  const fade = useSharedValue(0);
  const rise = useSharedValue(0);
  useEffect(() => {
    // The delay is what makes it read as deliberate: the card lands, then its
    // header arrives. Starting both at once looks like one thing stuttering.
    fade.value = withDelay(
      ANIMATION.staggerMs,
      withTiming(1, { duration: ANIMATION.fadeMs })
    );
    rise.value = withDelay(
      ANIMATION.staggerMs,
      withSpring(1, ANIMATION.spring)
    );
  }, [fade, rise]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: (1 - rise.value) * ANIMATION.riseDistance }]
  }));

  const headerStyle = StyleSheet.create({
    view: {
      paddingTop: insets.top,
      height: (isBare ? 0 : HEADER_HEIGHT) + insets.top,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10
    },
    centerView: {
      flex: 1,
      justifyContent: "center",
      marginHorizontal: 10
    },
    title: {
      ...theme.theme.headerText
    }
  });

  return (
    <Animated.View style={[headerStyle.view, entranceStyle]}>
      {onBack && <IconButton icon={backIcon} onPress={onBack} />}
      <Animated.View style={headerStyle.centerView}>
        {title ? (
          <Text style={headerStyle.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
      {right}
    </Animated.View>
  );
};

// The bar's own height, above whatever the device's top inset adds.
export const HEADER_HEIGHT = 60;
