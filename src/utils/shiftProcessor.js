// 半小时为一个计量单位（30分钟）
const HALF_HOUR_MINUTES = 30

/**
 * 将时间字符串转换为分钟数
 * @param {string} timeStr - 时间字符串（格式：HH:mm）
 * @returns {number} 分钟数
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes] = String(timeStr).split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * 将分钟数转换为时间字符串
 * @param {number} minutes - 分钟数
 * @returns {string} 时间字符串（格式：HH:mm）
 */
export const minutesToTime = (minutes) => {
  const safeMinutes = Math.max(0, Math.round(minutes))
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * 计算绝对分钟数（从第1天00:00开始计算）
 * @param {number} date - 日期（1-31）
 * @param {number} minutes - 当天的分钟数
 * @returns {number} 绝对分钟数
 */
const getAbsoluteMinutes = (date, minutes) => ((Number(date) - 1) * 24 * 60) + minutes

/**
 * 计算两个时间段的重叠分钟数
 * @param {number} start - 开始时间（分钟）
 * @param {number} end - 结束时间（分钟）
 * @param {number} windowStart - 窗口开始时间（分钟）
 * @param {number} windowEnd - 窗口结束时间（分钟）
 * @returns {number} 重叠的分钟数
 */
const overlapMinutes = (start, end, windowStart, windowEnd) => {
  return Math.max(0, Math.min(end, windowEnd) - Math.max(start, windowStart))
}

/**
 * 向下取整到半小时（用于加班时长计算）
 * @param {number} minutes - 分钟数
 * @returns {number} 取整后的分钟数
 */
const floorToHalfHour = (minutes) => {
  return Math.floor(Math.max(0, minutes) / HALF_HOUR_MINUTES) * HALF_HOUR_MINUTES
}

/**
 * 向上取整到半小时（用于缺卡时长计算）
 * @param {number} minutes - 分钟数
 * @returns {number} 取整后的分钟数
 */
const ceilToHalfHour = (minutes) => {
  return Math.ceil(Math.max(0, minutes) / HALF_HOUR_MINUTES) * HALF_HOUR_MINUTES
}

const createShift = (punch) => ({
  startDate: punch.date,
  startWeekday: punch.weekday,
  punches: [punch],
  isCrossDay: false
})

const finalizeShift = (shift) => {
  if (!shift.punches.length) return shift

  const firstPunch = shift.punches[0]
  const lastPunch = shift.punches[shift.punches.length - 1]

  return {
    ...shift,
    endDate: shift.endDate ?? lastPunch.date,
    endWeekday: shift.endWeekday ?? lastPunch.weekday,
    startTime: firstPunch.time,
    endTime: shift.endTime ?? lastPunch.time,
    startMinutes: firstPunch.minutes,
    endMinutes: shift.endMinutes ?? lastPunch.minutes
  }
}

const buildPunchClusters = (punches, deduplicateThreshold) => {
  const clusters = []

  punches.forEach((punch) => {
    const lastCluster = clusters[clusters.length - 1]
    const lastPunch = lastCluster?.[lastCluster.length - 1]

    if (!lastCluster || (punch.absoluteMinutes - lastPunch.absoluteMinutes) > deduplicateThreshold) {
      clusters.push([punch])
      return
    }

    lastCluster.push(punch)
  })

  return clusters
}

const identifyShifts = (allPunches, config) => {
  const shifts = []
  const nextDayCutoff = timeToMinutes(config.STD_START_TIME)
  const punchesByDate = new Map()
  const consumedCounts = new Map()

  allPunches.forEach((punch) => {
    const dayPunches = punchesByDate.get(punch.date) ?? []
    dayPunches.push(punch)
    punchesByDate.set(punch.date, dayPunches)
  })

  const dates = [...punchesByDate.keys()].sort((a, b) => a - b)

  dates.forEach((date, index) => {
    const allDayPunches = punchesByDate.get(date) ?? []
    const consumedCount = consumedCounts.get(date) ?? 0
    const dayPunches = allDayPunches.slice(consumedCount)

    if (!dayPunches.length) {
      return
    }

    if (dayPunches.length === 1) {
      const currentPunch = dayPunches[0]
      const nextDate = dates[index + 1]
      const nextDayPunches = nextDate ? (punchesByDate.get(nextDate) ?? []) : []
      const nextConsumedCount = nextDate ? (consumedCounts.get(nextDate) ?? 0) : 0
      const nextPunch = nextDayPunches[nextConsumedCount]
      const isNextDayContinuation = (
        nextDate === (date + 1) &&
        nextPunch &&
        nextPunch.minutes < nextDayCutoff
      )

      if (isNextDayContinuation) {
        consumedCounts.set(nextDate, nextConsumedCount + 1)
        shifts.push(finalizeShift({
          ...createShift(currentPunch),
          punches: [currentPunch, nextPunch],
          isCrossDay: true,
          endDate: nextPunch.date,
          endWeekday: nextPunch.weekday,
          endTime: nextPunch.time,
          endMinutes: nextPunch.minutes
        }))
        return
      }
    }

    shifts.push(finalizeShift({
      ...createShift(dayPunches[0]),
      punches: dayPunches
    }))
  })

  return shifts
}

const calculateShiftDurations = (shift, config) => {
  if (!shift.cleanedStart) {
    return {
      normalMinutes: 0,
      overtimeMinutesOH1: 0,
      overtimeMinutesOH2: 0,
      missingNormalMinutes: 0,
      missingSegments: []
    }
  }

  const stdStart = timeToMinutes(config.STD_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const breakStart = timeToMinutes(config.BREAK_START_TIME || '11:30')
  const breakEnd = timeToMinutes(config.BREAK_END_TIME || '12:30')
  const ot1Start = timeToMinutes(config.OT1_START_TIME)
  const ot1End = timeToMinutes(config.OT1_END_TIME)
  const ot2Start = timeToMinutes(config.OT2_START_TIME)

  const dayOffset = getAbsoluteMinutes(shift.startDate, 0)
  const startAbsoluteMinutes = shift.cleanedStart.absoluteMinutes
  const endAbsoluteMinutes = shift.cleanedEnd?.absoluteMinutes ?? startAbsoluteMinutes

  const normalMinutes = overlapMinutes(
    startAbsoluteMinutes,
    endAbsoluteMinutes,
    dayOffset + stdStart,
    dayOffset + stdEnd
  )

  const overtimeMinutesOH1 = overlapMinutes(
    startAbsoluteMinutes,
    endAbsoluteMinutes,
    dayOffset + ot1Start,
    dayOffset + ot1End
  )

  const overtimeMinutesOH2 = Math.max(0, endAbsoluteMinutes - Math.max(startAbsoluteMinutes, dayOffset + ot2Start))

  let missingNormalMinutes = 0
  const missingSegments = []

  if (shift.cleanedStart.minutes > stdStart && shift.cleanedStart.minutes < stdEnd) {
    const workingWindows = [
      [stdStart, Math.min(breakStart, stdEnd)],
      [Math.max(breakEnd, stdStart), stdEnd]
    ].filter(([windowStart, windowEnd]) => windowEnd > windowStart)

    workingWindows.forEach(([windowStart, windowEnd]) => {
      const segmentEnd = Math.min(shift.cleanedStart.minutes, windowEnd)
      if (segmentEnd > windowStart) {
        missingSegments.push([windowStart, segmentEnd])
        missingNormalMinutes += segmentEnd - windowStart
      }
    })
  }

  return {
    normalMinutes,
    overtimeMinutesOH1: floorToHalfHour(overtimeMinutesOH1),
    overtimeMinutesOH2: floorToHalfHour(overtimeMinutesOH2),
    missingNormalMinutes: ceilToHalfHour(missingNormalMinutes),
    missingSegments
  }
}

const processShift = (shift, config) => {
  const deduplicateThreshold = Number(config.DEDUPLICATE_THRESHOLD) || 10
  const sortedPunches = [...shift.punches].sort((a, b) => a.absoluteMinutes - b.absoluteMinutes)
  const clusters = buildPunchClusters(sortedPunches, deduplicateThreshold)
  const cleanedStart = clusters[0]?.[0] ?? null
  const cleanedEnd = clusters.length > 1 ? clusters[clusters.length - 1][clusters[clusters.length - 1].length - 1] : null

  const tags = []
  if (clusters.some(cluster => cluster.length > 1)) {
    tags.push('10分钟去重')
  }
  if (cleanedStart && cleanedEnd) {
    tags.push('上班取最早，下班取最晚')
  }
  if (shift.isCrossDay) {
    tags.push('跨天合并')
  }

  const durations = calculateShiftDurations(
    {
      ...shift,
      cleanedStart,
      cleanedEnd
    },
    config
  )

  if (durations.missingNormalMinutes > 0) {
    tags.push('缺卡判定')
  }

  return {
    ...shift,
    punches: sortedPunches,
    cleanedStart,
    cleanedEnd,
    tags,
    clusters: clusters.map(cluster => cluster.map(punch => ({ ...punch }))),
    startAbsoluteMinutes: cleanedStart?.absoluteMinutes ?? null,
    endAbsoluteMinutes: cleanedEnd?.absoluteMinutes ?? cleanedStart?.absoluteMinutes ?? null,
    normalMinutes: durations.normalMinutes,
    overtimeMinutesOH1: durations.overtimeMinutesOH1,
    overtimeMinutesOH2: durations.overtimeMinutesOH2,
    missingNormalMinutes: durations.missingNormalMinutes,
    missingSegments: durations.missingSegments
  }
}

export const analyzeEmployeeShifts = (employee, config) => {
  const rawPunches = employee?.rawPunches ?? []
  const allPunches = rawPunches
    .flatMap((punch) => (punch.time || []).map((time) => {
      const minutes = timeToMinutes(time)
      return {
        date: Number(punch.date),
        weekday: punch.weekday,
        time,
        minutes,
        absoluteMinutes: getAbsoluteMinutes(punch.date, minutes)
      }
    }))
    .sort((a, b) => a.absoluteMinutes - b.absoluteMinutes)

  if (!allPunches.length) {
    return {
      shifts: [],
      dailyRecords: []
    }
  }

  const shifts = identifyShifts(allPunches, config).map(shift => processShift(shift, config))
  const dateMap = new Map()

  rawPunches.forEach((punch) => {
    dateMap.set(Number(punch.date), {
      date: Number(punch.date),
      weekday: punch.weekday,
      raw: [...(punch.time || [])],
      logic: [],
      result: {
        onDuty: null,
        offDuty: null,
        onDutyMinutes: null,
        offDutyMinutes: null
      },
      isContinuation: false
    })
  })

  shifts.forEach((shift) => {
    const startRecord = dateMap.get(shift.startDate) ?? {
      date: shift.startDate,
      weekday: shift.startWeekday,
      raw: [],
      logic: [],
      result: {
        onDuty: null,
        offDuty: null,
        onDutyMinutes: null,
        offDutyMinutes: null
      },
      isContinuation: false
    }

    startRecord.logic.push(...shift.tags)
    if (shift.cleanedStart) {
      startRecord.result.onDuty = shift.cleanedStart.time
      startRecord.result.onDutyMinutes = shift.cleanedStart.minutes
    }
    if (shift.cleanedEnd) {
      startRecord.result.offDuty = shift.isCrossDay ? `次日 ${shift.cleanedEnd.time}` : shift.cleanedEnd.time
      startRecord.result.offDutyMinutes = shift.endAbsoluteMinutes - getAbsoluteMinutes(shift.startDate, 0)
    }
    dateMap.set(shift.startDate, startRecord)

    if (shift.isCrossDay && shift.endDate !== shift.startDate) {
      const endRecord = dateMap.get(shift.endDate) ?? {
        date: shift.endDate,
        weekday: shift.endWeekday,
        raw: [],
        logic: [],
        result: {
          onDuty: null,
          offDuty: null,
          onDutyMinutes: null,
          offDutyMinutes: null
        },
        isContinuation: false
      }

      endRecord.logic.push('跨天合并', '次日延续')
      if (shift.cleanedEnd) {
        endRecord.result.offDuty = shift.cleanedEnd.time
        endRecord.result.offDutyMinutes = shift.cleanedEnd.minutes
      }
      endRecord.isContinuation = true
      dateMap.set(shift.endDate, endRecord)
    }
  })

  return {
    shifts,
    dailyRecords: [...dateMap.values()]
      .sort((a, b) => a.date - b.date)
      .map(record => ({
        ...record,
        logic: [...new Set(record.logic)]
      }))
  }
}
