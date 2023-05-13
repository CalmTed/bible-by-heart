import { FC, ReactElement } from "react"
import { TouchableOpacity, StyleSheet, Text, View, TextInput } from "react-native"
import { COLOR } from "../constants"
import { LinearGradient } from "expo-linear-gradient"
import { Icon, IconName } from "./Icon"

interface InputModel {
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder: string
  defaultText?: string
  disabled?: boolean
  type?: "main" | "outline" | "secondary" | "transparent"
  icon?: IconName
  color?: "green" | "red" | "gray"
  style?: StyleSheet.NamedStyles<{}>
  textStyle?: StyleSheet.NamedStyles<{}>
}

export const Input: FC<InputModel> = ({defaultText, placeholder, style, textStyle, onSubmit, onChange, disabled, type = "secondary", icon, color = "gray"}) => {
  const gradientColors = type === "transparent" ? ["transparent", "transparent"] : color === "gray" ? [COLOR.bgSecond, COLOR.bgSecond] : color === "green" ? [COLOR.gradient1, COLOR.gradient2] : [COLOR.redGradient1, COLOR.redGradient2]
  return   <View style={{...InputStyles.touch}}>
  <View style={{...InputStyles.touch , opacity: disabled ? 0.5 : 1}} >
    {
      <LinearGradient
          colors={gradientColors}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={{
            ...InputStyles.InputStyle,
            ...style
          }}
        >
          <View style={{...InputStyles.inner, ...(!["main", "transparent"].includes(type) ? InputStyles.innerShown : InputStyles.innerHidden)}}>
            {icon && <Icon iconName={icon} color={color}/>}
            <TextInput
              style={{...InputStyles.InputText}}
              defaultValue={defaultText} 
              onChangeText={onChange}
              placeholder={placeholder}
              onSubmitEditing={(e) => onSubmit(e.currentTarget.toString())}
              editable={!disabled}
              selectTextOnFocus={!disabled}
              placeholderTextColor={COLOR.textSecond}
            />
          </View>
        </LinearGradient>
      }
    </View>
  </View>
}


const InputStyles = StyleSheet.create({
  touch: {
    flexDirection: "row",
  },
  InputStyle: {
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
  InputText: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontSize: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    fontWeight: "500"
  },
  iconInput:{
    height: "100%",
    aspectRatio: 1,
  }
});