<template>
  <div ref="chartRef" class="base-echart" :style="style" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick, onActivated } from 'vue'
import * as echarts from 'echarts'
import 'echarts-gl';
import CUSTOM_THEME from '@/assets/echart-custom-theme'

echarts.registerTheme('custom-theme', CUSTOM_THEME)
const inited = ref(false)

const props = defineProps({
  options: { type: Object, required: true },
  style: { type: Object, default: () => ({ width: '100%', height: '100%' }) },
  autoResize: { type: Boolean, default: true },
  autoSetOption: { type: Boolean, default: true },
  reRenderOnActivated:{ type: Boolean, default: true }
})

const emits = defineEmits(['click','init'])

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
let resizeHandler: (() => void) | null = null
let optionsWatcher: ReturnType<typeof watch> | null = null // 保存watch引用

function debounce(fn: Function, delay = 200) {
  let timer: any = null
  return (...args: any[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

function initChart() {
  disposeChart()
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value, 'custom-theme')
    // 添加对 props.options 的检查
    if (props.autoSetOption && props.options && typeof props.options === 'object') {
      chartInstance.setOption(props.options, false)
    }
    if (props.autoResize) {
      resizeHandler = debounce(resizeChart, 200)
      window.addEventListener('resize', resizeHandler)
    }
    chartInstance.on('click', (params) => {
      emits('click', params)
    })
    inited.value = true
    emits('init', inited.value)
  }
}

function disposeChart() {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  if (optionsWatcher) {
    optionsWatcher() // 取消watch
    optionsWatcher = null
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
    // 只在autoSetOption为true时创建watch
    if (props.autoSetOption) {
      optionsWatcher = watch(() => props.options, (newOptions) => {
        if (chartInstance && newOptions) {
          chartInstance.setOption(newOptions, false)
        }
      }, { deep: true })
    }
  })
})

onBeforeUnmount(() => {
  disposeChart()
})

onActivated(() => {
  if(props.reRenderOnActivated){
    initChart()
  }
})
function resizeChart() {
  if (chartInstance) {
    chartInstance.resize()
  }
}

function getChartInstance() {
  return chartInstance
}

defineExpose({ getChartInstance })
</script> 
<style lang="less" scoped>
.base-echart{
  height: 100%;
}
</style>