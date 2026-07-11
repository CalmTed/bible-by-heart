import React, { FC } from "react";
import { Text as RNText, TextProps } from "react-native";
import { useAppContext } from "../context/AppContext";
import { COLOR_DARK } from "../constants";

// Semantic text colors from the active theme palette. Both COLOR_DARK and
// COLOR_LIGHT share these keys, so the name maps to the right value in either
// scheme via the context theme.
export type TextColorName = Extract<
  keyof typeof COLOR_DARK,
  "text" | "textSecond" | "textDanger" | "mainColor"
>;

export interface AppTextModel extends TextProps {
  // Which themed color to use; defaults to the primary text color.
  color?: TextColorName;
}

// Themed <Text> (STRATEGY §4.3). Pulls the theme from AppContext so callers no
// longer hand-thread `color: theme.colors.text` onto every RN <Text>. Any style
// passed in still wins (it is merged after the color), and all standard
// TextProps pass through untouched.
export const Text: FC<AppTextModel> = ({ color = "text", style, ...rest }) => {
  const { theme } = useAppContext();
  return <RNText style={[{ color: theme.colors[color] }, style]} {...rest} />;
};
