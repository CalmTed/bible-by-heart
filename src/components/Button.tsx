import React, { FC } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, IconName } from "./Icon";
import { useAppContext } from "../context/AppContext";
import { DotIndicator } from "./DotIndicator";
import { ANIMATION } from "../constants";

interface ButtonModel {
  onPress: () => void;
  style?: StyleSheet.NamedStyles<object>;
  textStyle?: StyleSheet.NamedStyles<object>;
  title?: string;
  disabled?: boolean;
  type?: "main" | "outline" | "secondary" | "transparent";
  icon?: IconName;
  iconColor?: string;
  color?: "green" | "red" | "gray";
  dot?: boolean;
  iconAlign?: "left" | "right";
}

export const Button: FC<ButtonModel> = ({
  title,
  style,
  textStyle,
  onPress,
  disabled,
  type = "transparent",
  icon,
  color = "gray",
  iconColor,
  dot,
  iconAlign = "left"
}) => {
  const { theme } = useAppContext();
  // Press feedback lives here rather than in any screen, because every button in
  // the app is this component (8.2.4) - the home screen is nothing but these,
  // and so are the passage list's swipe actions. One spring, ~277 call sites.
  // 0 = at rest, 1 = held. The spring is the shared ANIMATION one, so a button
  // settles with the same bounce as a dialog arriving.
  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * (1 - ANIMATION.pressScale) }]
  }));
  // A disabled Pressable never fires these, so a dead button never moves.
  const handlePressIn = () => {
    press.value = withSpring(1, ANIMATION.spring);
  };
  const handlePressOut = () => {
    press.value = withSpring(0, ANIMATION.spring);
  };
  const gradientColors = disabled
    ? [theme.colors.bg, theme.colors.bgSecond]
    : type === "transparent"
      ? ["transparent", "transparent"]
      : color === "gray"
        ? [theme.colors.bgSecond, theme.colors.bgSecond]
        : color === "green"
          ? [theme.colors.gradient1, theme.colors.gradient2]
          : [theme.colors.redGradient1, theme.colors.redGradient2];
  const textColor = disabled
    ? theme.colors.textSecond
    : type === "transparent"
      ? color === "red"
        ? theme.colors.textDanger
        : color === "gray"
          ? theme.colors.text
          : theme.colors.mainColor
      : theme.colors.text;
  return (
    <Animated.View style={[buttonStyles.touch, pressStyle]}>
      <Pressable
        style={buttonStyles.touch}
        // style={{ ...buttonStyles.touch, opacity: disabled ? 0.5 : 1 }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        android_ripple={{
          color: theme.colors.bgBackdrop,
          foreground: true
        }}
      >
        <LinearGradient
          //@ts-ignore
          colors={gradientColors}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={{
            ...buttonStyles.buttonStyle,
            ...style,
            ...(!["transparent"].includes(type) ? buttonStyles.shadow : {})
          }}
        >
          <View
            style={{
              ...buttonStyles.inner,
              ...(!["main", "transparent"].includes(type)
                ? { backgroundColor: theme.colors.bgSecond }
                : buttonStyles.innerHidden),
              ...style
            }}
          >
            {icon && iconAlign === "left" && (
              <Icon iconName={icon} color={iconColor || theme.colors.text} />
            )}
            {title && (
              <Text
                style={{
                  ...buttonStyles.buttonText,
                  ...textStyle,
                  ...{ color: theme.colors.text },
                  color: textColor
                }}
              >
                {title}
              </Text>
            )}
            {icon && iconAlign === "right" && (
              <Icon iconName={icon} color={iconColor || theme.colors.text} />
            )}
            {dot && <DotIndicator left={-5} right={5} top={-10} bottom={10} />}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

interface IconButtonModel {
  icon: IconName;
  onPress: () => void;
  style?: StyleSheet.NamedStyles<object>;
  disabled?: boolean;
  color?: string;
  dot?: boolean;
}

export const IconButton: FC<IconButtonModel> = ({
  icon,
  onPress,
  style,
  disabled,
  color,
  dot
}) => {
  const { theme } = useAppContext();
  return (
    <Button
      icon={icon}
      onPress={onPress}
      style={{ ...buttonStyles.iconButton, ...style }}
      disabled={disabled}
      iconColor={disabled ? theme.colors.textSecond : color}
      dot={dot}
    />
  );
};

const buttonStyles = StyleSheet.create({
  touch: {
    flexDirection: "row"
  },
  buttonStyle: {
    borderRadius: 20,
    alignItems: "center",
    padding: 2,
    justifyContent: "center"
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  inner: {
    borderRadius: 21,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 28,
    paddingVertical: 14
  },
  innerHidden: {
    backgroundColor: "transparent"
  },
  buttonText: {
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "500",
    paddingLeft: 10,
    paddingRight: 5
  },
  iconButton: {
    height: "100%",
    aspectRatio: 1
  }
});
