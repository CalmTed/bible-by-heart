import { FC, useState } from "react"
import { StyleSheet, View, Text, Pressable } from "react-native"
import { OptionModel } from "../models"
import { Select } from "./Select"
import { ThemeAndColorsModel } from "src/tools/getTheme"

type settingsMenuItemModel = {
  theme: ThemeAndColorsModel
  header: string
  subtext: string
  type: "action"
  actionCallBack: () => void//aka open modal
} | {
  theme: ThemeAndColorsModel
  header: string
  subtext: string
  type: "checkbox"
  checkBoxState: boolean
  onClick: (newState: boolean) => void
} | {
  theme: ThemeAndColorsModel
  header: string
  subtext: string
  type: "select",
  selectedIndex: number
  options: OptionModel[]
  onSelect: (selectedValue: string) => void
} | {
  theme: ThemeAndColorsModel
  header: string
  type: "label"
}

export const SettingsMenuItem: FC<settingsMenuItemModel> = (data) => {
  const [selectOpen, setSelectOpen] = useState(false)

  const handleOpenSelectList = () => {
    setSelectOpen(true)
  }
  const handleOptionSelect = (value: string) => {
    setSelectOpen(false)
    if(data.type === "select"){
      data.onSelect(value)
    }
  }
  const settingsMenuItemStyles = StyleSheet.create({
    view: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 15,
    },
    labelView: {
      alignItems: "flex-end",
      paddingTop: 25,
      paddingBottom: 0,
      // paddingVertical: 5,
    },
    header: {
      color: data.theme.colors.text,
      fontSize: 21,
      fontWeight: "600"
    },
    subtext: {
      color: data.theme.colors.textSecond,
      fontSize: 14
    },
    label: {
      color: data.theme.colors.textSecond,
      fontSize: 14,
      textTransform: "uppercase",
      fontWeight: "600"
    }
  })
  return <View style={{
      ...settingsMenuItemStyles.view,
      ...(data.type === "label" ? settingsMenuItemStyles.labelView : {})
    }}>
    {
      data.type === "label" && 
      <Text style={settingsMenuItemStyles.label}>{data.header}</Text>
    }
    {
      data.type === "action" && 
      <Pressable onPress={data.actionCallBack}>
        <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
        <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
      </Pressable>
    }
    {
      data.type === "checkbox" && 
      <Pressable onPress={() => data.onClick(!data.checkBoxState)}>
        <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
        <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
        <Text>{data.checkBoxState ? "=0" : "0="}</Text>
      </Pressable>
    }
    {
      data.type === "select" && 
      <View>
        <Pressable onPress={handleOpenSelectList}>
          <Text style={settingsMenuItemStyles.header}>{data.header}</Text>
          <Text style={settingsMenuItemStyles.subtext}>{data.subtext}</Text>
        </Pressable>
          <Select
            theme={data.theme}
            isShown={selectOpen}
            options={data.options}
            selectedIndex={data.selectedIndex}
            onSelect={handleOptionSelect}
            onCancel={() => setSelectOpen(false)}
          ></Select>
      </View>
    }
  </View>
  
}