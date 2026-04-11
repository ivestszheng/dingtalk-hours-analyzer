<template>
  <div class="app-container">
    <el-container class="main-container">
      <el-header class="app-header flex items-center justify-between gap-3 p-3 sm:px-5">
        <div class="header-left">
          <h1 class="text-lg sm:text-xl text-gray-800 m-0">钉钉工时分析器</h1>
        </div>
        <div class="header-right">
          <div class="sm:hidden">
            <el-button type="primary" circle @click="mobileMenuVisible = true">
              <el-icon><Menu /></el-icon>
            </el-button>
          </div>
          <div class="hidden sm:block">
            <el-space wrap>
              <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls"
                :on-change="handleFileChange">
                <el-button type="primary">
                  <el-icon>
                    <Upload />
                  </el-icon>
                  导入 Excel
                </el-button>
              </el-upload>
              <el-button type="success" :disabled="!hasData" @click="exportToExcel">
                <el-icon>
                  <Download />
                </el-icon>
                导出 Excel
              </el-button>
              <el-button type="warning" @click="downloadTemplate">
                <el-icon>
                  <Download />
                </el-icon>
                下载模版
              </el-button>
              <el-button type="danger" :disabled="!hasData" @click="resetData">
                <el-icon>
                  <Delete />
                </el-icon>
                重置
              </el-button>
            </el-space>
          </div>
        </div>
      </el-header>

      <el-drawer v-model="mobileMenuVisible" title="操作菜单" size="80%" direction="rtl">
        <div class="mobile-menu-content flex flex-col gap-4">
          <div class="menu-upload-wrapper">
            <el-upload ref="mobileUploadRef" :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls"
              :on-change="handleFileChange">
              <el-button type="primary" class="w-full">
                <el-icon><Upload /></el-icon>
                导入 Excel
              </el-button>
            </el-upload>
          </div>
          <el-button type="success" :disabled="!hasData" @click="exportToExcel" class="w-full">
            <el-icon><Download /></el-icon>
            导出 Excel
          </el-button>
          <el-button type="warning" @click="downloadTemplate" class="w-full">
            <el-icon><Download /></el-icon>
            下载模版
          </el-button>
          <el-button type="danger" :disabled="!hasData" @click="resetData" class="w-full">
            <el-icon><Delete /></el-icon>
            重置
          </el-button>
        </div>
      </el-drawer>

      <el-main class="app-main bg-gray-50 overflow-hidden flex flex-col">
        <el-tabs v-model="activeTab" type="border-card" closable @tab-remove="removeTab" class="full-height-tabs flex-1 flex flex-col overflow-hidden">
          <el-tab-pane label="数据列表" name="list" :closable="false" class="flex-1 overflow-auto">
            <div v-if="dateRange || reportTime" class="m-4 sm:m-5 bg-white p-4 sm:p-5 rounded-md">
              <div class="flex flex-col sm:flex-row gap-2 sm:gap-10">
                <div v-if="dateRange" class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 font-medium">统计日期：</span>
                  <span class="text-sm text-gray-900 font-semibold">{{ dateRange }}</span>
                </div>
                <div v-if="reportTime" class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 font-medium">报表生成时间：</span>
                  <span class="text-sm text-gray-900 font-semibold">{{ reportTime }}</span>
                </div>
              </div>
            </div>
            <div class="demo-section m-4 sm:m-5 bg-white p-4 sm:p-5 rounded-md">
              <vxe-table border show-overflow :data="tableData" height="400" class="w-full">
                <vxe-column type="seq" title="序号" width="60"></vxe-column>
                <vxe-column field="employeeName" title="员工姓名" min-width="100"></vxe-column>
                <vxe-column field="attendanceGroup" title="考勤组" min-width="100"></vxe-column>
                <vxe-column field="department" title="部门" min-width="120"></vxe-column>
                <vxe-column field="position" title="职位" min-width="100"></vxe-column>
                <vxe-column field="totalActualHours" title="实际总工时" sortable min-width="100">
                  <template #default="{ row }">
                    {{ formatNumber(row.totalActualHours) }}
                  </template>
                </vxe-column>
                <vxe-column field="normalHours" title="正常工时" sortable min-width="90">
                  <template #default="{ row }">
                    {{ formatNumber(row.normalHours) }}
                  </template>
                </vxe-column>
                <vxe-column field="overtimeHoursOH1" title="加班时段一" sortable min-width="100">
                  <template #default="{ row }">
                    {{ formatNumber(row.overtimeHoursOH1) }}
                  </template>
                </vxe-column>
                <vxe-column field="overtimeHoursOH2" title="加班时段二" sortable min-width="100">
                  <template #default="{ row }">
                    {{ formatNumber(row.overtimeHoursOH2) }}
                  </template>
                </vxe-column>
                <vxe-column field="missingNormalHours" title="缺卡正常工时" sortable min-width="110">
                  <template #default="{ row }">
                    <span :class="{ 'missing-hours': row.missingNormalHours > 0 }">
                      {{ formatNumber(row.missingNormalHours) }}
                    </span>
                  </template>
                </vxe-column>
                <vxe-column field="netOvertimeOH1" title="净加班时段一" sortable min-width="110">
                  <template #default="{ row }">
                    {{ formatNumber(row.netOvertimeOH1) }}
                  </template>
                </vxe-column>
                <vxe-column field="overtimeWage" title="加班总薪资" sortable min-width="100">
                  <template #default="{ row }">
                    {{ formatNumber(row.overtimeWage) }}
                  </template>
                </vxe-column>
                <vxe-column title="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" size="small" @click="viewEmployee(row)">
                      查看
                    </el-button>
                  </template>
                </vxe-column>
              </vxe-table>
            </div>

            <div v-if="hasData" class="demo-section m-4 sm:m-5 bg-white p-4 sm:p-5 rounded-md">
              <div ref="departmentCostChart" class="chart-container w-full h-80 sm:h-96"></div>
            </div>
            <div v-if="hasData" class="demo-section m-4 sm:m-5 bg-white p-4 sm:p-5 rounded-md">
              <div ref="attendanceTrendChart" class="chart-container w-full h-80 sm:h-96"></div>
            </div>
            <div v-if="hasData" class="demo-section m-4 sm:m-5 bg-white p-4 sm:p-5 rounded-md">
              <div ref="employeeLoadChart" class="chart-container w-full h-80 sm:h-96"></div>
            </div>
          </el-tab-pane>

          <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.title" :name="tab.name" class="flex-1 overflow-auto">
            <keep-alive>
              <EmployeeDetail :employee-data="tab.employeeData" />
            </keep-alive>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <el-button class="config-btn fixed right-5 sm:right-8 top-1/2 -translate-y-1/2 z-50" :icon="Setting" type="info" circle @click="drawerVisible = true" />

    <el-drawer v-model="drawerVisible" title="全局配置" size="90% sm:450px" direction="rtl">
      <el-form :model="configStore" label-width="160px">
        <el-form-item label="标准上班时刻">
          <el-input v-model="configStore.STD_START_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="标准下班时刻">
          <el-input v-model="configStore.STD_END_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="标准工时时长">
          <el-input-number v-model="configStore.STD_HOURS_PER_DAY" :min="1" :max="24" />
        </el-form-item>
        <el-form-item label="打卡去重阈值(分钟)">
          <el-input-number v-model="configStore.DEDUPLICATE_THRESHOLD" :min="1" :max="60" />
        </el-form-item>
        <el-form-item label="加班一时段起点">
          <el-input v-model="configStore.OT1_START_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="加班一时段终点">
          <el-input v-model="configStore.OT1_END_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="加班二时段起点">
          <el-input v-model="configStore.OT2_START_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="加班二时段终点">
          <el-input v-model="configStore.OT2_END_TIME" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="缺卡判定阈值">
          <el-input v-model="configStore.LATE_CHECK_THRESHOLD" placeholder="HH:mm" />
        </el-form-item>
        <el-form-item label="OH1 薪资费率(元/小时)">
          <el-input-number v-model="configStore.RATE_OH1" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="OH2 薪资费率(元/小时)">
          <el-input-number v-model="configStore.RATE_OH2" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存</el-button>
          <el-button @click="configStore.resetConfig">恢复默认</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import ExcelJS from 'exceljs'
import { ElMessage } from 'element-plus'
import { Download, Upload, Delete, Setting, Menu } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import EmployeeDetail from '@/pages/EmployeeDetail/index.vue'
import { processEmployeeData } from '@/utils/calculator'
import { parseDateRow } from '@/utils/dateParser'
import {
  getDepartmentCostChartOption,
  getAttendanceTrendChartOption,
  getEmployeeLoadChartOption
} from '@/utils/chartOptions'

const configStore = useConfigStore()
const drawerVisible = ref(false)
const mobileMenuVisible = ref(false)
const activeTab = ref('list')
const tabs = ref([])
let tabCounter = 0

const departmentCostChart = ref(null)
const attendanceTrendChart = ref(null)
const employeeLoadChart = ref(null)
const uploadRef = ref(null)
const mobileUploadRef = ref(null)
let departmentCostChartInstance = null
let attendanceTrendChartInstance = null
let employeeLoadChartInstance = null

const tableData = ref([])
const employeeDataStore = ref([])
const dateRange = ref('')
const reportTime = ref('')
const startDate = ref(null)
const endDate = ref(null)
const selectedDateRange = ref(null)

const parseDateRange = (dateStr) => {
  if (!dateStr) return
  const match = dateStr.match(/(\d{4}-\d{2}-\d{2})\s*至\s*(\d{4}-\d{2}-\d{2})/)
  if (match) {
    startDate.value = match[1]
    endDate.value = match[2]
    selectedDateRange.value = [match[1], match[2]]
  }
}

const saveConfig = () => {
  drawerVisible.value = false
  ElMessage.success('全局配置保存成功！')
}

const viewEmployee = (row) => {
  const employeeData = employeeDataStore.value.find(e => e.employeeName === row.employeeName)
  if (employeeData) {
    tabCounter++
    const tabName = `detail-${tabCounter}`
    tabs.value.push({
      name: tabName,
      title: employeeData.employeeName,
      employeeData: employeeData
    })
    activeTab.value = tabName
  }
}

const removeTab = (tabName) => {
  const index = tabs.value.findIndex(tab => tab.name === tabName)
  if (index > -1) {
    tabs.value.splice(index, 1)
    if (activeTab.value === tabName) {
      activeTab.value = tabs.value.length > 0 ? tabs.value[tabs.value.length - 1].name : 'list'
    }
  }
}

const hasData = computed(() => tableData.value.length > 0)

const formatNumber = (num) => {
  if (num == null || num === undefined) return ''
  if (num === 0) return '0'
  if (Number.isInteger(num)) return num.toString()
  return num.toFixed(2)
}

const initAllCharts = () => {
  if (departmentCostChart.value) {
    if (departmentCostChartInstance) {
      departmentCostChartInstance.dispose()
    }
    departmentCostChartInstance = echarts.init(departmentCostChart.value)
    const option = getDepartmentCostChartOption(tableData.value)
    departmentCostChartInstance.setOption(option)
  }

  if (attendanceTrendChart.value) {
    if (attendanceTrendChartInstance) {
      attendanceTrendChartInstance.dispose()
    }
    attendanceTrendChartInstance = echarts.init(attendanceTrendChart.value)
    const option = getAttendanceTrendChartOption(employeeDataStore.value)
    attendanceTrendChartInstance.setOption(option)
  }

  if (employeeLoadChart.value) {
    if (employeeLoadChartInstance) {
      employeeLoadChartInstance.dispose()
    }
    employeeLoadChartInstance = echarts.init(employeeLoadChart.value)
    const option = getEmployeeLoadChartOption(tableData.value)
    employeeLoadChartInstance.setOption(option)
  }
}

const updateAllCharts = () => {
  if (departmentCostChartInstance) {
    const option = getDepartmentCostChartOption(tableData.value)
    departmentCostChartInstance.setOption(option)
  }

  if (attendanceTrendChartInstance) {
    const option = getAttendanceTrendChartOption(employeeDataStore.value)
    attendanceTrendChartInstance.setOption(option)
  }

  if (employeeLoadChartInstance) {
    const option = getEmployeeLoadChartOption(tableData.value)
    employeeLoadChartInstance.setOption(option)
  }
}

const handleFileChange = async (file) => {
  mobileMenuVisible.value = false
  try {
    const arrayBuffer = await file.raw.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.worksheets[0]
    const employeeData = []

    dateRange.value = ''
    reportTime.value = ''
    let month = ''

    const headers = {}
    const dateCells = {}

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        const cellValue = row.getCell(1).value
        if (cellValue) {
          const match = cellValue.match(/：(.+)$/)
          if (match) {
            dateRange.value = match[1]
            const monthMatch = cellValue.match(/(\d+)月/)
            if (monthMatch) {
              month = monthMatch[1]
            }
          }
        }
      } else if (rowNumber === 2) {
        const cellValue = row.getCell(1).value
        if (cellValue) {
          const match = cellValue.match(/：(.+)$/)
          if (match) {
            reportTime.value = match[1]
          }
        }
      } else if (rowNumber === 3) {
        row.eachCell((cell, colIndex) => {
          const cellValue = cell.value
          if (cellValue) {
            switch (cellValue) {
              case '姓名':
                headers.name = colIndex
                break
              case '考勤组':
                headers.attendanceGroup = colIndex
                break
              case '部门':
                headers.department = colIndex
                break
              case '工号':
                headers.employeeId = colIndex
                break
              case '职位':
                headers.position = colIndex
                break
              case '打卡时间':
                headers.punchTime = colIndex
                break
            }
          }
        })
      } else if (rowNumber === 4) {
        row.eachCell((cell, colIndex) => {
          if (colIndex >= 7) {
            const cellValue = cell.value
            if (cellValue) {
              const dateInfo = parseDateRow(cellValue, dateCells, colIndex)
              if (dateInfo) {
                dateCells[colIndex] = dateInfo
              }
            }
          }
        })
      } else if (rowNumber >= 5) {
        const name = headers.name ? row.getCell(headers.name).value : null
        if (name) {
          let department = headers.department ? row.getCell(headers.department).value || '' : ''
          if (typeof department === 'string') {
            department = department.split('\n').map(s => s.trim()).filter(Boolean)
          }

          const employee = {
            employeeName: name,
            department: department,
            employeeId: headers.employeeId ? row.getCell(headers.employeeId).value || '' : '',
            position: headers.position ? row.getCell(headers.position).value || '' : '',
            attendanceGroup: headers.attendanceGroup ? row.getCell(headers.attendanceGroup).value || '' : '',
            totalActualHours: 0,
            normalHours: 0,
            overtimeHoursOH1: 0,
            overtimeHoursOH2: 0,
            missingNormalHours: 0,
            netOvertimeOH1: 0,
            overtimeWage: 0,
            rawPunches: [],
            logicTags: []
          }

          Object.keys(dateCells).forEach(colIndexStr => {
            const colIndex = parseInt(colIndexStr)
            const punchTime = row.getCell(colIndex).value
            const dateInfo = dateCells[colIndex]
            if (punchTime && dateInfo) {
              let times = punchTime
              if (typeof times === 'string') {
                times = times.split('\n').map(s => s.trim()).filter(Boolean)
              }
              if (!Array.isArray(times)) {
                times = [times]
              }
              employee.rawPunches.push({
                date: dateInfo.day,
                weekday: dateInfo.weekday,
                time: times
              })
            }
          })

          employeeData.push(employee)
        }
      }
    })

    const processedData = employeeData.map(emp => processEmployeeData(emp))
    employeeDataStore.value = processedData

    const importedData = processedData.map(emp => ({
      employeeName: emp.employeeName,
      attendanceGroup: emp.attendanceGroup,
      department: emp.department,
      position: emp.position,
      totalActualHours: emp.totalActualHours,
      normalHours: emp.normalHours,
      overtimeHoursOH1: emp.overtimeHoursOH1,
      overtimeHoursOH2: emp.overtimeHoursOH2,
      missingNormalHours: emp.missingNormalHours,
      netOvertimeOH1: emp.netOvertimeOH1,
      overtimeWage: emp.overtimeWage,
      rawPunches: emp.rawPunches,
      logicTags: emp.logicTags
    }))

    console.log('员工数据:', processedData)

    if (importedData.length > 0) {
      tableData.value = importedData
      parseDateRange(dateRange.value)
      ElMessage.success(`成功导入 ${importedData.length} 条数据！`)
      setTimeout(() => {
        initAllCharts()
      }, 0)
    } else {
      ElMessage.warning('未找到有效数据')
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('Excel 导入失败，请检查文件格式')
  }

  uploadRef.value?.clearFiles()
  mobileUploadRef.value?.clearFiles()
}

const exportToExcel = async () => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('工时数据')

    worksheet.columns = [
      { header: '序号', key: 'seq', width: 8 },
      { header: '员工姓名', key: 'employeeName', width: 15 },
      { header: '考勤组', key: 'attendanceGroup', width: 15 },
      { header: '部门', key: 'department', width: 20 },
      { header: '职位', key: 'position', width: 15 },
      { header: '实际总工时', key: 'totalActualHours', width: 15 },
      { header: '正常工时', key: 'normalHours', width: 12 },
      { header: '加班时段一', key: 'overtimeHoursOH1', width: 12 },
      { header: '加班时段二', key: 'overtimeHoursOH2', width: 12 },
      { header: '缺卡正常工时', key: 'missingNormalHours', width: 15 },
      { header: '净加班时段一', key: 'netOvertimeOH1', width: 15 },
      { header: '加班总薪资', key: 'overtimeWage', width: 15 }
    ]

    tableData.value.forEach((item, index) => {
      worksheet.addRow({
        seq: index + 1,
        employeeName: item.employeeName,
        attendanceGroup: item.attendanceGroup,
        department: Array.isArray(item.department) ? item.department.join(',') : item.department,
        position: item.position,
        totalActualHours: item.totalActualHours,
        normalHours: item.normalHours,
        overtimeHoursOH1: item.overtimeHoursOH1,
        overtimeHoursOH2: item.overtimeHoursOH2,
        missingNormalHours: item.missingNormalHours,
        netOvertimeOH1: item.netOvertimeOH1,
        overtimeWage: item.overtimeWage
      })
    })

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF409EFF' }
    }
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `工时数据_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('Excel 导出成功！')
  } catch (error) {
    console.error(error)
    ElMessage.error('Excel 导出失败！')
  }
}

const downloadTemplate = () => {
  mobileMenuVisible.value = false
  const link = document.createElement('a')
  link.href = '/example.xlsx'
  link.download = '工时数据模版.xlsx'
  link.click()
  ElMessage.success('模版下载成功！')
}

const resetData = () => {
  mobileMenuVisible.value = false
  tableData.value = []
  employeeDataStore.value = []
  tabs.value = []
  activeTab.value = 'list'
  dateRange.value = ''
  reportTime.value = ''
  ElMessage.success('数据已清空！')
}

onMounted(() => {
  window.addEventListener('resize', () => {
    departmentCostChartInstance?.resize()
    attendanceTrendChartInstance?.resize()
    employeeLoadChartInstance?.resize()
  })
})

watch(hasData, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      initAllCharts()
    }, 0)
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.main-container {
  height: 100%;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  height: auto !important;
  min-height: 64px;
}

.app-main {
  background: #f5f7fa;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.full-height-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.full-height-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.demo-section {
  background: #fff;
  border-radius: 4px;
}

.demo-section h2 {
  color: #555;
  margin-bottom: 15px;
  margin-top: 0;
}

.chart-container {
  width: 100%;
}

.missing-hours {
  color: #f56c6c;
  font-weight: 500;
}

.config-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1000;
}

.mobile-menu-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-upload-wrapper {
  width: 100%;
}

.menu-upload-wrapper :deep(.el-upload) {
  width: 100%;
}

.menu-upload-wrapper :deep(.el-button) {
  width: 100%;
  margin-left: 0 !important;
}

.mobile-menu-content :deep(.el-button) {
  margin-left: 0 !important;
}
</style>
