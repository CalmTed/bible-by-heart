import React, { FC, useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useAppContext } from "../context/AppContext";
import { ANIMATION } from "../constants";

/**
 * Window coordinates of the anchor's bottom-RIGHT corner, exactly as
 * `measureInWindow(x, y, width, height)` reports them (`x + width`, `y + height`).
 */
export interface PopupAnchorModel {
  x: number;
  y: number;
}

interface AnchoredPopupModel {
  shown: boolean;
  handleClose: () => void;
  // Null until the anchor has been measured - and always null under jest, whose
  // UIManager mock never calls the measure callback back. The popup then falls
  // back to the top-right corner, which is where every toolbar in this app is,
  // so a failed measurement degrades into a slightly misplaced popup and never
  // into an invisible one.
  anchor: PopupAnchorModel | null;
  children?: React.ReactNode;
}

// Gap between the anchor's bottom edge and the popup, and how close the popup
// may come to a screen edge.
const ANCHOR_GAP = 6;
const EDGE_MARGIN = 10;
const FALLBACK_TOP = 100;

/**
 * A small menu that hangs off the control that opened it - the non-dialog half
 * of the 8.2.2 modal purge. It shares MiniModal's motion vocabulary (ANIMATION)
 * but deliberately NOT its dimmed backdrop: a popup is a continuation of the
 * toolbar underneath, not an interruption of it. Use it for short choices made
 * from a toolbar; anything the user has to read or fill in is a dialog
 * (MiniModal / ConfirmModal), anything list-like is a screen.
 */
export const AnchoredPopup: FC<AnchoredPopupModel> = ({
  shown,
  handleClose,
  anchor,
  children
}) => {
  const { theme } = useAppContext();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Same two drivers as MiniModal: opacity on a timing so it cannot overshoot
  // past 1, travel on the spring where the overshoot is the point.
  const fade = useSharedValue(0);
  const rise = useSharedValue(0);
  // The popup stays mounted while hidden (only RN's <Modal> unmounts children),
  // so the values are reset on close or a reopen starts already finished.
  useEffect(() => {
    if (!shown) {
      fade.value = 0;
      rise.value = 0;
      return;
    }
    fade.value = withTiming(1, { duration: ANIMATION.fadeMs });
    rise.value = withSpring(1, ANIMATION.spring);
  }, [shown, fade, rise]);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: (1 - rise.value) * ANIMATION.riseDistance },
      { scale: ANIMATION.riseScale + rise.value * (1 - ANIMATION.riseScale) }
    ]
  }));
  const top = anchor ? anchor.y + ANCHOR_GAP : FALLBACK_TOP;
  // The popup's right edge lines up with the anchor's, so it opens inward.
  const right = anchor
    ? Math.max(EDGE_MARGIN, windowWidth - anchor.x)
    : EDGE_MARGIN;
  const styles = StyleSheet.create({
    backdrop: {
      flex: 1
    },
    card: {
      position: "absolute",
      top,
      right,
      // never taller than the room left under the anchor
      maxHeight: Math.max(0, windowHeight - top - EDGE_MARGIN),
      minWidth: 160,
      backgroundColor: theme.colors.bg,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      gap: 10,
      // with no dimmed backdrop the shadow is the only thing lifting the popup
      // off the screen behind it
      shadowColor: theme.colors.bgBackdrop,
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 8,
      // it grows out of the corner it hangs from, not out of its own middle
      transformOrigin: "top right"
    }
  });
  return (
    <Modal
      // the entrance is ours (reanimated), not the platform slide
      animationType="none"
      transparent={true}
      visible={shown}
      // measured coordinates include the status bar, so the modal window has to
      // cover it too - otherwise every anchor is off by its height on Android
      statusBarTranslucent={true}
      onRequestClose={handleClose}
      onDismiss={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View style={[styles.card, cardStyle]}>{children}</Animated.View>
    </Modal>
  );
};
