import { LinearGradient } from "expo-linear-gradient"
import { FC, useState } from "react"
import { View, StyleSheet, Pressable, Text } from "react-native"
import { COLOR, PERFECT_TESTS_TO_PRCEED, PASSAGE_LEVEL } from "../constants"
import { WORD } from "../l10n"
import { AppStateModel, PassageModel, TestModel } from "../models"
import { MiniModal } from "./miniModal"
import { IconName } from "./Icon"
import { Button } from "./Button"
import { getPerfectTestsNumber } from "../tools/getPerfectTests"

interface LevelPickerModel {
  targetPassage: PassageModel
  handleChange: (level: PASSAGE_LEVEL, passageId: number) => void
  handleOpen: (passageId: number) => void
  t: (w: WORD) => string
  state?: AppStateModel
  activeTestObj?: TestModel
  handleRestart?: () => void
}

const levelPickerStyles = StyleSheet.create({
  levelPickerView: {
    justifyContent: "flex-start"
  },
  headerText: {
    color: COLOR.text,
    textTransform: "uppercase",
    fontWeight: "500",
    fontSize: 22,
  },
  subText: {
    textAlign: "center",
    color: COLOR.textSecond,
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

export const LevelPicker:FC<LevelPickerModel> = ({targetPassage, t, handleChange, handleOpen, state, activeTestObj, handleRestart}) => {
  const [levelPickerShown, setLevelPickerShown] = useState(false)
  const closeLevelPicker = () => {
    setLevelPickerShown(false)
  }
  const handleLabelPress = () => {
    setLevelPickerShown(true)
    handleOpen(targetPassage.id)
  }
  return <View style={{...levelPickerStyles.levelPickerView}}>
  <View style={{...levelPickerStyles.levelPickerWrapper}}>
    <Button title={ `${t("Level")} ${targetPassage.selectedLevel}`} icon={IconName.selectArrow} onPress={handleLabelPress}/>
    {targetPassage.isNewLevelAwalible && <NewLevelIndicator />}
  </View>
  <MiniModal shown={levelPickerShown} handleClose={() => setLevelPickerShown(false)}>
    <Text style={levelPickerStyles.headerText}>{t("LanguagePickerHeading")}</Text>
    <View style={levelPickerStyles.buttonsView}>
      {[
        PASSAGE_LEVEL.l1,PASSAGE_LEVEL.l2,PASSAGE_LEVEL.l3,PASSAGE_LEVEL.l4,PASSAGE_LEVEL.l5
      ].map(n => {
        const color = targetPassage.selectedLevel === n ? "green" : "gray"
        const disabled = n > targetPassage.maxLevel
        return <Button
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
    {state && activeTestObj && targetPassage.selectedLevel.toString() === activeTestObj.level.toString().slice(0,1) && targetPassage.selectedLevel === targetPassage.maxLevel
    && <Text style={levelPickerStyles.subText}>{t("LanguagePickerSubtext")}  ({getPerfectTestsNumber(state.testsHistory,targetPassage)}/{PERFECT_TESTS_TO_PRCEED})</Text>}
    {state && activeTestObj && targetPassage.selectedLevel.toString() !== activeTestObj.level.toString().slice(0,1) 
    && <Text style={levelPickerStyles.subText}>{t("LanguagePickerSubtextSecond")}</Text>}
    {activeTestObj && handleRestart && targetPassage.selectedLevel.toString() !== activeTestObj.level.toString().slice(0,1) 
    && <Button title={t("RestartTests")} onPress={() => {closeLevelPicker();handleRestart()}}/>}
    <Button color="green" type="outline" title={t("Close")} onPress={() => closeLevelPicker()}/>
  </MiniModal>
</View>
}

const NewLevelIndicator: FC<{}> = () => {
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
        colors={[COLOR.gradient1, COLOR.gradient2] }
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