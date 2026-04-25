import { analyzeEmployeeShifts, minutesToTime, timeToMinutes } from '@/utils/shiftProcessor'

const formatNumber = (num) => {
  if (num == null || num === undefined) return ''
  if (num === 0) return '0'
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2)
}

const formatDepartmentLabel = (department) => {
  if (Array.isArray(department)) {
    return department.join(' / ')
  }

  return department || '未分配部门'
}

const getAnalysis = (employee, config) => {
  if (Array.isArray(employee?.processedShifts) && employee.processedShifts.length > 0) {
    return {
      shifts: employee.processedShifts,
      dailyRecords: employee.dailyRecords || []
    }
  }

  return analyzeEmployeeShifts(employee, config)
}

export const getDepartmentCostChartOption = (data, config) => {
  const departmentMap = new Map()
  const rateOH1 = Number(config?.RATE_OH1) || 0
  const rateOH2 = Number(config?.RATE_OH2) || 0

  data.forEach((item) => {
    const label = formatDepartmentLabel(item.department)
    if (!departmentMap.has(label)) {
      departmentMap.set(label, {
        oh1Cost: 0,
        oh2Cost: 0
      })
    }

    const departmentData = departmentMap.get(label)
    departmentData.oh1Cost += (Number(item.netOvertimeOH1) || 0) * rateOH1
    departmentData.oh2Cost += (Number(item.overtimeHoursOH2) || 0) * rateOH2
  })

  const departments = [...departmentMap.keys()]
  const oh1Cost = departments.map(label => departmentMap.get(label).oh1Cost)
  const oh2Cost = departments.map(label => departmentMap.get(label).oh2Cost)
  const totalCost = oh1Cost.map((value, index) => value + oh2Cost[index])
  const maxCost = totalCost.length ? Math.max(...totalCost) : 0

  return {
    title: {
      text: '部门加班成本',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params) => {
        let result = `${params[0]?.name || ''}<br/>`
        params.forEach((param) => {
          result += `${param.marker}${param.seriesName}: ${formatNumber(param.value)} 元<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['OH1 成本', 'OH2 成本'],
      top: 40
    },
    grid: {
      top: 80,
      left: 60,
      right: 30,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: departments
    },
    yAxis: {
      type: 'value',
      name: '金额（元）',
      min: 0,
      max: maxCost > 0 ? maxCost + Math.max(50, maxCost * 0.1) : 100
    },
    series: [
      {
        name: 'OH1 成本',
        type: 'bar',
        stack: 'total',
        data: oh1Cost,
        itemStyle: {
          color: '#FF9900'
        }
      },
      {
        name: 'OH2 成本',
        type: 'bar',
        stack: 'total',
        data: oh2Cost,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  }
}

export const getAttendanceTrendChartOption = (employeeData, config) => {
  const dateMap = new Map()

  employeeData.forEach((employee) => {
    const { shifts } = getAnalysis(employee, config)
    shifts.forEach((shift) => {
      const dateKey = shift.startDate
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          totalOvertime: 0,
          offDutyTimes: []
        })
      }

      const dateEntry = dateMap.get(dateKey)
      dateEntry.totalOvertime += (shift.overtimeMinutesOH1 + shift.overtimeMinutesOH2) / 60

      if (shift.endAbsoluteMinutes != null) {
        dateEntry.offDutyTimes.push(shift.endAbsoluteMinutes - ((shift.startDate - 1) * 24 * 60))
      }
    })
  })

  const dates = [...dateMap.keys()].sort((a, b) => a - b)
  const totalOvertime = dates.map(date => dateMap.get(date).totalOvertime)
  const avgOffDutyMinutes = dates.map((date) => {
    const offDutyTimes = dateMap.get(date).offDutyTimes
    if (!offDutyTimes.length) return null
    return offDutyTimes.reduce((sum, minutes) => sum + minutes, 0) / offDutyTimes.length
  })

  const validOvertime = totalOvertime.filter(value => value > 0)
  const maxOvertime = validOvertime.length ? Math.max(...validOvertime) : 0
  const validOffDuty = avgOffDutyMinutes.filter(value => value != null)
  const maxOffDuty = validOffDuty.length ? Math.max(...validOffDuty) : 18 * 60

  return {
    title: {
      text: '考勤趋势',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0]?.name || ''}<br/>`
        params.forEach((param) => {
          if (param.seriesName === '总加班工时') {
            result += `${param.marker}${param.seriesName}: ${formatNumber(param.value)} 小时<br/>`
            return
          }

          if (param.value != null) {
            result += `${param.marker}${param.seriesName}: ${minutesToTime(param.value)}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['总加班工时', '平均下班时间'],
      top: 40
    },
    grid: {
      top: 80,
      left: 60,
      right: 90,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => `${date}日`)
    },
    yAxis: [
      {
        type: 'value',
        name: '加班工时（小时）',
        min: 0,
        max: maxOvertime > 0 ? maxOvertime + 2 : 10
      },
      {
        type: 'value',
        name: '下班时间',
        min: 8 * 60,
        max: Math.max(24 * 60, Math.ceil(maxOffDuty / 60) * 60 + 60),
        interval: 120,
        axisLabel: {
          formatter: (value) => minutesToTime(value)
        }
      }
    ],
    series: [
      {
        name: '总加班工时',
        type: 'bar',
        data: totalOvertime,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '平均下班时间',
        type: 'line',
        yAxisIndex: 1,
        data: avgOffDutyMinutes,
        itemStyle: {
          color: '#67C23A'
        },
        connectNulls: false
      }
    ]
  }
}

export const getEmployeeLoadChartOption = (data) => {
  const totalHoursValues = data.map(item => Number(item.totalActualHours) || 0)
  const overtimeWageValues = data.map(item => Number(item.overtimeWage) || 0)
  const maxTotalHours = totalHoursValues.length ? Math.max(...totalHoursValues) : 0
  const maxOvertimeWage = overtimeWageValues.length ? Math.max(...overtimeWageValues) : 0

  return {
    title: {
      text: '员工负荷',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.data.employeeName}<br/>实际总工时: ${formatNumber(params.value[0])}<br/>加班薪资: ${formatNumber(params.value[1])} 元`
      }
    },
    legend: {
      data: ['员工'],
      top: 40
    },
    grid: {
      top: 80,
      left: 70,
      right: 50,
      bottom: 50
    },
    xAxis: {
      type: 'value',
      name: '实际总工时（小时）',
      min: 0,
      max: maxTotalHours > 0 ? maxTotalHours + 5 : 10
    },
    yAxis: {
      type: 'value',
      name: '加班薪资（元）',
      min: 0,
      max: maxOvertimeWage > 0 ? maxOvertimeWage + 50 : 100
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: Math.max(maxTotalHours, maxOvertimeWage / 20, 1),
      left: 'right',
      top: 'center',
      calculable: true,
      inRange: {
        color: ['#67C23A', '#E6A23C', '#F56C6C']
      },
      dimension: 0,
      text: ['高负荷', '低负荷'],
      textStyle: {
        color: '#333'
      }
    },
    series: [
      {
        name: '员工',
        type: 'scatter',
        data: data.map(item => ({
          name: item.employeeName,
          value: [Number(item.totalActualHours) || 0, Number(item.overtimeWage) || 0],
          employeeName: item.employeeName
        })),
        symbolSize: 10,
        itemStyle: {
          color: '#FF9900'
        }
      }
    ]
  }
}

export const getMonthlyCompositionChartOption = (employee) => {
  return {
    title: {
      text: '月度工时构成',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 40
    },
    series: [
      {
        name: '工时构成',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: Number(employee.normalHours) || 0, name: '正常工时', itemStyle: { color: '#67C23A' } },
          { value: Number(employee.overtimeHoursOH1) || 0, name: 'OH1 加班工时', itemStyle: { color: '#FF9900' } },
          { value: Number(employee.overtimeHoursOH2) || 0, name: 'OH2 加班工时', itemStyle: { color: '#F56C6C' } },
          { value: Number(employee.missingNormalHours) || 0, name: '缺卡工时', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
}

export const getDailyWorkDetailChartOption = (employee, config) => {
  const { shifts, dailyRecords } = getAnalysis(employee, config)
  const stdStart = timeToMinutes(config.STD_START_TIME)
  const ot1Start = timeToMinutes(config.OT1_START_TIME)
  const ot2Start = timeToMinutes(config.OT2_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const ot1End = timeToMinutes(config.OT1_END_TIME)
  const chartDates = [...new Set(
    (dailyRecords?.length
      ? dailyRecords.map(record => record.date)
      : shifts.flatMap(shift => [shift.startDate, shift.endDate])
    )
  )].sort((a, b) => a - b)
  const labels = chartDates.map(date => `${date}日`)
  const dateIndexMap = new Map(chartDates.map((date, index) => [date, index]))

  const normalData = []
  const ot1Data = []
  const ot2Data = []
  const missingData = []

  const pushSegment = (collection, date, start, end) => {
    const index = dateIndexMap.get(date)
    if (index == null || end <= start) return
    collection.push([start, end, index])
  }

  shifts.forEach((shift) => {
    if (!shift.cleanedStart || shift.endAbsoluteMinutes == null) return

    const dayOffset = (shift.startDate - 1) * 24 * 60
    const start = shift.startAbsoluteMinutes - dayOffset
    const end = shift.endAbsoluteMinutes - dayOffset

    const normalStart = Math.max(start, stdStart)
    const normalEnd = Math.min(end, stdEnd)
    pushSegment(normalData, shift.startDate, normalStart, normalEnd)

    const overtimeStartOH1 = Math.max(start, ot1Start)
    const overtimeEndOH1 = Math.min(end, ot1End)
    pushSegment(ot1Data, shift.startDate, overtimeStartOH1, overtimeEndOH1)

    const overtimeStartOH2 = Math.max(start, ot2Start)
    if (shift.isCrossDay && shift.endDate !== shift.startDate) {
      pushSegment(ot2Data, shift.startDate, overtimeStartOH2, 24 * 60)
      pushSegment(ot2Data, shift.endDate, 0, shift.cleanedEnd?.minutes ?? 0)
    } else {
      pushSegment(ot2Data, shift.startDate, overtimeStartOH2, Math.min(end, 24 * 60))
    }

    ;(shift.missingSegments || []).forEach(([segmentStart, segmentEnd]) => {
      pushSegment(missingData, shift.startDate, segmentStart, segmentEnd)
    })
  })

  const renderBar = (color) => (params, api) => {
    const start = api.value(0)
    const end = api.value(1)
    const yIndex = api.value(2)
    const pointStart = api.coord([start, yIndex])
    const pointEnd = api.coord([end, yIndex])
    const barHeight = 10

    return {
      type: 'rect',
      shape: {
        x: Math.min(pointStart[0], pointEnd[0]),
        y: pointStart[1] - (barHeight / 2),
        width: Math.abs(pointEnd[0] - pointStart[0]),
        height: barHeight
      },
      style: api.style({
        fill: color
      })
    }
  }

  const series = [
    {
      name: '正常工时',
      type: 'custom',
      renderItem: renderBar('#67C23A'),
      data: normalData
    },
    {
      name: 'OH1 加班',
      type: 'custom',
      renderItem: renderBar('#FF9900'),
      data: ot1Data
    },
    {
      name: 'OH2 加班',
      type: 'custom',
      renderItem: renderBar('#F56C6C'),
      data: ot2Data
    },
    {
      name: '缺卡时段',
      type: 'custom',
      renderItem: renderBar('#909399'),
      data: missingData,
      itemStyle: {
        opacity: 0.45
      }
    }
  ].filter(item => item.data.length > 0)

  return {
    title: {
      text: '个人每日工时明细',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (!params.value) return params.seriesName
        const label = labels[params.value[2]]
        return `${label}<br/>${params.seriesName}: ${minutesToTime(params.value[0])} - ${minutesToTime(params.value[1])}`
      }
    },
    legend: {
      data: ['正常工时', 'OH1 加班', 'OH2 加班', '缺卡时段'],
      top: 40
    },
    grid: {
      top: 80,
      left: 90,
      right: 40,
      bottom: 50
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 24 * 60,
      interval: 120,
      axisLabel: {
        formatter: (value) => minutesToTime(value)
      },
      name: '时间'
    },
    yAxis: {
      type: 'category',
      data: labels,
      name: '班次'
    },
    series
  }
}

export const getPunchTrendChartOption = (employee, config) => {
  const { dailyRecords, shifts } = getAnalysis(employee, config)
  const shiftMap = new Map()

  shifts.forEach((shift) => {
    if (!shiftMap.has(shift.startDate)) {
      shiftMap.set(shift.startDate, {
        onDutyMinutes: null,
        offDutyMinutes: null
      })
    }

    const entry = shiftMap.get(shift.startDate)
    const onDutyMinutes = shift.cleanedStart?.minutes ?? null
    const offDutyMinutes = shift.endAbsoluteMinutes == null
      ? null
      : shift.endAbsoluteMinutes - ((shift.startDate - 1) * 24 * 60)

    if (onDutyMinutes != null) {
      entry.onDutyMinutes = entry.onDutyMinutes == null ? onDutyMinutes : Math.min(entry.onDutyMinutes, onDutyMinutes)
    }
    if (offDutyMinutes != null) {
      entry.offDutyMinutes = entry.offDutyMinutes == null ? offDutyMinutes : Math.max(entry.offDutyMinutes, offDutyMinutes)
    }
  })

  const dates = dailyRecords.map(record => record.date)
  const stdStart = timeToMinutes(config.STD_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const allMinutes = dates.flatMap((date) => {
    const record = shiftMap.get(date)
    return [record?.onDutyMinutes, record?.offDutyMinutes].filter(value => value != null)
  })
  const maxMinutes = allMinutes.length ? Math.max(...allMinutes) : stdEnd

  return {
    title: {
      text: '上下班打卡时间趋势',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0]?.name || ''}<br/>`
        params.forEach((param) => {
          if (param.value != null) {
            result += `${param.marker}${param.seriesName}: ${minutesToTime(param.value)}<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['上班时间', '下班时间'],
      top: 40
    },
    grid: {
      top: 80,
      left: 60,
      right: 40,
      bottom: 40
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => `${date}日`)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: Math.max(24 * 60, Math.ceil(maxMinutes / 60) * 60),
      interval: 120,
      axisLabel: {
        formatter: (value) => minutesToTime(value)
      }
    },
    series: [
      {
        name: '上班时间',
        type: 'line',
        data: dates.map(date => shiftMap.get(date)?.onDutyMinutes ?? null),
        itemStyle: {
          color: '#67C23A'
        },
        connectNulls: false,
        markLine: {
          data: [
            {
              yAxis: stdStart,
              name: '标准上班时间',
              lineStyle: {
                color: '#67C23A',
                type: 'dashed'
              }
            }
          ]
        }
      },
      {
        name: '下班时间',
        type: 'line',
        data: dates.map(date => shiftMap.get(date)?.offDutyMinutes ?? null),
        itemStyle: {
          color: '#F56C6C'
        },
        connectNulls: false,
        markLine: {
          data: [
            {
              yAxis: stdEnd,
              name: '标准下班时间',
              lineStyle: {
                color: '#F56C6C',
                type: 'dashed'
              }
            }
          ]
        }
      }
    ]
  }
}
