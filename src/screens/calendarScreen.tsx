import React, { FC, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  NativeModules,
  LayoutAnimation
} from "react-native";
import { navigateWithState } from "../screeenManagement";
import { DAY, MINUTE, PASSAGELEVEL, SCREEN, THEMETYPE } from "../constants";
import { Header } from "../components/Header";
import { IconButton } from "../components/Button";
import { IconName } from "../components/Icon";
import { ScreenModel } from "./homeScreen";
import { useApp } from "../tools/useApp";
import { getAppStats, getTimeBoundStats } from "../tools/getStats";
import { dateToString, timeStringFromMS } from "../tools/formatDateTime";
import { WORD, createT } from "../l10n";
import addressToString from "../tools/addressToString";
import { testLevelToPassageLevel } from "../tools/levelsConvertion";
import { LinearGradient } from "expo-linear-gradient";
import { PanGestureHandler } from "react-native-gesture-handler";


const {UIManager} = NativeModules;

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

export const CalendarScreen: FC<ScreenModel> = ({ route, navigation }) => {
  const { state, setState, t, theme } = useApp({ route, navigation });
  const currentMonthStart = new Date(`${new Date().getFullYear()}-${new Date().getMonth() +1  }-01`).getTime();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStart);
  const [selectedDay, setSelectedDay] = useState(null as null | number);
  
  const calendarStyle = StyleSheet.create({
    listView: {
      width: "100%",
      height: "100%",
    },
    buttons: {
        flexDirection: "row",
        height: 60,
        width: "100%",
        textAlign: "center",
        justifyContent: "center"
    },
    buttonsTitle:{
        color: theme.colors.text,
        fontSize: 20,
        display: "flex",
        flexDirection: "row",
        lineHeight: 55,
    },
    daysList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 5,
      marginHorizontal: 10,
    },
    daysItem: {
      width: "13%",
      borderRadius: 50,
      backgroundColor: theme.colors.bgSecond,
      alignItems: "center",
      justifyContent: "center"
    },
    placeHolderTextView: {
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      height: 100
    },
    placeHolderText: {
      color: theme.colors.text,
      fontSize: 20
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
    testsList: {
      paddingHorizontal: 20,
      flexWrap: "wrap",
      flexDirection: "row",
      width: "100%",
      marginBottom: 100
    },
    testsListItemWrapperFullWidth:{
      width: "100%",
    },
    testsListItemWrapper: {      
      width: "50%",
    },
    testsListItemContent: {
      flexDirection: "row",
      flexWrap: "wrap",
      padding: 10,
      backgroundColor: theme.colors.bgSecond,
      margin: 5,
      borderRadius: 10
    },
    testsListItemContentTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      width: "100%"
    },
    testsListItemContentSubtext: {
      fontSize: 14,
      color: theme.colors.textSecond,
    },
    testsListItemContentErrorView: {
      width: "100%"
    }
  });
  const daysStats = getAppStats(state).allDaysStats;
  const monthDaysArr = new Array(new Date(new Date(selectedMonth).getFullYear(), new Date(selectedMonth).getMonth() + 1,0).getDate()).fill(0).map((m,i) => i + 1);
  const previusMonthLastDayNumber = Math.floor((selectedMonth - 1000) / DAY / 1000);
  const nextMonthFirstDayNumber = Math.floor((selectedMonth + monthDaysArr.length * DAY * 1000) / DAY / 1000);
  const selectedDayNumber = !selectedDay ? null : Math.floor(selectedDay / 1000 / DAY)
  const dayDuration = !selectedDayNumber ? null : daysStats?.[selectedDayNumber];
  const dayDetailedStats = !selectedDay ? null : getTimeBoundStats(state, selectedDay, selectedDay + DAY * 1000 - 1000)
  const selectedDayTests = !selectedDay ? null : state.testsHistory
    .filter(h => h.td[0][0] > selectedDay && h.td[0][1] < selectedDay + DAY * 1000 - 1000);
  const handleSetPreviusMonth = () => {
    const closetDayBefore = daysStats.map((d,i) => i).filter(i => i < previusMonthLastDayNumber).sort().reverse()?.[0] || null;
    if(!closetDayBefore){
      return;
    }
    const closestDayBeforeDate = new Date(closetDayBefore * DAY * 1000);
    const monthOfTheClosestDay = new Date(`${closestDayBeforeDate.getFullYear()}-${closestDayBeforeDate.getMonth() + 1}-01`);
    setSelectedMonth(monthOfTheClosestDay.getTime());
  }
  const handleSetNextMonth = () => {
    const closetDayAfter = daysStats.map((d,i) => i).filter(i => i >= nextMonthFirstDayNumber).sort()?.[0] || null;
    if(!closetDayAfter){
      return;
    }
    const closestDayAfterDate = new Date(closetDayAfter * DAY * 1000);
    const monthOfTheClosestDay = new Date(`${closestDayAfterDate.getFullYear()}-${closestDayAfterDate.getMonth() + 1}-01`);
    setSelectedMonth(monthOfTheClosestDay.getTime());
  }
  const handleSetPreviusDay = () => {
    if(!selectedDayNumber){
      return;
    }
    const closetDayBefore = daysStats.map((d,i) => i).filter(i => i < selectedDayNumber).sort().reverse()?.[0] || null;
    if(!closetDayBefore){
      return;
    }
    const closestDayBeforeDate = new Date(closetDayBefore * DAY * 1000);
    setSelectedDay(closestDayBeforeDate.getTime());
    if(
      new Date(selectedMonth).getMonth() !== closestDayBeforeDate.getMonth()
      || new Date(selectedMonth).getFullYear() !== closestDayBeforeDate.getFullYear()
    ){
      const monthOfTheClosestDay = new Date(`${closestDayBeforeDate.getFullYear()}-${closestDayBeforeDate.getMonth() + 1}-01`);
      setSelectedMonth(monthOfTheClosestDay.getTime());
    }
  }
  const handleSetNextDay = () => {
    if(!selectedDayNumber){
      return;
    }
    const closetDayBefore = daysStats.map((d,i) => i).filter(i => i > selectedDayNumber).sort()?.[0] || null;
    if(!closetDayBefore){
      return;
    }
    const closestDayBeforeDate = new Date(closetDayBefore * DAY * 1000);
    setSelectedDay(closestDayBeforeDate.getTime());
    if(
      new Date(selectedMonth).getMonth() !== closestDayBeforeDate.getMonth()
      || new Date(selectedMonth).getFullYear() !== closestDayBeforeDate.getFullYear()
    ){
      const monthOfTheClosestDay = new Date(`${closestDayBeforeDate.getFullYear()}-${closestDayBeforeDate.getMonth() + 1}-01`);
      setSelectedMonth(monthOfTheClosestDay.getTime());
    }
  }
  const handleCalendarSwipe = (evt: any) => {
    const { nativeEvent } = evt;
    // LayoutAnimation.easeInEaseOut()
    if (nativeEvent.velocityX > 0) {
      handleSetPreviusMonth()
    } else {
      handleSetNextMonth()
    }
  };
  const handleDaySwipe = (evt: any) => {
    const { nativeEvent } = evt;
    LayoutAnimation.easeInEaseOut()
    if (nativeEvent.velocityX > 0) {
      handleSetPreviusDay()
    } else {
      handleSetNextDay()
    }
  };
  
  const previusMonthAvalible = (() => {
    return daysStats.filter((d,i) =>  i <= previusMonthLastDayNumber).filter(d => d).length > 0;
  })();

  const nextMonthAvalible = (() => {
    return daysStats.filter((d,i) =>  i >= nextMonthFirstDayNumber).filter(d => d).length > 0;
  })();
  const previusDayAvalible = (() => {
    if(!selectedDayNumber){
      return false;
    }
    return daysStats.filter((d,i) => i < selectedDayNumber).filter(d => d).length > 0;
  })()
  const nextDayAvalible = (() => {
    if(!selectedDayNumber){
      return false;
    }
    return daysStats.filter((d,i) => i > selectedDayNumber).filter(d => d).length > 0;
  })()
  
  const monthName = t(`Month_${new Date(selectedMonth).getMonth() + 1}` as WORD)
  return (
    <View style={{ ...theme.theme.screen, ...theme.theme.view }}>
      { !selectedDay && <Header
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
                screen: SCREEN.stats,
                state
              })
            }
          />,
          <Text style={theme.theme.headerText}>{t("calendarScreenTitle")}</Text>
        ]}
      />}
      { selectedDay && <Header
        theme={theme}
        navigation={navigation}
        showBackButton={false}
        alignChildren="flex-start"
        additionalChildren={[
          <IconButton
            theme={theme}
            icon={IconName.back}
            onPress={() =>
              setSelectedDay(null)
            }
          />,
          <Text style={theme.theme.headerText}>{t("dayStatsTitle")}</Text>
        ]}
      />}

        {
        !selectedDay && 
        <View style={calendarStyle.listView}>
            <View style={calendarStyle.buttons}>
                <IconButton 
                    theme={theme}
                    icon={IconName.back}
                    disabled={!previusMonthAvalible}
                    onPress={() =>
                        handleSetPreviusMonth()
                    }
                />
                <Text style={calendarStyle.buttonsTitle}>{monthName} {new Date().getFullYear()}</Text>
                <IconButton 
                    theme={theme}
                    icon={IconName.forward}
                    disabled={!nextMonthAvalible}
                    onPress={() =>
                        handleSetNextMonth()
                    }
                />
            </View>
            <PanGestureHandler onEnded={handleCalendarSwipe}>
            <Animated.View style={calendarStyle.daysList}>
              {monthDaysArr.map(day => {
                const dayTimestamp = selectedMonth + ((day - 1) * DAY * 1000);
                const dayNumber = Math.floor(dayTimestamp / 1000 / DAY);
                const dayStats = daysStats?.[dayNumber];
                const dayRatio =  0.95 / (Math.max(...daysStats.filter(d => d)) || 1) * (dayStats || 0) + 0.05;
                const weekday = new Date(selectedMonth).getDay()
                const marginLeft = (weekday ? weekday - 1 : 6);
                const gradientColors = state.settings.theme === THEMETYPE.light 
                  ? [`rgba(127,222,52,${dayRatio})`,`rgba(231,223,11,${dayRatio})`] 
                  : [`rgba(63,111,26,${dayRatio})`,`rgba(26,134,158,${dayRatio})`]
                return <LinearGradient
                  key={day}
                  colors={!!dayStats ? gradientColors : [theme.colors.bg, theme.colors.bg]}
                  start={{ x: 0.0, y: 0 }}
                  end={{ x: 0.0, y: 1.0 }}
                  locations={[0, 1]}
                  style={{
                    ...calendarStyle.daysItem,
                    ...{backgroundColor: !!dayStats ? `rgba(63,111,26,${dayRatio})` : theme.colors.bg},
                    ...(day === 1 ? {
                        marginLeft: `${marginLeft * 13}%`,
                        marginRight: marginLeft * 5,
                        transform: `translate(${marginLeft * 5}pt)`
                      }: {})
                  }}
                >
                <Pressable 
                    onPress={() => dayStats ? setSelectedDay(selectedMonth + (day - 1) * DAY * 1000): null}
                    style={{width: "100%", height: 50, alignItems: "center", justifyContent: "center"}}
                >
                    <View>
                      <Text
                        style={{
                          ...theme.theme.text,
                          ...{color: !!dayStats ? theme.colors.text : theme.colors.textSecond}
                        }}>{day}</Text>
                    </View>
                  </Pressable>
                </LinearGradient>
              })}
            </Animated.View>
            </PanGestureHandler>
        </View>
        }

        {selectedDay && 
        <View style={calendarStyle.listView}>
            <View style={calendarStyle.buttons}>
                <IconButton 
                    theme={theme}
                    icon={IconName.back}
                    disabled={!previusDayAvalible}
                    onPress={() =>
                        handleSetPreviusDay()
                    }
                />
                <Text style={calendarStyle.buttonsTitle}>{dateToString(selectedDay)}</Text>
                <IconButton 
                    theme={theme}
                    icon={IconName.forward}
                    disabled={!nextDayAvalible}
                    onPress={() =>
                        handleSetNextDay()
                    }
                />
            </View>
            {!dayDuration && 
              <View style={calendarStyle.placeHolderTextView}>
                <Text style={calendarStyle.placeHolderText}>{t("NoDataForThisDay")}</Text>
              </View>
            }
            {dayDetailedStats && dayDuration &&
            <PanGestureHandler onEnded={handleDaySwipe}>
            
            <View style={calendarStyle.masonaryListView}>
              <View style={calendarStyle.masonaryItemView}>
                <Text style={calendarStyle.masonaryItemTitle}>{dayDetailedStats.maxScore}</Text>
                <Text style={calendarStyle.masonaryItemSubtext}>{t("statsAbsoluteScoreSubtext")}</Text>
              </View>
              <View style={calendarStyle.masonaryItemView}>
                <Text style={calendarStyle.masonaryItemTitle}>{timeStringFromMS(dayDetailedStats.totalTime)}</Text>
                <Text style={calendarStyle.masonaryItemSubtext}>{t("statsTimeSpent")}</Text>
              </View>
              <View style={calendarStyle.masonaryItemView}>
                <Text style={calendarStyle.masonaryItemTitle}>{dayDetailedStats.totalSessions}</Text>
                <Text style={calendarStyle.masonaryItemSubtext}>{t("statsSessionNumber")}</Text>
              </View>
              <View style={calendarStyle.masonaryItemView}>
                <Text style={calendarStyle.masonaryItemTitle}>{dayDetailedStats.totalPassages}</Text>
                <Text style={calendarStyle.masonaryItemSubtext}>{t("statsVersesNumber")}</Text>
              </View>
            </View>
            </PanGestureHandler>
            }
            {dayDuration && selectedDayTests && <ScrollView>
              <View style={calendarStyle.testsList}>
              {
                selectedDayTests.sort((a,b) => a.td[0][0] - b.td[0][0]).map((test,i,arr) => {
                  const ifFirstOfSession = !arr.slice(0,i).map(arrT => arrT.si).includes(test.si);
                  const sessionFinishTime = Math.max(...arr.filter(t => t.si === test.si).map(t => t.td[0][1]))
                  const nextSessionStartTime = arr
                  .filter(t => t.td[0][0] > sessionFinishTime && t.si !== test.si)
                  .map(t => t.td[0][1])
                  //in this case we want to have undefined (not an empty array) so we could use default value
                  //we set default value to sessionFinishTime, so it whould self destruct when substracting later
                  .slice(0,1)?.[0] || sessionFinishTime
                  const targetPassage = state.passages.filter(p => p.id === test.pi)[0];
                  const tagetTranslation = state.settings.translations.filter(translation => translation.id === targetPassage.verseTranslation)[0]
                  const tempT = createT(tagetTranslation.addressLanguage);
                  const promotionTime = targetPassage.upgradeDates?.[testLevelToPassageLevel(test.l) + 1 as PASSAGELEVEL] || 0
                  //we need to get not just the same day of promotion but the same session 
                  //b.c. user can repeat the same passage several times
                  //so we find the maximum time: eather 5 MINS or untill the next session
                  const wasPromoted = Math.abs(promotionTime - sessionFinishTime) < Math.max(MINUTE * 1000 * 5, nextSessionStartTime - sessionFinishTime);
                  const words = targetPassage.verseText.trim().split(" ").filter(w => w.length)
                  const timeZoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
                  return <View
                    key={test.i}
                    style={{...( ifFirstOfSession ? calendarStyle.testsListItemWrapperFullWidth : calendarStyle.testsListItemWrapper)}}
                  >
                    { ifFirstOfSession && <Text style={theme.theme.subText}>{timeStringFromMS(test.td[0][0] - selectedDay - timeZoneOffset)} - {timeStringFromMS(sessionFinishTime - selectedDay - timeZoneOffset)}</Text>}
                    <View style={{
                      ...calendarStyle.testsListItemContent,
                      ...(wasPromoted ? {borderWidth: 3, borderColor: theme.colors.mainColor} : {}),
                      ...(!!test?.en ? {borderWidth: 3, borderColor: theme.colors.textDanger} : {})
                      }}>
                      <Text style={calendarStyle.testsListItemContentTitle}>
                        {addressToString(targetPassage.address, tempT)}
                      </Text>
                      <Text style={{
                        ...calendarStyle.testsListItemContentSubtext,
                        }}>
                        {t("Level")} {testLevelToPassageLevel(test.l)}{" "} 
                      </Text>
                      {wasPromoted && <Text style={calendarStyle.testsListItemContentSubtext}>{">"} {testLevelToPassageLevel(test.l) + 1 as PASSAGELEVEL} </Text>}
                      {!!test?.en && <View style={calendarStyle.testsListItemContentErrorView}>
                        <Text style={{...calendarStyle.testsListItemContentSubtext, color: theme.colors.textDanger}}>
                          {t("ErrorsMade")} {test.en}
                        </Text>
                        {(!!test.wa.length || !!test.wp.length) && 
                          <Text style={{...calendarStyle.testsListItemContentSubtext, color: theme.colors.textDanger}}>
                            {test.wa.map(wa => addressToString(wa, tempT)).join(", ")}
                            {test.wp.map(wp => addressToString(state.passages.filter(p => p.id === wp)[0].address, tempT)).join(", ")}
                          </Text>
                        }
                        {(!!test.ww.length) && 
                          <Text style={{...calendarStyle.testsListItemContentSubtext, color: theme.colors.textDanger}}>
                            {test.ww.map(ww => `"${words[ww[0]]}"/"${ww[1]}"`).join(", ")}
                          </Text>
                        }
                      </View>}
                      
                    </View>
                </View>
                })
              }
            </View></ScrollView>}
        </View>
        }
    </View>
  );
};