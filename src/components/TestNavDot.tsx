import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { useAppContext } from "../context/AppContext";

interface TestNavDotModel {
  isCurrent: boolean;
  color: "red" | "green" | "gray" | "text";
  onPress?: () => void;
}

export const TestNavDot: FC<TestNavDotModel> = ({
  isCurrent,
  color,
  onPress
}) => {
  const { theme } = useAppContext();
  const colors =
    color === "gray"
      ? [theme.colors.textSecond, theme.colors.textSecond]
      : color === "red"
        ? [theme.colors.redGradient1, theme.colors.redGradient2]
        : color === "text"
          ? [theme.colors.text, theme.colors.textSecond]
          : [theme.colors.gradient1, theme.colors.gradient2];
  const testNavDottStyles = StyleSheet.create({
    // 8.2.35: the Pressable IS the dot. It used to sit between the wrapper and
    // the gradient with no size of its own, so the gradient's height: "100%"
    // resolved against a view sized by its 13px child - a 13px dot parked in the
    // top-left corner of an 18px wrapper (off-centre), and a CURRENT dot, which
    // has no child at all, sized to nothing.
    wrapper: {
      width: 18,
      aspectRatio: 1,
      borderRadius: 100,
      overflow: "hidden",
      marginHorizontal: 5,
      alignItems: "center",
      justifyContent: "center"
    },
    gradientView: {
      height: "100%",
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center"
    },
    inner: {
      backgroundColor: theme.colors.bg,
      width: 13,
      borderRadius: 100,
      aspectRatio: 1
    }
  });
  return (
    <Pressable
      style={testNavDottStyles.wrapper}
      onPress={() => (onPress ? onPress() : null)}
    >
      <LinearGradient
        //@ts-ignore
        colors={colors}
        start={{ x: 0.0, y: 0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1]}
        style={testNavDottStyles.gradientView}
      >
        {!isCurrent && <View style={testNavDottStyles.inner} />}
      </LinearGradient>
    </Pressable>
  );
};
