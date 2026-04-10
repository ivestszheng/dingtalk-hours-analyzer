import { useConfigStore } from '@/stores/config'

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export const processEmployeeData = (employee) => {
  const config = useConfigStore()
  const result = { ...employee }
  result.logicTags = []
  result.totalActualHours = 0
  result.normalHours = 0
  result.overtimeHoursOH1 = 0
  result.overtimeHoursOH2 = 0
  result.missingNormalHours = 0
  result.netOvertimeOH1 = 0
  result.overtimeWage = 0

  const allPunches = []
  employee.rawPunches.forEach(punch => {
    punch.time.forEach(time => {
      allPunches.push({
        date: punch.date,
        weekday: punch.weekday,
        time: time,
        minutes: timeToMinutes(time)
      })
    })
  })

  allPunches.sort((a, b) => {
    if (a.date !== b.date) return a.date - b.date
    return a.minutes - b.minutes
  })

  const shifts = []
  let currentShift = null

  for (let i = 0; i < allPunches.length; i++) {
    const punch = allPunches[i]
    
    if (!currentShift) {
      currentShift = {
        startDate: punch.date,
        startWeekday: punch.weekday,
        startTime: punch.time,
        startMinutes: punch.minutes,
        punches: [punch],
        isCrossDay: false
      }
    } else {
      const prevPunch = allPunches[i - 1]
      const isNextDay = punch.date > prevPunch.date
      const isBefore8AM = punch.minutes < timeToMinutes('08:00')
      
      if (isNextDay && isBefore8AM) {
        currentShift.isCrossDay = true
        currentShift.endDate = punch.date
        currentShift.endWeekday = punch.weekday
        currentShift.endTime = punch.time
        currentShift.endMinutes = punch.minutes
        currentShift.punches.push(punch)
        shifts.push(currentShift)
        currentShift = null
      } else if (punch.date === currentShift.startDate) {
        currentShift.punches.push(punch)
      } else {
        if (!currentShift.endTime) {
          currentShift.endTime = currentShift.punches[currentShift.punches.length - 1].time
          currentShift.endMinutes = currentShift.punches[currentShift.punches.length - 1].minutes
        }
        shifts.push(currentShift)
        currentShift = {
          startDate: punch.date,
          startWeekday: punch.weekday,
          startTime: punch.time,
          startMinutes: punch.minutes,
          punches: [punch],
          isCrossDay: false
        }
      }
    }
  }

  if (currentShift) {
    if (!currentShift.endTime && currentShift.punches.length > 0) {
      currentShift.endTime = currentShift.punches[currentShift.punches.length - 1].time
      currentShift.endMinutes = currentShift.punches[currentShift.punches.length - 1].minutes
    }
    shifts.push(currentShift)
  }

  const processedShifts = shifts.map(shift => {
    const processed = { ...shift }
    processed.cleanedPunches = [...shift.punches]
    processed.tags = []

    const dedupThreshold = config.DEDUPLICATE_THRESHOLD
    const startPunches = shift.punches.filter(p => p.minutes < timeToMinutes('12:00'))
    const endPunches = shift.punches.filter(p => p.minutes >= timeToMinutes('12:00'))

    if (startPunches.length > 1) {
      let earliest = startPunches[0]
      for (let i = 1; i < startPunches.length; i++) {
        if (startPunches[i].minutes - earliest.minutes <= dedupThreshold) {
          processed.tags.push('10分钟去重')
        } else {
          earliest = startPunches[i]
        }
      }
      processed.cleanedStart = earliest
    } else if (startPunches.length === 1) {
      processed.cleanedStart = startPunches[0]
    }

    if (endPunches.length > 1) {
      let latest = endPunches[endPunches.length - 1]
      for (let i = endPunches.length - 2; i >= 0; i--) {
        if (latest.minutes - endPunches[i].minutes <= dedupThreshold) {
          processed.tags.push('10分钟去重')
        } else {
          latest = endPunches[i]
        }
      }
      processed.cleanedEnd = latest
    } else if (endPunches.length === 1) {
      processed.cleanedEnd = endPunches[0]
    }

    if (processed.cleanedStart && processed.cleanedEnd) {
      processed.tags.push('上班取最早，下班取最晚')
    }

    if (shift.isCrossDay) {
      processed.tags.push('跨天合并')
    }

    return processed
  })

  const stdStart = timeToMinutes(config.STD_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const ot1Start = timeToMinutes(config.OT1_START_TIME)
  const ot1End = timeToMinutes(config.OT1_END_TIME)
  const ot2Start = timeToMinutes(config.OT2_START_TIME)
  const lateThreshold = timeToMinutes(config.LATE_CHECK_THRESHOLD)

  processedShifts.forEach(shift => {
    if (!shift.cleanedStart) return

    const startMinutes = shift.cleanedStart.minutes
    const endMinutes = shift.cleanedEnd ? shift.cleanedEnd.minutes : startMinutes

    if (startMinutes > stdStart && startMinutes < lateThreshold) {
      result.missingNormalHours = (startMinutes - stdStart) / 60
      shift.tags.push('缺卡判定')
    }

    let normalMinutes = 0
    let ot1Minutes = 0
    let ot2Minutes = 0

    const effectiveStart = Math.max(startMinutes, stdStart)
    const effectiveEnd = Math.min(endMinutes, stdEnd)
    if (effectiveEnd > effectiveStart) {
      normalMinutes = effectiveEnd - effectiveStart
    }

    const ot1EffectiveStart = Math.max(startMinutes, ot1Start)
    const ot1EffectiveEnd = Math.min(endMinutes, ot1End)
    if (ot1EffectiveEnd > ot1EffectiveStart) {
      ot1Minutes = ot1EffectiveEnd - ot1EffectiveStart
    }

    if (shift.isCrossDay) {
      const ot2EffectiveStart = Math.max(startMinutes, ot2Start)
      ot2Minutes = (24 * 60 - ot2EffectiveStart) + endMinutes
    } else {
      const ot2EffectiveStart = Math.max(startMinutes, ot2Start)
      if (endMinutes > ot2EffectiveStart) {
        ot2Minutes = endMinutes - ot2EffectiveStart
      }
    }

    result.normalHours += normalMinutes / 60
    result.overtimeHoursOH1 += ot1Minutes / 60
    result.overtimeHoursOH2 += ot2Minutes / 60
  })

  result.totalActualHours = result.normalHours + result.overtimeHoursOH1 + result.overtimeHoursOH2
  result.netOvertimeOH1 = Math.max(0, result.overtimeHoursOH1 - result.missingNormalHours)
  result.overtimeWage = (result.netOvertimeOH1 * config.RATE_OH1) + (result.overtimeHoursOH2 * config.RATE_OH2)

  result.logicTags = [...new Set(processedShifts.flatMap(s => s.tags))]

  return result
}
