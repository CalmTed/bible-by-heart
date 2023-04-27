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
  type?: "main"
  icon?: IconName
}

export const Button: FC<ButtonModel> = ({title, style, onPress, disabled, type, icon}) => {
  return <TouchableOpacity style={{ flexDirection: "row", opacity: disabled ? 0.5 : 1}} onPress={onPress} disabled={disabled}>
    
    {
      type === "main" && <LinearGradient
          colors={['#1A9E37', '#1A869E']}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={{...buttonStyles.buttonStyle,...style}}
        >
          
          <Text style={buttonStyles.buttonText}>{title}</Text>
        </LinearGradient>
      }
      {
        type !== "main" &&  <View style={{...buttonStyles.buttonStyle,...style}}>
          {icon && <Icon iconName={icon}/>}
          {title && <Text style={buttonStyles.buttonText}>{title}</Text>}
        </View>
      }
  </TouchableOpacity>
}

interface IconButtonModel{
  icon: IconName
  onPress: () => void
  style?: StyleSheet.NamedStyles<{}>
  disabled?: boolean
}

export const IconButton: FC<IconButtonModel> = ({icon, onPress, style, disabled}) => {
  return <Button icon={icon} onPress={onPress} style={{...buttonStyles.iconButton, ...style}} disabled={disabled}/>
}

const buttonStyles = StyleSheet.create({
  buttonStyle: {
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center"
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