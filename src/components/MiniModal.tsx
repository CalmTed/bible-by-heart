import React, { FC, useEffect } from "react";
import { Modal, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from "react-native-reanimated";
import { useAppContext } from "../context/AppContext";
import { ANIMATION } from "../constants";

interface MiniModalModel {
  shown: boolean;
  handleClose: () => void;
  children?: React.ReactNode;
  style?: StyleSheet.NamedStyles<object>;
}

export const MiniModal: FC<MiniModalModel> = ({
  shown,
  children,
  handleClose,
  style: customStyles
}) => {
  const { theme } = useAppContext();
  // Two drivers on purpose: opacity rides a plain timing so it never overshoots
  // into >1, while the card's travel rides the spring and is allowed to.
  const fade = useSharedValue(0);
  const rise = useSharedValue(0);
  // MiniModal itself stays mounted while hidden (only RN's <Modal> unmounts its
  // children), so the values have to be reset on close or the second open would
  // start already finished.
  useEffect(() => {
    if (!shown) {
      fade.value = 0;
      rise.value = 0;
      return;
    }
    fade.value = withTiming(1, { duration: ANIMATION.fadeMs });
    rise.value = withSpring(1, ANIMATION.spring);
  }, [shown, fade, rise]);
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: fade.value
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateY: (1 - rise.value) * ANIMATION.riseDistance },
      {
        scale: ANIMATION.riseScale + rise.value * (1 - ANIMATION.riseScale)
      }
    ]
  }));
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.colors.bgBackdrop,
      backfaceVisibility: "hidden"
    },
    modalView: {
      margin: 0,
      backgroundColor: theme.colors.bg,
      borderRadius: 10,
      paddingHorizontal: 15,
      paddingVertical: 10,
      alignItems: "center",
      shadowColor: theme.colors.bgBackdrop,
      shadowOffset: {
        width: 0,
        height: 0
      },
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 5,
      gap: 10
    }
  });
  return (
    <Modal
      // the entrance is ours now (reanimated), not the platform slide
      animationType="none"
      transparent={true}
      visible={shown}
      onRequestClose={handleClose}
      onDismiss={handleClose}
    >
      <Animated.View style={[styles.centeredView, backdropStyle]}>
        <Animated.View style={[styles.modalView, customStyles, cardStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
