import React, { FC } from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon, IconName } from "./Icon";
import { useAppContext } from "../context/AppContext";

interface InputModel {
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  onEndEditing?: (value: string) => void;
  placeholder: string;
  value?: string;
  disabled?: boolean;
  type?: "main" | "outline" | "secondary" | "transparent";
  icon?: IconName;
  color?: "green" | "red" | "gray";
  wrapperStyle?: StyleSheet.NamedStyles<object>;
  style?: StyleSheet.NamedStyles<object>;
  textStyle?: StyleSheet.NamedStyles<object>;
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
  secureTextEntry?: boolean;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numeric"
    | "email-address"
    | "phone-pad"
    | "url";
  textContentType?:
    | "none"
    | "URL"
    | "emailAddress"
    | "name"
    | "nickname"
    | "telephoneNumber"
    | "username"
    | "password"
    | "newPassword"
    | "oneTimeCode"
    | "birthdate";
  iconAfter?: IconName;
  iconColor?: "green" | "red" | "gray";
}

export const Input: FC<InputModel> = ({
  value,
  placeholder,
  wrapperStyle,
  style,
  onSubmit = () => {},
  onEndEditing = () => {},
  onChange,
  disabled,
  type = "secondary",
  icon,
  color = "gray",
  multiline = false,
  numberOfLines = undefined,
  selectTextOnFocus,
  autoCapitalize = "none",
  autoCorrect = true,
  autoComplete,
  textStyle,
  inputMode,
  maxLength,
  secureTextEntry,
  keyboardType,
  textContentType,
  iconAfter,
  iconColor
}) => {
  const { theme } = useAppContext();
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
      width: "auto",
      height: "auto"
    },
    touch: {
      flexDirection: "row"
    },
    innerTouch: {
      flexDirection: "row",
      opacity: disabled ? 0.5 : 1
    },
    InputStyle: {
      borderRadius: 22,
      alignItems: "center",
      padding: 2,
      justifyContent: "center"
    },
    inner: {
      borderRadius: 21,
      width: "100%",
      paddingRight: 15,
      justifyContent: "space-between",
      alignContent: "space-between",
      alignItems: "center",
      flexDirection: "row"
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
      aspectRatio: 1,
      minWidth: 40
    }
  });
  return (
    <View style={InputStyles.touch}>
      <View style={InputStyles.innerTouch}>
        {
          <LinearGradient
            //@ts-ignore
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
                ...style,
                ...InputStyles.inner,
                ...(!["main", "transparent"].includes(type)
                  ? InputStyles.innerShown
                  : InputStyles.innerHidden)
              }}
            >
              {icon && <Icon iconName={icon} color={iconColor || color} />}
              <TextInput
                style={{
                  ...textStyle,
                  ...InputStyles.InputText
                }}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                onSubmitEditing={(e) => onSubmit(e.nativeEvent.text || "")}
                onEndEditing={(e) => onEndEditing(e.nativeEvent.text || "")}
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
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                textContentType={textContentType}
              />
              {iconAfter && <Icon iconName={iconAfter} color={color} />}
            </View>
          </LinearGradient>
        }
      </View>
    </View>
  );
};
