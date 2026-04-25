import { useConfigStore } from '@/stores/config'
import { analyzeEmployeeShifts } from '@/utils/shiftProcessor'

/**
 * 处理员工考勤数据，计算工时和薪资
 * @param {Object} employee - 员工原始数据对象
 * @returns {Object} 包含计算结果的员工数据对象
 */
export const processEmployeeData = (employee) => {
  // 获取全局配置
  const config = useConfigStore()
  
  // 分析员工班次，识别跨天班次、去重打卡记录等
  const analysis = analyzeEmployeeShifts(employee, config)

  // 初始化结果对象
  const result = {
    ...employee,
    processedShifts: analysis.shifts,      // 处理后的班次数组
    dailyRecords: analysis.dailyRecords,   // 按日期组织的详情记录
    logicTags: [],                         // 算法处理标签
    totalActualHours: 0,                   // 实际总工时
    normalHours: 0,                        // 正常工时（08:00-18:00）
    overtimeHoursOH1: 0,                   // 加班时段一（18:00-22:00）
    overtimeHoursOH2: 0,                   // 加班时段二（22:00之后）
    missingNormalHours: 0,                 // 缺卡正常工时
    netOvertimeOH1: 0,                     // 净加班时段一（扣除缺卡后）
    overtimeWage: 0                        // 加班总薪资
  }

  // 累加所有班次的工时（分钟转小时）
  analysis.shifts.forEach((shift) => {
    result.normalHours += shift.normalMinutes / 60
    result.overtimeHoursOH1 += shift.overtimeMinutesOH1 / 60
    result.overtimeHoursOH2 += shift.overtimeMinutesOH2 / 60
    result.missingNormalHours += shift.missingNormalMinutes / 60
  })

  // 计算总工时
  result.totalActualHours = result.normalHours + result.overtimeHoursOH1 + result.overtimeHoursOH2
  
  // 计算净加班时段一：原始加班时段一 - 缺卡正常工时，最小为0
  result.netOvertimeOH1 = Math.max(0, result.overtimeHoursOH1 - result.missingNormalHours)
  
  // 计算加班总薪资：净加班时段一 × OH1费率 + 加班时段二 × OH2费率
  result.overtimeWage = (result.netOvertimeOH1 * config.RATE_OH1) + (result.overtimeHoursOH2 * config.RATE_OH2)
  
  // 收集所有班次的算法处理标签并去重
  result.logicTags = [...new Set(analysis.shifts.flatMap(shift => shift.tags))]

  return result
}
