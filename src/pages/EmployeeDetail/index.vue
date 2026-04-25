<template>
  <el-card class="employee-detail">
    <template #header>
      <div class="detail-header">
        <h2>{{ currentEmployee?.employeeName }} - 详情</h2>
      </div>
    </template>
    
    <vxe-table
      border
      :data="detailData"
      height="500"
    >
      <vxe-column title="日期" width="150">
        <template #default="{ row }">
          {{ row.date }} {{ row.weekday }}
        </template>
      </vxe-column>
      <vxe-column field="raw" title="原始打卡流水" width="200">
        <template #default="{ row }">
          <div v-if="row.raw && row.raw.length">
            <div v-for="(time, idx) in row.raw" :key="idx" class="punch-time">
              {{ time }}
            </div>
          </div>
        </template>
      </vxe-column>
      <vxe-column field="logic" title="算法处理逻辑" width="350">
        <template #default="{ row }">
          <div v-if="row.logic && row.logic.length">
            <div v-for="(tag, idx) in row.logic" :key="idx" class="logic-tag">
              {{ tag }}
            </div>
          </div>
        </template>
      </vxe-column>
      <vxe-column field="result" title="最终有效上下班" width="200">
        <template #default="{ row }">
          <div v-if="row.result">
            <div class="result-item">
              <span class="on-duty" v-if="row.result.onDuty">🟢 {{ row.result.onDuty }}</span>
              <span class="off-duty" v-if="row.result.offDuty">🔴 {{ row.result.offDuty }}</span>
              <span v-if="!row.result.onDuty && !row.result.offDuty">⚪ --</span>
            </div>
          </div>
        </template>
      </vxe-column>
    </vxe-table>
    
    <div v-if="currentEmployee" class="charts-section">
      <div class="chart-item">
        <div ref="dailyWorkDetailChart" class="chart-container"></div>
      </div>
      <div class="chart-item">
        <div ref="monthlyCompositionChart" class="chart-container"></div>
      </div>
      <div class="chart-item">
        <div ref="punchTrendChart" class="chart-container"></div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { formatWeekday } from '@/utils/dateParser'
import { generateDetailData } from '@/utils/employeeDetail'
import { useConfigStore } from '@/stores/config'
import {
  getDailyWorkDetailChartOption,
  getMonthlyCompositionChartOption,
  getPunchTrendChartOption
} from '@/utils/chartOptions'

const props = defineProps({
  employeeData: {
    type: Object,
    default: () => null
  }
})

const configStore = useConfigStore()
const currentEmployee = computed(() => props.employeeData)
const dailyWorkDetailChart = ref(null)
const monthlyCompositionChart = ref(null)
const punchTrendChart = ref(null)
let dailyWorkDetailChartInstance = null
let monthlyCompositionChartInstance = null
let punchTrendChartInstance = null

const detailData = computed(() => {
  if (!currentEmployee.value) return []
  
  const data = generateDetailData(currentEmployee.value, configStore)
  const monthPrefix = currentEmployee.value.reportMonth
    ? `${String(currentEmployee.value.reportMonth).padStart(2, '0')}/`
    : ''
  
  return data.map(item => ({
    date: `${monthPrefix}${String(item.date).padStart(2, '0')}`,
    weekday: formatWeekday(item.weekday),
    raw: item.raw,
    logic: item.logic,
    result: item.result
  }))
})

const initEmployeeCharts = () => {
  if (!currentEmployee.value) return
  
  if (dailyWorkDetailChart.value) {
    if (dailyWorkDetailChartInstance) {
      dailyWorkDetailChartInstance.dispose()
    }
    dailyWorkDetailChartInstance = echarts.init(dailyWorkDetailChart.value)
    const option = getDailyWorkDetailChartOption(currentEmployee.value, configStore)
    dailyWorkDetailChartInstance.setOption(option)
  }
  
  if (monthlyCompositionChart.value) {
    if (monthlyCompositionChartInstance) {
      monthlyCompositionChartInstance.dispose()
    }
    monthlyCompositionChartInstance = echarts.init(monthlyCompositionChart.value)
    const option = getMonthlyCompositionChartOption(currentEmployee.value)
    monthlyCompositionChartInstance.setOption(option)
  }
  
  if (punchTrendChart.value) {
    if (punchTrendChartInstance) {
      punchTrendChartInstance.dispose()
    }
    punchTrendChartInstance = echarts.init(punchTrendChart.value)
    const option = getPunchTrendChartOption(currentEmployee.value, configStore)
    punchTrendChartInstance.setOption(option)
  }
}

watch(currentEmployee, () => {
  nextTick(() => {
    initEmployeeCharts()
  })
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    initEmployeeCharts()
  })
  window.addEventListener('resize', () => {
    dailyWorkDetailChartInstance?.resize()
    monthlyCompositionChartInstance?.resize()
    punchTrendChartInstance?.resize()
  })
})
</script>

<style scoped>
.employee-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-header h2 {
  margin: 0;
  color: #333;
}

.punch-time {
  font-family: monospace;
  color: #666;
  padding: 2px 0;
}

.logic-tag {
  color: #409EFF;
  padding: 2px 0;
  font-size: 13px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.on-duty, .off-duty {
  font-family: monospace;
}

.charts-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-item {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
