import { analyzeEmployeeShifts } from '@/utils/shiftProcessor'

export const generateDetailData = (employee, config) => {
  if (!employee) return []

  if (Array.isArray(employee.dailyRecords) && employee.dailyRecords.length > 0) {
    return employee.dailyRecords
  }

  return analyzeEmployeeShifts(employee, config).dailyRecords
}
