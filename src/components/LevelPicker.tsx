import { LinearGradient } from "expo-linear-gradient"
import { FC, useState } from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import { PERFECT_TESTS_TO_PRCEED, PASSAGE_LEVEL } from "../constants"
import { WORD } from "../l10n"
import { AppStateModel, PassageModel, TestModel } from "../models"
import { MiniModal } from "./miniModal"
import { IconName } from "./Icon"
import { Button } from "./Button"
import { getPerfectTestsNumber } from "../tools/getPerfectTests"
import { ThemeAndColorsModel, getTheme } from "../tools/getTheme"

interface LevelPickerModel {
  targetPassage: PassageModel
  handleChange: (level: PASSAGE_LEVEL, passageId: number) => void
  handleOpen: (passageId: number) => void
  t: (w: WORD) => string
  state: AppStateModel
  activeTestObj?: TestModel
  handleRestart?: () => void
}

export const LevelPicker:FC<LevelPickerModel> = ({targetPassage, t, handleChange, handleOpen, state, activeTestObj, handleRestart}) => {
  const [levelPickerShown, setLevelPickerShown] = useState(false)
  const closeLevelPicker = () => {
    setLevelPickerShown(false)
  }
  const handleLabelPress = () => {
    setLevelPickerShown(true)
    handleOpen(targetPassage.id)
  }
  const theme = getTheme(state.settings.theme)
  const levelPickerStyles = StyleSheet.create({
    levelPickerView: {
      justifyContent: "flex-start"
    },
    headerText: {
      color: theme.colors.text,
      textTransform: "uppercase",
      fontWeight: "500",
      fontSize: 22,
    },
    subText: {
      textAlign: "center",
      color: theme.colors.textSecond,
      fontSize: 16,
    },
    buttonsView: {
      marginTop: 50,
      marginBottom: 20,
      flexDirection: "row",
      gap: 5
    },
    buttonStyle: {
      margin: 0
    },
    levelPickerWrapper: {
      flexDirection: "row",
      justifyContent: "center",
    }
  })
  return <View style={{...levelPickerStyles.levelPickerView}}>
  <View style={{...levelPickerStyles.levelPickerWrapper}}>
    <Button theme={theme} title={ `${t("Level")} ${targetPassage.selectedLevel}`} icon={IconName.selectArrow} onPress={handleLabelPress}/>
    {targetPassage.isNewLevelAwalible && <NewLevelIndicator theme={theme} />}
  </View>
  <MiniModal theme={theme} shown={levelPickerShown} handleClose={() => setLevelPickerShown(false)}>
    <Text style={levelPickerStyles.headerText}>{t("LanguagePickerHeading")}</Text>
    <View style={levelPickerStyles.buttonsView}>
      {[
        PASSAGE_LEVEL.l1,PASSAGE_LEVEL.l2,PASSAGE_LEVEL.l3,PASSAGE_LEVEL.l4,PASSAGE_LEVEL.l5
      ].map(n => {
        const color = targetPassage.selectedLevel === n ? "green" : "gray"
        const disabled = n > targetPassage.maxLevel
        return <Button
          theme={theme}
          type={disabled ? "secondary" : "outline"}
          color={color}
          style={levelPickerStyles.buttonStyle}
          key={n}
          title={n.toString()}
          onPress={() => handleChange(n, targetPassage.id)}
          disabled={disabled}
        />
      })}
    </View>
    {activeTestObj && targetPassage.selectedLevel.toString() === activeTestObj.level.toString().slice(0,1) && targetPassage.selectedLevel === targetPassage.maxLevel
    && <Text style={levelPickerStyles.subText}>{t("LanguagePickerSubtext")}  ({getPerfectTestsNumber(state.testsHistory,targetPassage)}/{PERFECT_TESTS_TO_PRCEED})</Text>}
    {activeTestObj && targetPassage.selectedLevel.toString() !== activeTestObj.level.toString().slice(0,1) 
    && <Text style={levelPickerStyles.subText}>{t("LanguagePickerSubtextSecond")}</Text>}
    {activeTestObj && handleRestart && targetPassage.selectedLevel.toString() !== activeTestObj.level.toString().slice(0,1) 
    && <Button theme={theme} title={t("RestartTests")} onPress={() => {closeLevelPicker();handleRestart()}}/>}
    <Button theme={theme} color="green" type="outline" title={t("Close")} onPress={() => closeLevelPicker()}/>
  </MiniModal>
</View>
}

const NewLevelIndicator: FC<{theme: ThemeAndColorsModel}> = ({theme}) => {
  return <View style={{
    width: 10,
    aspectRatio: 1,
    borderRadius: 100,
    overflow: "hidden",
    marginLeft: -35,
    marginRight: 35,
    marginTop: 15,
    marginBottom: -15
  }}>
    <Pressable>
      <LinearGradient
        colors={[theme.colors.gradient1, theme.colors.gradient2] }
        start={{ x: 0.0, y: 0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1]}
        style={{
          height: "100%",
          width: "100%",
        }}
        />
      </Pressable>
  </View>
}