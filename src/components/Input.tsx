import React, { FC } from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, IconName } from "./Icon";
import { ThemeAndColorsModel } from "src/tools/getTheme";

interface InputModel {
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder: string;
  theme: ThemeAndColorsModel;
  value?: string;
  disabled?: boolean;
  type?: "main" | "outline" | "secondary" | "transparent";
  icon?: IconName;
  color?: "green" | "red" | "gray";
  wrapperStyle?: StyleSheet.NamedStyles<{}>;
  style?: StyleSheet.NamedStyles<{}>;
  textStyle?: StyleSheet.NamedStyles<{}>;
  multiline?: boolean;
  numberOfLines?: number;
  selectTextOnFocus?: boolean;
  autoComplete?:
    | "birthdate-day"
    | "birthdate-full"
    | "birthdate-month"
    | "birthdate-year"
    | "cc-csc"
    | "cc-exp"
    | "cc-exp-day"
    | "cc-exp-month"
    | "cc-exp-year"
    | "cc-number"
    | "email"
    | "gender"
    | "name"
    | "name-family"
    | "name-given"
    | "name-middle"
    | "name-middle-initial"
    | "name-prefix"
    | "name-suffix"
    | "password"
    | "password-new"
    | "postal-address"
    | "postal-address-country"
    | "postal-address-extended"
    | "postal-address-extended-postal-code"
    | "postal-address-locality"
    | "postal-address-region"
    | "postal-code"
    | "street-address"
    | "sms-otp"
    | "tel"
    | "tel-country-code"
    | "tel-national"
    | "tel-device"
    | "username"
    | "username-new"
    | "off";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  autoCorrect?: boolean;
  inputMode?:
    | "decimal"
    | "email"
    | "none"
    | "numeric"
    | "search"
    | "tel"
    | "text"
    | "url";
  maxLength?: number;
}

export const Input: FC<InputModel> = ({
  value,
  placeholder,
  theme,
  wrapperStyle,
  style,
  onSubmit = () => {},
  onChange,
  disabled,
  type = "secondary",
  icon,
  color = "gray",
  multiline = false,
  numberOfLines = 1,
  selectTextOnFocus,
  autoCapitalize = "none",
  autoCorrect = true,
  autoComplete,
  textStyle,
  inputMode,
  maxLength
}) => {
  const gradientColors =
    type === "transparent"
      ? ["transparent", "transparent"]
      : color === "gray"
      ? [theme.colors.bgSecond, theme.colors.bgSecond]
      : color === "green"
      ? [theme.colors.gradient1, theme.colors.gradient2]
      : [theme.colors.redGradient1, theme.colors.redGradient2];
  const InputStyles = StyleSheet.create({
    scrollView: {
      maxWidth: "100%",
      width: "auto"
    },
    touch: {
      flexDirection: "row"
    },
    InputStyle: {
      borderRadius: 22,
      alignItems: "center",
      padding: 2,
      justifyContent: "center"
    },
    inner: {
      borderRadius: 21,
      justifyContent: "center",
      alignContent: "center"
    },
    innerShown: {
      backgroundColor: theme.colors.bgSecond
    },
    innerHidden: {
      backgroundColor: "transparent"
    },
    InputText: {
      color: theme.colors.text,
      fontSize: 18,
      paddingHorizontal: 14,
      paddingVertical: 7,
      fontWeight: "500",
      minWidth: 100
    },
    iconInput: {
      height: "100%",
      aspectRatio: 1
    }
  });
  return (
    <View style={{ ...InputStyles.touch }}>
      <View style={{ ...InputStyles.touch, opacity: disabled ? 0.5 : 1 }}>
        {
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0.0, y: 0 }}
            end={{ x: 0.0, y: 1.0 }}
            locations={[0, 1]}
            style={{
              ...InputStyles.InputStyle,
              ...wrapperStyle
            }}
          >
            <View
              style={{
                ...InputStyles.inner,
                ...(!["main", "transparent"].includes(type)
                  ? InputStyles.innerShown
                  : InputStyles.innerHidden),
                ...style
              }}
            >
              {icon && <Icon iconName={icon} color={color} />}
              <TextInput
                style={{
                  ...InputStyles.InputText,
                  ...textStyle
                }}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                onSubmitEditing={(e) => onSubmit(e.nativeEvent.text || "")}
                editable={!disabled}
                selectTextOnFocus={selectTextOnFocus}
                placeholderTextColor={theme.colors.textSecond}
                multiline={multiline}
                numberOfLines={numberOfLines}
                autoComplete={autoComplete}
                autoCapitalize={autoCapitalize}
                autoCorrect={autoCorrect}
                cursorColor={theme.colors.mainColor}
                inputMode={inputMode}
                maxLength={maxLength}
              />
            </View>
          </LinearGradient>
        }
      </View>
    </View>
  );
};
