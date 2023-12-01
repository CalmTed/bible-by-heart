import React, { FC, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable
} from "react-native";
import { navigateWithState } from "../screeenManagement";
import { PASSAGELEVEL, SCREEN } from "../constants";
import { Header } from "../components/Header";
import { Button, IconButton } from "../components/Button";
import { IconName } from "../components/Icon";
import { ScreenModel } from "./homeScreen";
import { useApp } from "../tools/useApp";
import { getAppStats } from "../tools/getStats";
import { MiniModal } from "../components/miniModal";
import { timeStringFromMS } from "../tools/formatDateTime";

export const StatsScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, setState, t, theme } = useApp({ route, navigation });
  const [ hintModalOpen, openHintModal ] = useState(false)

  const statsStyle = StyleSheet.create({
    listView: {
      width: "100%"
    },
    statsView:{
      width: "100%"
    },
    mainScoreView: {
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      marginTop: 50,
    },
    absoluteScoreTextView: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      width: "100%"
    },
    absoluteScoreTextNumber: {
      fontSize: 50,
      color: theme.colors.text,
      fontWeight: "900"
    },
    absoluteScoreTextSubtext: {
      fontSize: 20,
      color: theme.colors.textSecond,
    },
    relativeScoreTextView: {
      flexDirection: "row"
    },
    relativeScoreTextNumber: {
      fontSize: 20,
      color: theme.colors.text,
      fontWeight: "900",
      lineHeight: 43
    },
    relativeScoreTextSubtext: {
      fontSize: 20,
      color: theme.colors.textSecond,
    },
    absoluteScoreTextSubtextHint: {
      paddingHorizontal: 6,
      paddingVertical: 0,
      textAlign: "center",
      marginLeft: 5,
      borderColor: theme.colors.textSecond,
      borderWidth: 1,
      borderRadius: 5000,
      color: theme.colors.textSecond,
      fontSize: 15
    },
    masonaryListView: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      alignContent: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    masonaryItemView: {
      flexBasis: "50%",
      // borderColor: "#f00",
      // borderWidth: 2,
      // aspectRatio: 1,
      display: "flex",
      flexDirection: "column",
      height: 100,
      alignItems: "center",
      justifyContent: "center",
    },
    masonaryItemViewTitleSet: {
      flexDirection: "row"
    },
    masonaryItemTitle: {
      fontSize: 25,
      fontWeight: "bold",
      color: theme.colors.text
    },
    masonaryItemTitleSubtext: {
      fontSize: 15,
      marginTop: 10,
      marginLeft: 5,
      fontWeight: "bold",
      color: theme.colors.textSecond
    },
    masonaryItemSubtext: {
      fontSize: 15,
      color: theme.colors.textSecond
    },
    levelGroup: {
      marginTop: 20
    },
    levelHeader: {
      color: theme.colors.textSecond,
      textAlign: "center",
      fontWeight: "bold"
    }
  });
  const statsData = getAppStats(state)
  const relativeScoreColor = statsData.relativeScore === 0 
    ? theme.colors.textSecond
    : statsData.relativeScore > 0
    ? theme.colors.mainColor
    : theme.colors.textDanger
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      <Header
        theme={theme}
        navigation={navigation}
        showBackButton={false}
        alignChildren="flex-start"
        additionalChildren={[
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() =>
              navigateWithState({
                navigation,
                screen: SCREEN.home,
                state
              })
            }
          />,
          <Text style={theme.theme.headerText}>{t("statsScreenTitle")}</Text>
        ]}
      />
      <ScrollView style={statsStyle.listView}>
        <View style={statsStyle.mainScoreView}>
          <View style={statsStyle.absoluteScoreTextView}>
            <Text style={statsStyle.absoluteScoreTextNumber}>{statsData.absoluteScore}</Text>
            <Text style={{...statsStyle.relativeScoreTextNumber, color: relativeScoreColor}}>{statsData.relativeScore >= 0 ? "+" : ""}{statsData.relativeScore}</Text>
          </View>
          <View style={statsStyle.relativeScoreTextView}>
            <Text style={statsStyle.absoluteScoreTextSubtext}>{t("statsAbsoluteScoreSubtext")}</Text>
            <Pressable onPress={() => openHintModal(true)}>
              <Text style={statsStyle.absoluteScoreTextSubtextHint}>?</Text>
            </Pressable>
          </View>
        </View>
        <View style={statsStyle.masonaryListView}>
        <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{state.passages.length}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsPassagesNumber")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{state.passages.reduce((ps, v) => ps + v.versesNumber,0)}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsVersesNumber")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <View style={statsStyle.masonaryItemViewTitleSet}>
              <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(statsData.avgDayDuration)}</Text>
              <Text 
                style={{
                  ...statsStyle.masonaryItemTitleSubtext,
                  color: 
                    statsData?.avgDayDurationRelativePercent 
                      ? statsData?.avgDayDurationRelativePercent > 0 
                        ? theme.colors.mainColor  
                        : theme.colors.textDanger  
                      : theme.colors.textSecond
                }}>
              {statsData?.avgDayDurationRelativePercent 
                ? statsData.avgDayDurationRelativePercent > 0 
                  ? `+${statsData.avgDayDurationRelativePercent}` 
                  : `${statsData.avgDayDurationRelativePercent}`
                : 0}
              %</Text>
            </View>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsDailyTime")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <View style={statsStyle.masonaryItemViewTitleSet}>
              <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(statsData.avgWeekDuration)}</Text>
              <Text 
                style={{
                  ...statsStyle.masonaryItemTitleSubtext,
                  color: 
                    statsData?.avgWeekDurationRelativePercent 
                      ? statsData?.avgWeekDurationRelativePercent > 0 
                        ? theme.colors.mainColor  
                        : theme.colors.textDanger  
                      : theme.colors.textSecond
                }}>
              {statsData?.avgWeekDurationRelativePercent 
                ? statsData.avgWeekDurationRelativePercent > 0 
                  ? `+${statsData.avgWeekDurationRelativePercent / 1000}` 
                  : `${statsData.avgWeekDurationRelativePercent / 1000}`
                : 0}
              %</Text>
            </View>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsWeeklyTime")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(statsData.avgDurationMS)}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsAverageTestDuration")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(statsData.avgSessionDurationMS.reduce((ps, v) => ps + v.duration,0) / (statsData.avgSessionDurationMS.length || 1))}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsAverageSessionDuration")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(statsData.totalTimeSpentMS)}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsTimeSpent")}</Text>
          </View>
          <View style={statsStyle.masonaryItemView}>
            <Text style={statsStyle.masonaryItemTitle}>{statsData.avgSessionDurationMS.length}</Text>
            <Text style={statsStyle.masonaryItemSubtext}>{t("statsSessionNumber")}</Text>
          </View>
        </View>
        {Object.values(statsData.avgDurationByLevel).map((data,i) => {
          if(data.number <= 0){
            return <View key={`level-${i}`}></View>
          }
          return <View style={statsStyle.levelGroup} key={`level-${i}`}>
            <Text style={statsStyle.levelHeader}>{t("Level")} {i+1}</Text>
            <View style={statsStyle.masonaryListView}>
              <View style={statsStyle.masonaryItemView}>
                <Text style={statsStyle.masonaryItemTitle}>{state.passages.filter(p => p.selectedLevel === i+1).length}</Text>
                <Text style={statsStyle.masonaryItemSubtext}>{t("statsPassagesNumber")}</Text>
              </View>
              <View style={statsStyle.masonaryItemView}>
                <Text style={statsStyle.masonaryItemTitle}>{state.passages.filter(p => p.selectedLevel === i+1).reduce((ps, v) => ps + v.versesNumber,0)}</Text>
                <Text style={statsStyle.masonaryItemSubtext}>{t("statsVersesNumber")}</Text>
              </View>
              <View style={statsStyle.masonaryItemView}>
                <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(data.duration)}</Text>
                <Text style={statsStyle.masonaryItemSubtext}>{t("statsTimeSpent")}</Text>
              </View>
              <View style={statsStyle.masonaryItemView}>
                <Text style={statsStyle.masonaryItemTitle}>{timeStringFromMS(data.duration / data.number)}</Text>
                <Text style={statsStyle.masonaryItemSubtext}>{t("statsAverageDuration")}</Text>
              </View>
            </View>
          </View>
        })}
        </ScrollView>
        <MiniModal shown={hintModalOpen} handleClose={() => openHintModal(false)} theme={theme} >
          <Text style={{...theme.theme.text, fontSize: 17}}>{t("statsScoreCalculatingHintText")}</Text>
          <Button theme={theme} onPress={() => openHintModal(false)} title={t("Close")}/>
        </MiniModal>
    </View>
  );
};