import { getVersesNumber } from "../initials"
import { AppStateModel, TestModel } from "../models"
import addZero from "./addZero"
import { SETTINGS, STATS_METRICS } from "../constants"

const dayInMs = 24*60*60*1000

export const getStroke = (testHistory: TestModel[]) => {
  const nowD = new Date().getTime()
  const allDays = testHistory.sort((a,b) =>
    Math.max(...b.triesDuration.flat()) - Math.max(...a.triesDuration.flat())
  ).map((t) => {
    const d = new Date(t.triesDuration[t.triesDuration.length - 1][1] || 0)
    return `${addZero(d.getFullYear(), 4)}-${addZero(d.getMonth() + 1 )}-${addZero(d.getDate())}`
  })
  // GET UNIQUE
  const uniqueDays = allDays.filter((v,i,arr) => !arr.slice(0,i).includes(v))//unique
  const isToday = nowD - (new Date(uniqueDays[0]).getTime()) < dayInMs;
  const isYesterday = !isToday && nowD - (new Date(uniqueDays[0]).getTime()) < dayInMs * 2;
  const unbrokenSeries = uniqueDays.map((v,i,arr) => {
    const d = new Date(v).getTime()
    if(!i) {
      //last test was finished less then 24h before
      return isToday || isYesterday;
    }
    else{
      //if there are no false - if there is an unbrocken series
      const prvD = new Date(arr[i-1]).getTime()
      return prvD - d <= dayInMs
    }
  }).filter((v,i,arr) => {
    return !arr.slice(0,i+1).includes(false)
  })
  return {
    length: unbrokenSeries.length,
    today: isToday
  }
}

interface dayStatsModel{
  label: string
  number: number
  errors: number
}

type weeklyStatsModel = dayStatsModel[]

const daysLabels = [
  "dayMO","dayTU","dayWE","dayTH","dayFR","daySA","daySU",
]

export const getWeeklyStats: (state: AppStateModel) => weeklyStatsModel = (state) => {
  const d = new Date()
  const day = new Date().getDay()
  const todayWeekDay = !!day ? day - 1 : 6;//[0-6], 6 is sunday
  const passages = state.passages;
  const testHistory = state.testsHistory;
  const weekStats = new Array(7).fill(0).map((v,i) => {
    const selectedDay =  new Date(
        (d.getTime() - (dayInMs * (todayWeekDay - i)))
    )
    const selectedOnlyDate = new Date(`${selectedDay.getFullYear()}-${(selectedDay.getMonth()+1)}-${selectedDay.getDate()}`).getTime()
    const selectedDayActivity = testHistory.filter(t => {
      return t.triesDuration[t.triesDuration.length -1][1] > selectedOnlyDate &&
        t.triesDuration[t.triesDuration.length -1][1] < selectedOnlyDate + dayInMs
    })
    const versesPassageIds = selectedDayActivity.map(t => 
        t.passageId
    )
    const versesNumber = versesPassageIds.reduce((partialSum, t) => {
      const passage = passages.find(p => p.id === t)
      if(!passage){
        return partialSum
      }
      return partialSum + (passage.versesNumber || getVersesNumber(passage.address))
    }, 0)
    const minutesNumber = Math.ceil(selectedDayActivity.reduce((partialSum, t) => {
        const testNumTime = t.triesDuration.map(td => td[1] - td[0]).reduce((ps, deltaDt) =>  ps + deltaDt, 0)
        return partialSum + testNumTime
      }, 0) /1000 /60)//ronunding after summing
    const sessionNumber = selectedDayActivity.map(t => t.sessionId).filter((v,i,arr) => !arr.slice(0,i).includes(v)).length
    const metrics = state.settings[SETTINGS.homeScreenWeeklyMetric] === STATS_METRICS.verses ? versesNumber :
      state.settings[SETTINGS.homeScreenWeeklyMetric] === STATS_METRICS.minutes ? minutesNumber :
      sessionNumber;
    const errorNumber = selectedDayActivity.map(
      t => t.errorNumber || 0
    ).reduce((ps, s) => {
      return ps + s
    },0)
    return {
      label: daysLabels[i],
      number: metrics,
      errors: errorNumber
    }
  })
  return weekStats
}