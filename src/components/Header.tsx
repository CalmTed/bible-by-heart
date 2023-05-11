import { FC } from "react"
import { StyleSheet, View, Text, Vibration } from "react-native"
import { COLOR, globalStyle } from "../constants"
// import { IconButton } from "./button"
import { StackNavigationHelpers } from "@react-navigation/stack/src/types"
import { IconButton } from "./Button"
import { IconName } from "./Icon"

interface HeaderModel{
  navigation: StackNavigationHelpers
  showBackButton?: boolean
  title?: string
  additionalChild?: React.ReactNode
  additionalChildren?: React.ReactNode[]
  alignChildren?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly"
}


export const Header: FC<HeaderModel> = ({navigation,title, showBackButton, additionalChild, additionalChildren, alignChildren}) => {
  const handleBack = () => {
    navigation.goBack();
  }
  return (
  <View style={{...headerStyle.view, justifyContent: alignChildren || "flex-end"}}>
    {showBackButton && <IconButton onPress={handleBack} icon={IconName.back}></IconButton>}
    {title && <View style={headerStyle.textView}>
      {title && <Text style={headerStyle.text}>{title}</Text>}
    </View>}
    {additionalChild}
    {additionalChildren && additionalChildren.map((child, i) => {
      return <View key={i}>{child}</View>
    })}
  </View>
)
}

const headerStyle = StyleSheet.create({
  view: {
    height: 60,
    width: "100%",
    flexDirection: "row"
  },
  textView: {
    height: "100%",
    justifyContent: "center",
    marginHorizontal: 20,
    flex: 1
  },
  text: {
    color: globalStyle.text.color,
    fontSize: 18,
    fontWeight: "500",
    textTransform: "uppercase"
  }
})