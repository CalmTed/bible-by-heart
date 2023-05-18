import { FC, ReactElement } from "react"
import { StyleSheet, Text, View, Pressable } from "react-native"
import { COLOR } from "../constants"
import { LinearGradient } from "expo-linear-gradient"
import { Icon, IconName } from "./Icon"

interface ButtonModel {
  onPress: () => void
  style?: StyleSheet.NamedStyles<{}>
  textStyle?: StyleSheet.NamedStyles<{}>
  title?: string
  disabled?: boolean
  type?: "main" | "outline" | "secondary" | "transparent"
  icon?: IconName
  color?: "green" | "red" | "gray"
}

export const Button: FC<ButtonModel> = ({title, style, textStyle, onPress, disabled, type = "transparent", icon, color = "gray"}) => {
  const gradientColors = type === "transparent" ? ["transparent", "transparent"] : color === "gray" ? [COLOR.bgSecond, COLOR.bgSecond] : color === "green" ? [COLOR.gradient1, COLOR.gradient2] : [COLOR.redGradient1, COLOR.redGradient2]
  const textColor = type === "transparent" ? color === "red" ? COLOR.textDanger : color === "gray" ? COLOR.text : COLOR.mainColor : COLOR.text;
  return   <View style={{...buttonStyles.touch}}>
  <Pressable
    style={{...buttonStyles.touch , opacity: disabled ? 0.5 : 1}}
    onPress={onPress}
    disabled={disabled}
    android_ripple={{
      color: COLOR.bgBackdrop,
      foreground: true
    }}
  >
    {
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
          <View style={{
            ...buttonStyles.inner,
            ...(!["main", "transparent"].includes(type) ? buttonStyles.innerShown : buttonStyles.innerHidden),
            }}>
            {icon && <Icon iconName={icon}/>}
            {title && <Text style={{...buttonStyles.buttonText, ...textStyle, color: textColor}}>{title}</Text>}
          </View>
        </LinearGradient>
      }
    </Pressable>
  </View>
}

interface IconButtonModel{
  icon: IconName
  onPress: () => void
  style?: StyleSheet.NamedStyles<{}>
  disabled?: boolean
  color?: "green" | "red" | "gray"
}

export const IconButton: FC<IconButtonModel> = ({icon, onPress, style, disabled, color}) => {
  return <Button icon={icon} onPress={onPress} style={{...buttonStyles.iconButton, ...style}} disabled={disabled} color={color}/>
}

const buttonStyles = StyleSheet.create({
  touch: {
    flexDirection: "row",
  },
  buttonStyle: {
    borderRadius: 22,
    alignItems: "center",
    padding: 2,
    justifyContent: "center",
    
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inner: {
    borderRadius: 21,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 28,
    paddingVertical: 14,
  },
  innerShown: {
    backgroundColor: COLOR.bgSecond,
  },
  innerHidden: {
    backgroundColor: "transparent"
  },
  buttonText: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "500",
    paddingLeft: 10
  },
  iconButton:{
    height: "100%",
    aspectRatio: 1,
  }
});