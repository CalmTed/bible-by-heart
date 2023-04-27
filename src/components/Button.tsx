import { FC, ReactElement } from "react"
import { TouchableOpacity, StyleSheet, Text, View } from "react-native"
import { COLOR } from "../constants"
import { LinearGradient } from "expo-linear-gradient"

interface ButtonModel {
  onPress: () => void
  style?: StyleSheet.NamedStyles<{}>
  title?: string
  disabled?: boolean
  type?: "main"
}

export const Button: FC<ButtonModel> = ({title, style, onPress, disabled, type}) => {
  return <TouchableOpacity style={{...style, flexDirection: "row", opacity: disabled ? 0.5 : 1}} onPress={onPress} disabled={disabled}>
    {
      type === "main" && <LinearGradient
          colors={['#1A9E37', '#1A869E']}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={buttonStyles.buttonStyle}
        >
          <Text style={buttonStyles.buttonText}>{title}</Text>
        </LinearGradient>
      }
      {
        type !== "main" && title &&  <View style={buttonStyles.buttonStyle}>
          <Text style={buttonStyles.buttonText}>{title}</Text>
        </View>
      }
  </TouchableOpacity>
}

interface IconButtonModel{
  icon: string,
  onPress: () => void
}

export const IconButton: FC<IconButtonModel> = ({icon, onPress}) => {
  return <Button title={icon} onPress={onPress}/>
}

interface IconButtonModel {
  onPress: () => void
  disabled?: boolean
}

const buttonStyles = StyleSheet.create({
  buttonStyle: {
    borderRadius: 18
  },
  buttonText: {
    color: COLOR.color,
    textTransform: "uppercase",
    fontSize: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    fontWeight: "500"
  },
});