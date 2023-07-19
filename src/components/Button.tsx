import React, { FC } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, IconName } from "./Icon";
import { ThemeAndColorsModel } from "src/tools/getTheme";
import { DotIndicator } from "./DotIndicator";

interface ButtonModel {
  theme: ThemeAndColorsModel;
  onPress: () => void;
  style?: StyleSheet.NamedStyles<{}>;
  textStyle?: StyleSheet.NamedStyles<{}>;
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
  theme,
  iconColor,
  dot,
  iconAlign = "left"
}) => {
  const gradientColors =
    type === "transparent"
      ? ["transparent", "transparent"]
      : color === "gray"
      ? [theme.colors.bgSecond, theme.colors.bgSecond]
      : color === "green"
      ? [theme.colors.gradient1, theme.colors.gradient2]
      : [theme.colors.redGradient1, theme.colors.redGradient2];
  const textColor =
    type === "transparent"
      ? color === "red"
        ? theme.colors.textDanger
        : color === "gray"
        ? theme.colors.text
        : theme.colors.mainColor
      : theme.colors.text;
  return (
    <View style={{ ...buttonStyles.touch }}>
      <Pressable
        style={{ ...buttonStyles.touch, opacity: disabled ? 0.5 : 1 }}
        onPress={onPress}
        disabled={disabled}
        android_ripple={{
          color: theme.colors.bgBackdrop,
          foreground: true
        }}
      >
        <LinearGradient
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
            {dot && (
              <DotIndicator
                theme={theme}
                left={-5}
                right={5}
                top={-10}
                bottom={10}
              />
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
};

interface IconButtonModel {
  icon: IconName;
  onPress: () => void;
  theme: ThemeAndColorsModel;
  style?: StyleSheet.NamedStyles<{}>;
  disabled?: boolean;
  color?: string;
  dot?: boolean;
}

export const IconButton: FC<IconButtonModel> = ({
  theme,
  icon,
  onPress,
  style,
  disabled,
  color,
  dot
}) => {
  return (
    <Button
      theme={theme}
      icon={icon}
      onPress={onPress}
      style={{ ...buttonStyles.iconButton, ...style }}
      disabled={disabled}
      iconColor={color}
      dot={dot}
    />
  );
};

const buttonStyles = StyleSheet.create({
  touch: {
    flexDirection: "row"
  },
  buttonStyle: {
    borderRadius: 22,
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
