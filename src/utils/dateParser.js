export const parseDateRow = (cellValue, dateCells, colIndex) => {
  const dayMatch = cellValue.match(/^(\d+)/)
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
  
  if (dayMatch) {
    day = parseInt(dayMatch[1])
  } else if (weekdayMap.hasOwnProperty(cellValue)) {
    day = 1
    weekday = weekdayMap[cellValue]
  }
  
  if (day !== null) {
    const prevCol = colIndex - 1
    if (dateCells[prevCol] && dateCells[prevCol].day !== undefined) {
      day = dateCells[prevCol].day + 1
      if (dateCells[prevCol].weekday !== undefined && weekday === null) {
        weekday = (dateCells[prevCol].weekday + 1) % 7
      }
    }
    
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

export const formatWeekday = (weekday) => {
  const weekdayMap = ['日', '一', '二', '三', '四', '五', '六']
  return weekday !== undefined ? `(${weekdayMap[weekday]})` : ''
}
