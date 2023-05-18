import { LinearGradient } from "expo-linear-gradient"
import { FC } from "react"
import { View, StyleSheet, Pressable} from "react-native"
import { COLOR } from "../constants"

interface TestNavDottModel{
  isCurrent: boolean
  color: "red" | "green" | "gray" | "text"
  onPress?: () => void
}

export const TestNavDott: FC<TestNavDottModel> = ({isCurrent, color, onPress}) => {
  const colors = color === "gray" ?
    [COLOR.textSecond, COLOR.textSecond] :
    color === "red" ?
      [COLOR.redGradient1, COLOR.redGradient2] :
      color === "text" ?
        [COLOR.text, COLOR.textSecond] :
        [COLOR.gradient1, COLOR.gradient2]
  return <View style={testNavDottStyles.wrapper}>
    <Pressable onPress={() => onPress ? onPress() : null}>
    <LinearGradient
        colors={colors}
        start={{ x: 0.0, y: 0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1]}
        style={testNavDottStyles.gradientView}
      >
          
      {!isCurrent && <View style={testNavDottStyles.inner}></View>}
    </LinearGradient>
    </Pressable>
  </View>
}

const testNavDottStyles = StyleSheet.create({
  wrapper: {
    width: 18,
    aspectRatio: 1,
    borderRadius: 100,
    overflow: "hidden",
    marginHorizontal: 5,
  },
  gradientView: {
    height: "100%",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  inner: {
    backgroundColor: COLOR.bg,
    width: 13,
    borderRadius: 100,
    aspectRatio: 1
  }
})