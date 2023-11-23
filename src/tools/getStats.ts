import { getVersesNumber } from "../initials";
import { AddressType, AppStateModel, PassageModel, TestModel } from "../models";
import addZero from "./addZero";
import { DAY, PASSAGELEVEL, SETTINGS, STATSMETRICS } from "../constants";
import { addressDistance } from "./addressDistance";
import { testLevelToPassageLevel } from "./levelsConvertion";

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
  avgWeekDuration: number
  maxStroke: number
  avgDurationMS: number
  avgDurationByLevel: Record<PASSAGELEVEL, testInfoByLevelModel>
  avgSessionDurationMS: {
    sessionId: number, 
    duration: number,
    testsNumber: number,
    errorNumber: number
  }[]
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
  const allWeeksStats = []
  const allDaysStats = []
  state.testsHistory.forEach(th => {
      //TODO derive from th timestamp
      const weekNumber = 0;
      const dayNumber = 0;


      totalTestsNumber++
      const durationMS = th.td[0][1] - th.td[0][0]
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
  const absoluteScore = state.passages.reduce((ps, v) => ps + getPassageScore(v),0);
  const startOfThisMonth = new Date(`${now.getFullYear()}-${now.getMonth() + 1}-01`).getTime()
  const startOfPreviusMonth = startOfThisMonth - 1000 * DAY * 30;
  const relativeScore =  getTimeBoundStats(state, startOfThisMonth, now.getTime()).maxScore - getTimeBoundStats(state, startOfPreviusMonth, startOfThisMonth).maxScore
  return{
    absoluteScore,
    relativeScore,
    avgDayDuration: 0,
    avgWeekDuration: 0,
    maxStroke: 0,
    totalTimeSpentMS,
    totalTestsNumber,
    avgDurationMS,
    avgDurationByLevel,
    avgSessionDurationMS
  }
}

interface TimeRangeStats{
  maxScore: number
  // totalTime: number
  // totalTests: number
  // totalSessions: number
}
const getPassageScore: (passage: PassageModel, from?: number, to?: number) => number = (passage, from, to) => {
  if(!from || !to || from > to){
    return passage.versesNumber * (passage.maxLevel -1) * 2
  }else{
    const maxLevel = Object.values(PASSAGELEVEL)
      .filter(v => typeof v === "string")
      .map((v,p) => {
        const targetLevel = p
        const isCorrect = 
        passage.upgradeDates[targetLevel as PASSAGELEVEL] !== 0 
        && passage.upgradeDates[targetLevel as PASSAGELEVEL] > from 
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
const getTimeBoundStats: (state: AppStateModel, fromMS: number, toMS: number) => TimeRangeStats = (state, fromMS, toMS) => {
  if(fromMS >= toMS){
    console.warn("fromMS cant be more then or equal to toMS")
    return {
      maxScore: 0  
    }
  }
  const maxScore = state.passages.filter(p => p.dateCreated > fromMS).reduce((ps, v) => ps + getPassageScore(v,fromMS, toMS),0);
  return {
    maxScore,
    // totalTime: 0,//for later
    // totalTests: 0,//for later
    // totalSessions: 0,//for later
  }
}