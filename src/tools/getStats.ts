import { getVersesNumber } from "../initials";
import { AddressType, AppStateModel, PassageModel, TestModel } from "../models";
import addZero from "./addZero";
import { DAY, PASSAGELEVEL, SETTINGS, STATSMETRICS } from "../constants";
import { addressDistance } from "./addressDistance";
import { testLevelToPassageLevel } from "./levelsConvertion";
import { dateToString, timeStringFromMS, timeToString } from "./formatDateTime";

const dayInMs = DAY * 1000;

export const getStroke = (testHistory: TestModel[]) => {
  const nowD = new Date().getTime();
  const allDays = testHistory
    .sort(
      (a, b) =>
        Math.max(...b.td.flat()) -
        Math.max(...a.td.flat())
    )
    .map((t) => {
      const d = new Date(t.td[t.td.length - 1][1] || 0);
      return `${addZero(d.getFullYear(), 4)}-${addZero(
        d.getMonth() + 1
      )}-${addZero(d.getDate())}`;
    });
  // GET UNIQUE
  const uniqueDays = allDays.filter(
    (v, i, arr) => !arr.slice(0, i).includes(v)
  ); //unique
  const isToday = nowD - new Date(uniqueDays[0]).getTime() < dayInMs;
  const isYesterday =
    !isToday && nowD - new Date(uniqueDays[0]).getTime() < dayInMs * 2;
  const unbrokenSeries = uniqueDays
    .map((v, i, arr) => {
      const d2 = new Date(v).getTime();
      if (!i) {
        //last test was finished less then 24h before
        return isToday || isYesterday;
      } else {
        //if there are no false - then there is an unbroken series
        const prvD = new Date(arr[i - 1]).getTime();
        return prvD - d2 <= dayInMs;
      }
    })
    .filter((v, i, arr) => {
      return !arr.slice(0, i + 1).includes(false);
    });
  return {
    length: unbrokenSeries.length,
    today: isToday
  };
};

interface DayStatsModel {
  label: string;
  number: number;
  errors: number;
}

type WeeklyStatsModel = DayStatsModel[];

const daysLabels = [
  "dayMO",
  "dayTU",
  "dayWE",
  "dayTH",
  "dayFR",
  "daySA",
  "daySU"
];

export const getWeeklyStats: (state: AppStateModel) => WeeklyStatsModel = (
  state
) => {
  const d3 = new Date();
  const timezoneoffset = d3.getTimezoneOffset() * 60 * 1000//in MS
  const day = new Date().getDay();
  const todayWeekDay = day ? day - 1 : 6; //[0-6], 6 is sunday
  const passages = state.passages;
  const testHistory = state.testsHistory;
  const weekStats = new Array(7).fill(0).map((v, i) => {
    const selectedDay = new Date(d3.getTime() - dayInMs * (todayWeekDay - i));
    const selectedOnlyDate = new Date(
      `${selectedDay.getFullYear()}-${
        selectedDay.getMonth() + 1
      }-${selectedDay.getDate()}`
    ).getTime();
    const selectedDayActivity = testHistory.filter((t) => {
      const tryEndTime = t.td[t.td.length - 1][1] - timezoneoffset;
      return (
        tryEndTime > selectedOnlyDate &&
        tryEndTime < selectedOnlyDate + dayInMs
      );
    });
    const versesPassageIds = selectedDayActivity.map((t) => t.pi);
    const versesNumber = versesPassageIds.reduce((partialSum, t) => {
      const passage = passages.find((p) => p.id === t);
      if (!passage) {
        return partialSum;
      }
      return (
        partialSum + (passage.versesNumber || getVersesNumber(passage.address))
      );
    }, 0);
    const minutesNumber = Math.ceil(
      selectedDayActivity.reduce((partialSum, t) => {
        const testNumTime = t.td
          .map((td) => td[1] - td[0])
          .reduce((ps, deltaDt) => ps + deltaDt, 0);
        return partialSum + testNumTime;
      }, 0) /
        1000 /
        60
    ); //ronunding after summing to minutes
    const sessionNumber = selectedDayActivity
      .map((t) => t.si)
      .filter(
        (value, index, arr) => !arr.slice(0, index).includes(value)
      ).length;
    const metrics =
      state.settings[SETTINGS.homeScreenWeeklyMetric] === STATSMETRICS.verses
        ? versesNumber
        : state.settings[SETTINGS.homeScreenWeeklyMetric] ===
          STATSMETRICS.minutes
        ? minutesNumber
        : sessionNumber;
    const errorNumber = selectedDayActivity
      .map((t) => t.en || 0)
      .reduce((ps, s) => {
        return ps + s;
      }, 0);
    return {
      label: daysLabels[i],
      number: metrics,
      errors: errorNumber
    };
  });
  return weekStats;
};

interface testInfoByLevelModel{
  duration: number
  number: number
  errorRate: number
}

interface PassageStatsModel{
  totalTimeSpentMS: number
  totalTestsNumber: number
  avgDurationMS: number
  avgDurationByLevel: Record<PASSAGELEVEL, testInfoByLevelModel>
  wordErrorsHeatMap: number[]//i:word index,n:error number
  mostOftenAdressErrors: {
    address: AddressType,
    errorNumber: number
  }[]//TODO limit to top ~10
}
export const getPasageStats: (state: AppStateModel, passage: PassageModel) => PassageStatsModel = (state, passage) => {
  let totalTestsNumber = 0;
  const initialDataValue:testInfoByLevelModel = {
    duration: 0,
    number: 0,
    errorRate: 0,
  };//duration, level, errorRate
  let avgDurationByLevel = {
    [PASSAGELEVEL.l1]:initialDataValue,
    [PASSAGELEVEL.l2]:initialDataValue,
    [PASSAGELEVEL.l3]:initialDataValue,
    [PASSAGELEVEL.l4]:initialDataValue,
    [PASSAGELEVEL.l5]:initialDataValue,
    
  }
  const wordErrorsHeatMap:number[] = Array(passage.verseText.split(" ").filter(w => w.length).length).fill(0)
  const mostOftenAdressErrors:{
    address: AddressType,
    errorNumber: number
  }[] = []
  state.testsHistory.forEach(th => {
    if(th.pi === passage.id){
      totalTestsNumber++
      const durationMS = th.td[0][1] - th.td[0][0]
      //duration by level
      // console.log(avgDurationByLevel)
      const passageLevel = testLevelToPassageLevel(th.l);
      avgDurationByLevel = {
        ...avgDurationByLevel,
        [passageLevel]: {
          duration: avgDurationByLevel[passageLevel].duration + durationMS,
          number: avgDurationByLevel[passageLevel].number + 1,
          errorRate: avgDurationByLevel[passageLevel].errorRate + (th.en || 0)
        }
      }
      if(th.ww.length){
        th.ww.forEach(([i]) => {
          wordErrorsHeatMap[i] += 1
        })
      }
      if(th.wa.length){
        th.wa.forEach((a) => {
          const match = mostOftenAdressErrors.find(({address}) => addressDistance(a,address) === 0)
          if(match){
            const indexMatch = mostOftenAdressErrors.indexOf(match);
            mostOftenAdressErrors[indexMatch].errorNumber += 1
          }else{
            mostOftenAdressErrors.push({
              address: a,
              errorNumber: 1
            })
          }
        })
      }
      if(th.wp.length){
        th.wp.forEach((p) => {
          const a = state.passages.find(passage => passage.id === p)?.address
          const match = a ? mostOftenAdressErrors.find(({address}) => addressDistance(a,address) === 0) : false
          if(match){
            const indexMatch = mostOftenAdressErrors.indexOf(match);
            mostOftenAdressErrors[indexMatch].errorNumber += 1
          }else if(a){
            mostOftenAdressErrors.push({
              address: a,
              errorNumber: 1
            })
          }
        })
      }
    }
  })//foreach loop ends here
  const totalTimeSpentMS = Object.values(avgDurationByLevel).map(i => i.duration).reduce((ps,v) => ps += v, 0);
  const avgDurationMS = totalTimeSpentMS / totalTestsNumber
  return{
    totalTimeSpentMS,
    totalTestsNumber,
    avgDurationMS,
    avgDurationByLevel,
    wordErrorsHeatMap,
    mostOftenAdressErrors: mostOftenAdressErrors.sort((a,b) => b.errorNumber - a.errorNumber)
  }
}

interface AppStatsModel{
  absoluteScore: number
  relativeScore: number
  totalTimeSpentMS: number
  totalTestsNumber: number
  avgDayDuration: number
  avgDayDurationRelativePercent: number
  avgWeekDuration: number
  avgWeekDurationRelativePercent: number
  maxStroke: number
  avgDurationMS: number
  avgDurationByLevel: Record<PASSAGELEVEL, testInfoByLevelModel>
  avgSessionDurationMS: {
    sessionId: number, 
    duration: number,
    testsNumber: number,
    errorNumber: number
  }[],
  allDaysStats: number[]
}


export const getAppStats: (state: AppStateModel) => AppStatsModel = (state) => {
  let totalTestsNumber = 0;
  const initialDataValue:testInfoByLevelModel = {
    duration: 0,
    number: 0,
    errorRate: 0,
  };//duration, level, errorRate
  let avgDurationByLevel = {
    [PASSAGELEVEL.l1]:initialDataValue,
    [PASSAGELEVEL.l2]:initialDataValue,
    [PASSAGELEVEL.l3]:initialDataValue,
    [PASSAGELEVEL.l4]:initialDataValue,
    [PASSAGELEVEL.l5]:initialDataValue,
  }
  let avgSessionDurationMS: {
    sessionId: number, 
    duration: number,
    testsNumber: number,
    errorNumber: number
  }[] = []
  // TODO get duration get number > calculate average  ???including missing days or not???
  const allWeeksStats:number[] = []
  const allDaysStats:number[] = []
  state.testsHistory.forEach(th => {
    
    totalTestsNumber++
    const durationMS = th.td[0][1] - th.td[0][0];
    
    const weekNumber = Math.floor(th.td[0][1] / 1000 / DAY / 7);
    const dayNumber = Math.floor(th.td[0][1] / 1000 / DAY);
    if(!allDaysStats?.[dayNumber]){
      allDaysStats[dayNumber] = durationMS
    }else{
      allDaysStats[dayNumber] += durationMS
    }
    if(!allWeeksStats?.[weekNumber]){
      allWeeksStats[weekNumber] = durationMS
    }else{
      allWeeksStats[weekNumber] += durationMS
    }
      //duration by level
      const passageLevel = testLevelToPassageLevel(th.l);
      avgDurationByLevel = {
        ...avgDurationByLevel,
        [passageLevel]: {
          duration: avgDurationByLevel[passageLevel].duration + durationMS,
          number: avgDurationByLevel[passageLevel].number + 1,
          errorRate: avgDurationByLevel[passageLevel].errorRate + (th.en || 0)
        }
      }
      const targetSession = avgSessionDurationMS.find(s => s.sessionId === th.si)
      if(targetSession){
        avgSessionDurationMS[avgSessionDurationMS.indexOf(targetSession)] = {
          ...targetSession,
          duration: targetSession.duration + durationMS,
          testsNumber: targetSession.testsNumber + 1,
          errorNumber: targetSession.errorNumber + (th.en || 0)
        }
      }else{
        avgSessionDurationMS.push({
          sessionId: th.si,
          duration: durationMS,
          testsNumber: 1,
          errorNumber: (th.en || 0)
        });
      }
  })//foreach loop ends here
  const totalTimeSpentMS = Object.values(avgDurationByLevel).map(i => i.duration).reduce((ps,v) => ps += v, 0);
  const avgDurationMS = totalTimeSpentMS / (totalTestsNumber || 1);
  const now = new Date()
  //calculation strategy as for 2023-12-01
  //get time from start of the month (12-01 0000 - 12-05 1220)
  //get time from the same period from previus month (11-01 0000 - 11-05 1220)
    //-month + same time range
  //calculate maxScore for both ranges
  const startOfThisMonth =  new Date(`${now.getFullYear()}-${now.getMonth() + 1}-01`).getTime() // state.statsDateRange.to ||
  const timeFromTheMonthStart = now.getTime() - startOfThisMonth/// 1000 * DAY * 18;
  const startOfPreviusMonth = startOfThisMonth - 1000 * DAY * 30;//state.statsDateRange.from ||
  const currentScore = getTimeBoundStats(state, startOfThisMonth, startOfThisMonth + timeFromTheMonthStart);
  // console.log(timeToString(startOfPreviusMonth), timeToString(startOfPreviusMonth + timeFromTheMonthStart))
  const previusEpisodeScore = getTimeBoundStats(state, startOfPreviusMonth, startOfPreviusMonth + timeFromTheMonthStart);
  
  //by day & by week 
  const allDefinedDaysDuration = allDaysStats.filter(d => d)
  const allDefinedWeeksDuration = allWeeksStats.filter(w => w)
  const thisMonthStartDay = Math.floor(startOfThisMonth / 1000 / DAY)
  const previusEpisodeDays = allDaysStats.filter((d,i) => {
    return d && i < thisMonthStartDay;
  })
  const thisMonthStartWeek = Math.floor(startOfThisMonth / 1000 / DAY / 7)
  const previusEpisodeWeeks = allWeeksStats.filter((d,i) => {
    return d && i < thisMonthStartWeek;
  })
  const getAverage: (sum: number, len: number) => number = (sum, len) => {
    return sum / (len || 1);
  }
  const allDataAverageDayDuration = getAverage(allDefinedDaysDuration.reduce((ps,v) => ps+v,0), allDefinedDaysDuration.length)
  const previusMonthAverageDayDuration = getAverage(previusEpisodeDays.reduce((ps,v) => ps+v,0), previusEpisodeDays.length)

  const allDataAverageWeekDuration = getAverage(allDefinedWeeksDuration.reduce((ps,v) => ps+v,0), allDefinedWeeksDuration.length)
  const previusMonthAverageWeekDuration = getAverage(previusEpisodeWeeks.reduce((ps,v) => ps+v,0), previusEpisodeWeeks.length)
  // console.log(timeStringFromMS(allDataAverageDayDuration), timeStringFromMS(previusMonthAverageDayDuration))
  const avgDayDurationRelativePercent = 100 - Math.round(100 / allDataAverageDayDuration * previusMonthAverageDayDuration); 
  const avgWeekDurationRelativePercent = 100 - Math.round(100 / allDataAverageWeekDuration * previusMonthAverageWeekDuration); 
  // console.log(currentScore.maxScore, previusEpisodeScore.maxScore)
  return{
    absoluteScore: currentScore.maxScore,
    relativeScore: currentScore.maxScore - previusEpisodeScore.maxScore,
    avgDayDuration: getAverage(allDefinedDaysDuration.reduce((ps,v) => ps+v,0), allDefinedDaysDuration.length),
    avgDayDurationRelativePercent,
    avgWeekDuration: getAverage(allDefinedWeeksDuration.reduce((ps,v) => ps+v,0), allDefinedWeeksDuration.length),
    avgWeekDurationRelativePercent,
    maxStroke: 0,//TODO
    totalTimeSpentMS,
    totalTestsNumber,
    avgDurationMS,
    avgDurationByLevel,
    avgSessionDurationMS,
    allDaysStats
  }
}

interface TimeRangeStats{
  maxScore: number
  totalTime: number
  totalTests: number
  totalSessions: number
}
const getPassageScore: (passage: PassageModel, from?: number, to?: number) => number = (passage, from, to) => {
  if(!from || !to || from > to){
    if(from && to && from > to){
      console.log("getPassageScore: from cant be langer then to")
    }
    return passage.versesNumber * (passage.maxLevel -1) * 2
  }else{
    const maxLevel = Object.values(PASSAGELEVEL)
      .filter(v => typeof v === "string")
      .map((v,p) => {
        const targetLevel = p;
        const isCorrect = 
        passage.upgradeDates[targetLevel as PASSAGELEVEL] !== 0 
        && passage.upgradeDates[targetLevel as PASSAGELEVEL] < to;
        return {
          p: targetLevel,
          isCorrect
        }}
      )
      .filter(l => l.isCorrect)
      .sort((a,b) => b.p - a.p)
    return passage.versesNumber * ((maxLevel?.[0]?.p || 1) -1) * 2
  }
}

//for last and this month
export const getTimeBoundStats: (state: AppStateModel, fromMS: number, toMS: number) => TimeRangeStats = (state, fromMS, toMS) => {
  if(fromMS >= toMS){
    console.warn("getTimeBoundStats: fromMS cant be more then or equal to toMS")
    return {
      maxScore: 0,
      totalTime: 0,
      totalSessions: 0,
      totalTests: 0
    }
  }
  //filtering passages that wasn't created at that time
  const passagesCreatedBeforeToDate = state.passages.filter( p => {
    return p.dateCreated < toMS
  })
  const maxScore = passagesCreatedBeforeToDate.reduce((ps, v) => ps + getPassageScore(v,fromMS, toMS), 0);
  const filteredTests = state.testsHistory
  .filter(h => h.td[0][0] > fromMS && h.td[0][1] < toMS);
  const totalTime = 
    filteredTests
      .map(h => h.td[0][1] - h.td[0][0])
      .reduce((ps,v) => ps + v,0);
  const totalTests = 
    filteredTests.length;
  const totalSessions = 
    filteredTests
      .map(t => t.si)
      .filter((v,i,arr) => {
        return !arr.slice(0,i).includes(v)
      }).length;
  return {
    maxScore,
    totalTime,
    totalTests,
    totalSessions
  }
}

