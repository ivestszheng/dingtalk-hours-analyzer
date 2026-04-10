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
      name: '金额（元）'
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
      dateMap[punch.date].totalOvertime += emp.overtimeHoursOH1 + emp.overtimeHoursOH2
      if (punch.time.length > 0) {
        dateMap[punch.date].offDutyTimes.push(punch.time[punch.time.length - 1])
      }
    })
  })

  const dates = Object.keys(dateMap).sort((a, b) => a - b)
  const totalOvertime = dates.map(date => dateMap[date].totalOvertime)
  const avgOffDuty = dates.map(date => {
    const times = dateMap[date].offDutyTimes
    if (times.length === 0) return null
    const totalMinutes = times.reduce((sum, time) => {
      const [h, m] = time.split(':').map(Number)
      return sum + h * 60 + m
    }, 0)
    const avgMinutes = totalMinutes / times.length
    const avgHours = Math.floor(avgMinutes / 60)
    const avgMins = avgMinutes % 60
    return `${String(avgHours).padStart(2, '0')}:${String(avgMins).padStart(2, '0')}`
  })

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
          } else {
            result += `${param.marker}${param.seriesName}: ${param.value}<br/>`
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
        type: 'category',
        name: '时间',
        position: 'right',
        data: ['00:00', '06:00', '12:00', '18:00', '24:00']
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
        data: avgOffDuty,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
}

export const getEmployeeLoadChartOption = (data) => {
  return {
    title: {
      text: '员工负荷',
      left: 'center',
      top: 10
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.data.employeeName}<br/>实际总工时: ${formatNumber(params.data[0])}<br/>加班薪资: ${formatNumber(params.data[1])} 元`
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
      name: '实际总工时（小时）'
    },
    yAxis: {
      type: 'value',
      name: '加班薪资（元）'
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
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
}

export const getMonthlyCompositionChartOption = (employee) => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
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

  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['上班时间', '下班时间']
    },
    xAxis: {
      type: 'category',
      data: dates.map(d => `${d}日`)
    },
    yAxis: {
      type: 'category',
      data: ['00:00', '06:00', '08:00', '12:00', '18:00', '22:00', '24:00']
    },
    series: [
      {
        name: '上班时间',
        type: 'line',
        data: dates.map(date => dateMap[date]?.onDuty || null),
        itemStyle: {
          color: '#67C23A'
        },
        markLine: {
          data: [
            { yAxis: '08:00', name: '标准上班时间' }
          ]
        }
      },
      {
        name: '下班时间',
        type: 'line',
        data: dates.map(date => dateMap[date]?.offDuty || null),
        itemStyle: {
          color: '#F56C6C'
        },
        markLine: {
          data: [
            { yAxis: '18:00', name: '标准下班时间' }
          ]
        }
      }
    ]
  }
}
