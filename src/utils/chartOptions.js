const formatNumber = (num) => {
  if (num == null || num === undefined) return ''
  if (num === 0) return '0'
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2)
}

export const getDepartmentCostChartOption = (data) => {
  const departments = [...new Set(data.map(item => item.department))]
  
  const oh1Cost = departments.map(dept => {
    const deptData = data.filter(item => item.department === dept)
    return deptData.reduce((sum, item) => sum + item.overtimeHoursOH1 * 20, 0)
  })
  
  const oh2Cost = departments.map(dept => {
    const deptData = data.filter(item => item.department === dept)
    return deptData.reduce((sum, item) => sum + item.overtimeHoursOH2 * 30, 0)
  })

  const totalCost = oh1Cost.map((val, i) => val + oh2Cost[i])
  const maxCost = Math.max(...totalCost)
  const yAxisMax = maxCost + Math.max(50, maxCost * 0.1)

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
        let result = params[0].name + '<br/>'
        params.forEach(param => {
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
      left: 50,
      right: 30,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: departments
    },
    yAxis: {
      type: 'value',
      name: '金额（元）',
      min: 0,
      max: yAxisMax
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

export const getAttendanceTrendChartOption = (employeeData) => {
  const dateMap = {}
  
  employeeData.forEach(emp => {
    emp.rawPunches?.forEach(punch => {
      if (!dateMap[punch.date]) {
        dateMap[punch.date] = {
          totalOvertime: 0,
          offDutyTimes: []
        }
      }
      
      const oh1 = typeof emp.overtimeHoursOH1 === 'number' && !isNaN(emp.overtimeHoursOH1) ? emp.overtimeHoursOH1 : 0
      const oh2 = typeof emp.overtimeHoursOH2 === 'number' && !isNaN(emp.overtimeHoursOH2) ? emp.overtimeHoursOH2 : 0
      
      dateMap[punch.date].totalOvertime += oh1 + oh2
      
      if (punch.time.length > 0) {
        dateMap[punch.date].offDutyTimes.push(punch.time[punch.time.length - 1])
      }
    })
  })

  const dates = Object.keys(dateMap).sort((a, b) => a - b)
  const totalOvertime = dates.map(date => {
    const val = dateMap[date].totalOvertime
    return typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : 0
  })
  
  const avgOffDutyMinutes = dates.map(date => {
    const times = dateMap[date].offDutyTimes
    if (times.length === 0) return null
    const totalMinutes = times.reduce((sum, time) => {
      const [h, m] = time.split(':').map(Number)
      return sum + h * 60 + m
    }, 0)
    const avg = totalMinutes / times.length
    return typeof avg === 'number' && !isNaN(avg) && isFinite(avg) ? avg : null
  })

  const formatMinutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = Math.floor(minutes % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const validOvertime = totalOvertime.filter(val => val != null && !isNaN(val) && isFinite(val) && val > 0)
  let minOvertime = 0
  let maxOvertime = 10
  
  if (validOvertime.length > 0) {
    minOvertime = Math.min(...validOvertime)
    maxOvertime = Math.max(...validOvertime)
  }
  
  const validOffDuty = avgOffDutyMinutes.filter(val => val != null && !isNaN(val) && isFinite(val))
  let minOffDuty = 480
  let maxOffDuty = 1080
  
  if (validOffDuty.length > 0) {
    minOffDuty = Math.min(...validOffDuty)
    maxOffDuty = Math.max(...validOffDuty)
  }

  const leftYAxisMin = Math.max(0, minOvertime - (minOvertime > 0 ? 1 : 0))
  const leftYAxisMax = maxOvertime + (maxOvertime > 0 ? 2 : 10)
  const rightYAxisMin = Math.max(0, minOffDuty - 60)
  const rightYAxisMax = Math.min(1440, maxOffDuty + 60)

  return {
    title: {
      text: '考勤趋势',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          if (param.seriesName === '总加班工时') {
            result += `${param.marker}${param.seriesName}: ${formatNumber(param.value)} 小时<br/>`
          } else if (param.value != null) {
            result += `${param.marker}${param.seriesName}: ${formatMinutesToTime(param.value)}<br/>`
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
      left: 50,
      right: 80,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: dates.map(d => `${d}日`)
    },
    yAxis: [
      {
        type: 'value',
        name: '加班工时（小时）',
        position: 'left'
      },
      {
        type: 'value',
        name: '时间',
        position: 'right',
        min: 480,
        max: 1320,
        interval: 60,
        axisLabel: {
          formatter: (value) => formatMinutesToTime(value)
        }
      }
    ],
    series: [
      {
        name: '总加班工时',
        type: 'bar',
        yAxisIndex: 0,
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
  const totalHoursValues = data.map(item => item.totalActualHours)
  const overtimeWageValues = data.map(item => item.overtimeWage)
  
  const minTotalHours = Math.min(...totalHoursValues)
  const maxTotalHours = Math.max(...totalHoursValues)
  const minOvertimeWage = Math.min(...overtimeWageValues)
  const maxOvertimeWage = Math.max(...overtimeWageValues)
  
  const xAxisMin = Math.max(0, minTotalHours - 5)
  const xAxisMax = maxTotalHours + 5
  const yAxisMin = Math.max(0, minOvertimeWage - 50)
  const yAxisMax = maxOvertimeWage + 50
  
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
      min: xAxisMin,
      max: xAxisMax
    },
    yAxis: {
      type: 'value',
      name: '加班薪资（元）',
      min: yAxisMin,
      max: yAxisMax
    },
    visualMap: {
      type: 'continuous',
      min: 0,
      max: Math.max(maxTotalHours, maxOvertimeWage / 20),
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
          value: [item.totalActualHours, item.overtimeWage],
          employeeName: item.employeeName
        })),
        symbolSize: 8,
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
    grid: {
      top: 80
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
          { value: formatNumber(employee.normalHours), name: '正常工时', itemStyle: { color: '#67C23A' } },
          { value: formatNumber(employee.overtimeHoursOH1), name: 'OH1 加班工时', itemStyle: { color: '#FF9900' } },
          { value: formatNumber(employee.overtimeHoursOH2), name: 'OH2 加班工时', itemStyle: { color: '#F56C6C' } },
          { value: formatNumber(employee.missingNormalHours), name: '缺卡工时', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }
}

export const getDailyWorkDetailChartOption = (employee, config) => {
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }
  
  const formatMinutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = Math.floor(minutes % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const stdStart = timeToMinutes(config.STD_START_TIME)
  const stdEnd = timeToMinutes(config.STD_END_TIME)
  const ot1Start = timeToMinutes(config.OT1_START_TIME)
  const ot1End = timeToMinutes(config.OT1_END_TIME)
  const ot2Start = timeToMinutes(config.OT2_START_TIME)

  const dates = employee.rawPunches?.map(p => p.date).sort((a, b) => a - b) || []
  const dateData = employee.rawPunches || []

  const normalData = []
  const ot1Data = []
  const ot2Data = []

  dates.forEach((date, dateIndex) => {
    const punch = dateData.find(p => p.date === date)
    if (!punch || punch.time.length < 2) {
      return
    }

    const times = punch.time.map(t => timeToMinutes(t)).sort((a, b) => a - b)
    const startTime = times[0]
    const endTime = times[times.length - 1]

    const normalStart = Math.max(startTime, stdStart)
    const normalEnd = Math.min(endTime, stdEnd)
    if (normalStart < normalEnd) {
      normalData.push([normalStart, normalEnd, dateIndex])
    }

    const ot1StartVal = Math.max(startTime, ot1Start)
    const ot1EndVal = Math.min(endTime, ot1End)
    if (ot1StartVal < ot1EndVal) {
      ot1Data.push([ot1StartVal, ot1EndVal, dateIndex])
    }

    const ot2StartVal = Math.max(startTime, ot2Start)
    const ot2EndVal = endTime
    if (ot2StartVal < ot2EndVal) {
      ot2Data.push([ot2StartVal, ot2EndVal, dateIndex])
    }
  })

  const barHeight = 10
  const barGap = 2

  const renderItem = (color, offsetIndex) => (params, api) => {
    const start = api.value(0)
    const end = api.value(1)
    const yIndex = api.value(2)
    
    if (start == null || end == null || yIndex == null) {
      return null
    }
    
    const pointStart = api.coord([start, yIndex])
    const pointEnd = api.coord([end, yIndex])
    
    if (!pointStart || !pointEnd || pointStart.length < 2 || pointEnd.length < 2) {
      return null
    }
    
    const yPosition = pointStart[1] - barHeight / 2 - (barHeight + barGap) * offsetIndex
    
    return {
      type: 'rect',
      shape: {
        x: Math.min(pointStart[0], pointEnd[0]),
        y: yPosition,
        width: Math.abs(pointEnd[0] - pointStart[0]),
        height: barHeight
      },
      style: {
        fill: color
      }
    }
  }

  const series = []
  
  if (normalData.length > 0) {
    series.push({
      name: '正常工时',
      type: 'custom',
      renderItem: renderItem('#67C23A', 0),
      data: normalData,
      itemStyle: {
        color: '#67C23A'
      }
    })
  }
  
  if (ot1Data.length > 0) {
    series.push({
      name: 'OH1 加班',
      type: 'custom',
      renderItem: renderItem('#FF9900', 1),
      data: ot1Data,
      itemStyle: {
        color: '#FF9900'
      }
    })
  }
  
  if (ot2Data.length > 0) {
    series.push({
      name: 'OH2 加班',
      type: 'custom',
      renderItem: renderItem('#F56C6C', 2),
      data: ot2Data,
      itemStyle: {
        color: '#F56C6C'
      }
    })
  }

  return {
    title: {
      text: '个人每日工时明细',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.value && params.value.length >= 3) {
          const dateIdx = params.value[2]
          const date = dates[dateIdx]
          const start = formatMinutesToTime(params.value[0])
          const end = formatMinutesToTime(params.value[1])
          return `${date}日<br/>${params.seriesName}: ${start} - ${end}`
        }
        return params.seriesName
      }
    },
    legend: {
      data: ['正常工时', 'OH1 加班', 'OH2 加班'],
      top: 40,
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      top: 80,
      left: 80,
      right: 30,
      bottom: 50
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 1440,
      interval: 180,
      axisLabel: {
        formatter: (value) => formatMinutesToTime(value)
      },
      name: '时间'
    },
    yAxis: {
      type: 'category',
      data: dates.map(d => `${d}日`),
      axisLabel: {
        interval: 0
      },
      name: '日期'
    },
    series: series
  }
}

export const getPunchTrendChartOption = (employee) => {
  const dateMap = {}
  
  employee.rawPunches?.forEach(punch => {
    if (!dateMap[punch.date]) {
      dateMap[punch.date] = {
        onDuty: null,
        offDuty: null
      }
    }
    if (punch.time.length > 0) {
      if (!dateMap[punch.date].onDuty) {
        dateMap[punch.date].onDuty = punch.time[0]
      }
      dateMap[punch.date].offDuty = punch.time[punch.time.length - 1]
    }
  })

  const dates = Object.keys(dateMap).sort((a, b) => a - b)
  
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }
  
  const formatMinutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = Math.floor(minutes % 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return {
    title: {
      text: '上下班打卡时间趋势',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = params[0].name + '<br/>'
        params.forEach(param => {
          if (param.value != null) {
            result += `${param.marker}${param.seriesName}: ${formatMinutesToTime(param.value)}<br/>`
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
      left: 50,
      right: 30,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: dates.map(d => `${d}日`)
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1440,
      interval: 180,
      axisLabel: {
        formatter: (value) => formatMinutesToTime(value)
      }
    },
    series: [
      {
        name: '上班时间',
        type: 'line',
        data: dates.map(date => timeToMinutes(dateMap[date]?.onDuty)),
        itemStyle: {
          color: '#67C23A'
        },
        markLine: {
          data: [
            { yAxis: 480, name: '标准上班时间', lineStyle: { color: '#67C23A', type: 'dashed' } }
          ]
        }
      },
      {
        name: '下班时间',
        type: 'line',
        data: dates.map(date => timeToMinutes(dateMap[date]?.offDuty)),
        itemStyle: {
          color: '#F56C6C'
        },
        markLine: {
          data: [
            { yAxis: 1080, name: '标准下班时间', lineStyle: { color: '#F56C6C', type: 'dashed' } }
          ]
        }
      }
    ]
  }
}
