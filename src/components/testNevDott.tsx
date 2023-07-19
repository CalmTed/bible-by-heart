import { LinearGradient } from "expo-linear-gradient";
import React, { FC } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemeAndColorsModel } from "src/tools/getTheme";

interface TestNavDottModel {
  isCurrent: boolean;
  color: "red" | "green" | "gray" | "text";
  theme: ThemeAndColorsModel;
  onPress?: () => void;
}

export const TestNavDott: FC<TestNavDottModel> = ({
  isCurrent,
  color,
  onPress,
  theme
}) => {
  const colors =
    color === "gray"
      ? [theme.colors.textSecond, theme.colors.textSecond]
      : color === "red"
      ? [theme.colors.redGradient1, theme.colors.redGradient2]
      : color === "text"
      ? [theme.colors.text, theme.colors.textSecond]
      : [theme.colors.gradient1, theme.colors.gradient2];
  const testNavDottStyles = StyleSheet.create({
    wrapper: {
      width: 18,
      aspectRatio: 1,
      borderRadius: 100,
      overflow: "hidden",
      marginHorizontal: 5
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
    <View style={testNavDottStyles.wrapper}>
      <Pressable onPress={() => (onPress ? onPress() : null)}>
        <LinearGradient
          colors={colors}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={testNavDottStyles.gradientView}
        >
          {!isCurrent && <View style={testNavDottStyles.inner} />}
        </LinearGradient>
      </Pressable>
    </View>
  );
};
