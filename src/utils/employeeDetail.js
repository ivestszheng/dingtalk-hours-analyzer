const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

export const generateDetailData = (employee, config) => {
  if (!employee || !employee.rawPunches) return []
  
  const stdStart = timeToMinutes(config.STD_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const dedupThreshold = config.DEDUPLICATE_THRESHOLD

  const dateMap = {}
  
  employee.rawPunches.forEach(punch => {
    if (!dateMap[punch.date]) {
      dateMap[punch.date] = {
        date: punch.date,
        weekday: punch.weekday,
        raw: punch.time,
        logic: [],
        result: {
          onDuty: null,
          offDuty: null
        }
      }
    }
  })

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

  shifts.forEach(shift => {
    const startPunches = shift.punches.filter(p => p.minutes < timeToMinutes('12:00'))
    const endPunches = shift.punches.filter(p => p.minutes >= timeToMinutes('12:00'))

    let cleanedStart = null
    let cleanedEnd = null

    if (startPunches.length > 0) {
      cleanedStart = startPunches[0]
      for (let i = 1; i < startPunches.length; i++) {
        if (startPunches[i].minutes - cleanedStart.minutes <= dedupThreshold) {
          if (dateMap[shift.startDate]) {
            dateMap[shift.startDate].logic.push('10分钟去重')
          }
        } else {
          cleanedStart = startPunches[i]
        }
      }
    }

    if (endPunches.length > 0) {
      cleanedEnd = endPunches[endPunches.length - 1]
      for (let i = endPunches.length - 2; i >= 0; i--) {
        if (cleanedEnd.minutes - endPunches[i].minutes <= dedupThreshold) {
          if (dateMap[shift.startDate]) {
            dateMap[shift.startDate].logic.push('10分钟去重')
          }
        } else {
          cleanedEnd = endPunches[i]
        }
      }
    }

    if (cleanedStart && cleanedEnd) {
      if (dateMap[shift.startDate]) {
        dateMap[shift.startDate].logic.push('上班取最早，下班取最晚')
      }
    }

    if (shift.isCrossDay) {
      if (dateMap[shift.startDate]) {
        dateMap[shift.startDate].logic.push('跨天合并')
      }
      if (dateMap[shift.endDate]) {
        dateMap[shift.endDate].logic.push('跨天合并')
      }
    }

    if (cleanedStart) {
      const startMinutes = cleanedStart.minutes
      if (startMinutes > stdStart && startMinutes < timeToMinutes(config.LATE_CHECK_THRESHOLD)) {
        if (dateMap[shift.startDate]) {
          dateMap[shift.startDate].logic.push('缺卡判定')
        }
      }
    }

    if (cleanedStart && dateMap[shift.startDate]) {
      dateMap[shift.startDate].result.onDuty = cleanedStart.time
    }
    if (cleanedEnd && dateMap[shift.startDate]) {
      dateMap[shift.startDate].result.offDuty = cleanedEnd.time
    }
  })

  return Object.values(dateMap).map(item => ({
    ...item,
    logic: [...new Set(item.logic)]
  }))
}
