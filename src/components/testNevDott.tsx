import { LinearGradient } from "expo-linear-gradient"
import { FC } from "react"
import { View, StyleSheet} from "react-native"
import { COLOR } from "../constants"

interface TestNavDottModel{
  isCurrent: boolean
  color: "red" | "green" | "gray"
}

export const TestNavDott: FC<TestNavDottModel> = ({isCurrent, color}) => {
  const colors = color === "gray" ? [COLOR.textSecond, COLOR.textSecond] : color === "red" ? [COLOR.redGradient1, COLOR.redGradient2] : [COLOR.gradient1, COLOR.gradient2]
  return <View style={testNavDottStyles.wrapper}>
    <LinearGradient
        colors={colors}
        start={{ x: 0.0, y: 0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1]}
        style={testNavDottStyles.gradientView}
      >
          
      {!isCurrent && <View style={testNavDottStyles.inner}></View>}
    </LinearGradient>
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