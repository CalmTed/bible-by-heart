import { getVersesNumber } from "../initials"
import { PassageModel, TestModel } from "../models"
import addZero from "./addZero"

const dayInMs = 24*60*60*1000

export const getStroke = (testHistory: TestModel[]) => {
  const nowD = new Date().getTime()
  const allDays = testHistory.sort((a,b) => b.dateFinished - a.dateFinished).map((t,i,arr) => {
    const d = new Date(t.dateFinished)
    return `${addZero(d.getFullYear(), 4)}-${addZero(d.getMonth() + 1 )}-${addZero(d.getDate())}`
  })
  const uniqueDays = allDays.filter((v,i,arr) => !arr.slice(0,i).includes(v))
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
  verses: number
  errors: number
}

type weeklyStatsModel = dayStatsModel[]

const daysLabels = [
  "dayMO","dayTU","dayWE","dayTH","dayFR","daySA","daySU",
]

export const getWeeklyStats: (passages: PassageModel[], testHistory: TestModel[]) => weeklyStatsModel = (passages, testHistory) => {
  const d = new Date()
  const todayWeekDay = d.getUTCDay() - 1
  const weekStats = new Array(7).fill(0).map((v,i) => {
    const selectedDay =  new Date(
        (d.getTime() - (dayInMs * (todayWeekDay - i)))
    )
    const selectedOnlyDate = new Date(`${selectedDay.getFullYear()}-${(selectedDay.getMonth()+1)}-${selectedDay.getDate()}`).getTime()
    const selectedDayActivity = testHistory.filter(t => {
      return t.dateFinished > selectedOnlyDate && t.dateFinished < selectedOnlyDate + dayInMs
    })
    const versesPassageIds = selectedDayActivity.map(t => 
        t.passageId
    )
    const versesNumber = versesPassageIds.reduce((partialSum, t) => {
      const passage = passages.find(p => p.id === t)
      if(!passage){
        return partialSum
      }
      return partialSum + passage.versesNumber || getVersesNumber(passage.address)
    }, 0)
    const errorNumber = selectedDayActivity.map(
      t => t.errorNumber || 0
    ).reduce((ps, s) => {
      return ps + s
    },0)
    return {
      label: daysLabels[i],
      verses: versesNumber,
      errors: errorNumber
    }
  })
  return weekStats
}