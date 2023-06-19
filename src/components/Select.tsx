import { FC } from "react"
import { MiniModal } from "./miniModal"
import { OptionModel } from "../models"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { ThemeAndColorsModel } from "src/tools/getTheme"

interface SelectModel{
  isShown: boolean
  options: OptionModel[]
  selectedIndex: number
  onSelect: (value: string) => void
  onCancel: () => void
  theme: ThemeAndColorsModel
  title?: string
}

export const Select: FC<SelectModel> = ({isShown, options, selectedIndex, onSelect, onCancel, title, theme}) => {
  const selectStyles = StyleSheet.create({
    list: {
      flexDirection: "column",
      gap: 10,
      alignItems: "center",
    },
    itemView: {
      width: "100%",
      paddingHorizontal: 15,
      paddingVertical: 10 
    },
    selectedItemView: {
  
    },
    itemLabel: {
      color: theme.colors.text,
      fontSize: 20,
      textTransform: "uppercase",
      fontWeight: "600"
    },
    titleView: {
    }, 
    titleText: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: "600"
    }
  })
  return <MiniModal theme={theme} shown={isShown} handleClose={onCancel} >
    {title && 
    <View style={selectStyles.titleView}>
      <Text  style={selectStyles.titleText}>{title}</Text>
    </View>
    }
    <View style={selectStyles.list}>
    {
    options.map((option, i) => 
      <Pressable
        key={option.value}
        onPress={() => onSelect(option.value)}
        style={{
          ...selectStyles.itemView,
          ...(selectedIndex === i ? selectStyles.selectedItemView : {})
        }}
      >
        <Text style={selectStyles.itemLabel}>{option.label}</Text>
      </Pressable>  
    )}
    </View>
  </MiniModal>
}