import { FC } from "react"
import { View, Text, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { COLOR } from "../constants"
import { AppStateModel } from "../models"
import { getWeeklyStats } from "../tools/getStats"
import { WORD } from "src/l10n"

export const WeekActivityComponent: FC<{
  state: AppStateModel,
  t: (w: WORD) => string 
  }> = ({state, t}) => {
  const weekActivityData = getWeeklyStats(state.passages,state.testsHistory)
  const maxValue = Math.max(...weekActivityData.map(d => d.verses))
  return <View style={weekActivityStyles.wrapper}>
    {weekActivityData.map((data, i) => {
      return <DayActivityBar
        key={data.label}
        value={data.verses}
        maxValue={maxValue}
        label={t(data.label as WORD)}
        isToday={ new Date().getDay() - 1 === i }
        />
    })}
  </View>
}

const DayActivityBar: FC<{
  value: number
  maxValue: number
  label: string
  isToday: boolean
}> = ({
  value, maxValue, label, isToday
}) => {
  const barHeight = `${(80 / maxValue * value )+ 20}%`;
  const gradientColors = !!value ? [COLOR.gradient1, COLOR.gradient2] : [COLOR.bgSecond, COLOR.bgSecond]
  return <View style={weekActivityStyles.dayItemGroup}>
     <LinearGradient
          colors={gradientColors}
          start={{ x: 0.0, y: 0 }}
          end={{ x: 0.0, y: 1.0 }}
          locations={[0, 1]}
          style={{...weekActivityStyles.itemBar, height: barHeight}}
        >
          <Text style={weekActivityStyles.itemNumberText}>{ value }</Text>
        </LinearGradient>
        <Text style={{...weekActivityStyles.itemLabel, ...(isToday ? {color: COLOR.text} : {})}}>{ label }</Text>
  </View>
}

const weekActivityStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
    height: 100,
    marginBottom: 20,
  },
  dayItemGroup: {
    height: 80,
    minHeight: 20,
    justifyContent: "flex-end",
    alignItems: "center"
  },
  itemLabel: {
    color: COLOR.textSecond,
    textTransform: "uppercase",
    marginTop: 5,
    fontSize: 10
  },
  itemBar: {
    borderRadius: 20,
    width: 25,
    alignContent: "center"
  },
  itemNumberText: {
    fontSize: 11,
    color: COLOR.text,
    textAlign: "center"
  }
})
