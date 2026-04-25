/**
 * 解析Excel表头中的日期单元格
 * @param {string} cellValue - 单元格的值（如 "1日" 或 "一"）
 * @param {Object} dateCells - 已解析的日期单元格映射
 * @param {number} colIndex - 当前列索引
 * @returns {Object|null} 包含 day 和 weekday 的对象，或 null
 */
export const parseDateRow = (cellValue, dateCells, colIndex) => {
  // 尝试匹配日期数字（如 "1日" 中的 "1"）
  const dayMatch = cellValue.match(/^(\d+)/)
  
  // 星期映射表
  const weekdayMap = {
    '日': 0,
    '一': 1,
    '二': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6
  }
  let day = null
  let weekday = null
  
  // 如果匹配到日期数字
  if (dayMatch) {
    day = parseInt(dayMatch[1])
  } else if (weekdayMap.hasOwnProperty(cellValue)) {
    // 如果只有星期，默认为1号
    day = 1
    weekday = weekdayMap[cellValue]
  }
  
  if (day !== null) {
    // 根据前一列的日期推算当前日期（处理连续日期）
    const prevCol = colIndex - 1
    if (dateCells[prevCol] && dateCells[prevCol].day !== undefined) {
      day = dateCells[prevCol].day + 1
      // 推算星期
      if (dateCells[prevCol].weekday !== undefined && weekday === null) {
        weekday = (dateCells[prevCol].weekday + 1) % 7
      }
    }
    
    // 尝试从单元格值末尾提取星期（如 "1日一" 中的 "一"）
    if (weekday === null) {
      const charMatch = cellValue.match(/[日一二三四五六]$/)
      if (charMatch && weekdayMap.hasOwnProperty(charMatch[0])) {
        weekday = weekdayMap[charMatch[0]]
      }
    }
    
    return { day, weekday }
  }
  
  return null
}

/**
 * 格式化星期显示
 * @param {number} weekday - 星期数字（0-6）
 * @returns {string} 格式化后的星期字符串（如 "(一)"）
 */
export const formatWeekday = (weekday) => {
  const weekdayMap = ['日', '一', '二', '三', '四', '五', '六']
  return weekday !== undefined ? `(${weekdayMap[weekday]})` : ''
}
