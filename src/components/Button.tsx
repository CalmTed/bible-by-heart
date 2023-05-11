import { FC, ReactElement } from "react"
import { TouchableOpacity, StyleSheet, Text, View } from "react-native"
import { COLOR } from "../constants"
import { LinearGradient } from "expo-linear-gradient"
import { Icon, IconName } from "./Icon"

interface ButtonModel {
  onPress: () => void
  style?: StyleSheet.NamedStyles<{}>
  title?: string
  disabled?: boolean
  type?: "main" | "outline" | "secondary" | "transparent"
  icon?: IconName
  color?: "green" | "red" | "gray"
}

export const Button: FC<ButtonModel> = ({title, style, onPress, disabled, type = "transparent", icon, color = "green"}) => {
  const gradientColors = type === "transparent" ? ["transparent", "transparent"] : color === "gray" ? [COLOR.bgSecond, COLOR.bgSecond] : color === "green" ? [COLOR.gradient1, COLOR.gradient2] : [COLOR.redGradient1, COLOR.redGradient2]
  return   <View style={{...buttonStyles.touch}}>
  <TouchableOpacity style={{...buttonStyles.touch , opacity: disabled ? 0.5 : 1}} onPress={onPress} disabled={disabled}>
    
    {
      <LinearGradient
          colors={gradientColors}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={{
            ...buttonStyles.buttonStyle,
            ...style
          }}
        >
          <View style={{...buttonStyles.inner, ...(!["main", "transparent"].includes(type) ? buttonStyles.innerShown : buttonStyles.innerHidden)}}>
            {icon && <Icon iconName={icon} color={color}/>}
            {title && <Text style={buttonStyles.buttonText}>{title}</Text>}
          </View>
        </LinearGradient>
      }
    </TouchableOpacity>
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
  inner: {
    borderRadius: 21,
    justifyContent: "center",
    alignContent: "center",
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
    paddingHorizontal: 28,
    paddingVertical: 14,
    fontWeight: "500"
  },
  iconButton:{
    height: "100%",
    aspectRatio: 1,
  }
});