import { FC } from "react"
import { MiniModal } from "./miniModal"
import { OptionModel } from "../models"
import { StyleSheet, Text, View } from "react-native"
import { ThemeAndColorsModel } from "src/tools/getTheme"
import { Button } from "./Button"

interface SelectModel{
  isShown: boolean
  options: OptionModel[]
  selectedIndex: number | null
  onSelect: (value: string) => void
  onCancel: () => void
  theme: ThemeAndColorsModel
  title?: string
}

export const SelectModal: FC<SelectModel> = ({isShown, options, selectedIndex, onSelect, onCancel, title, theme}) => {
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
    itemLabel: {
      color: theme.colors.text,
      fontSize: 20,
      textTransform: "uppercase",
      fontWeight: "600"
    },
    selectedItemLabel: {
      color: theme.colors.mainColor
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
      <Button
        key={option.value}
        theme={theme}
        color={selectedIndex === i ? "green" : "gray"}
        type={selectedIndex === i ? "outline" : "outline"}
        onPress={() => onSelect(option.value)}
        title={option.label}
      />
    )}
    </View>
  </MiniModal>
}