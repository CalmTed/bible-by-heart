import { FC } from "react"
import { StyleSheet, View, TextInput } from "react-native"
import { COLOR } from "../constants"
import { LinearGradient } from "expo-linear-gradient"
import { Icon, IconName } from "./Icon"

interface InputModel {
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder: string
  value?: string
  disabled?: boolean
  type?: "main" | "outline" | "secondary" | "transparent"
  icon?: IconName
  color?: "green" | "red" | "gray"
  style?: StyleSheet.NamedStyles<{}>
  textStyle?: StyleSheet.NamedStyles<{}>
  multiline?: boolean
  numberOfLines?: number
  selectTextOnFocus?: boolean
}

export const Input: FC<InputModel> = ({value, placeholder, style, textStyle, onSubmit, onChange, disabled, type = "secondary", icon, color = "gray", multiline = false, numberOfLines = 1, selectTextOnFocus}) => {
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
              value={value} 
              onChangeText={onChange}
              placeholder={placeholder}
              onSubmitEditing={(e) => onSubmit(e.currentTarget.toString())}
              editable={!disabled}
              selectTextOnFocus={true}
              placeholderTextColor={COLOR.textSecond}
              multiline={multiline}
              numberOfLines={numberOfLines}
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