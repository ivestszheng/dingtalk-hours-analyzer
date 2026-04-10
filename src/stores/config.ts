import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore(
  'config',
  () => {
    const STD_START_TIME = ref('08:00')
    const STD_END_TIME = ref('18:00')
    const STD_HOURS_PER_DAY = ref(10)
    const DEDUPLICATE_THRESHOLD = ref(10)
    const OT1_START_TIME = ref('18:00')
    const OT1_END_TIME = ref('22:00')
    const OT2_START_TIME = ref('22:00')
    const OT2_END_TIME = ref('08:00')
    const LATE_CHECK_THRESHOLD = ref('10:00')
    const RATE_OH1 = ref(20)
    const RATE_OH2 = ref(30)

    const resetConfig = () => {
      STD_START_TIME.value = '08:00'
      STD_END_TIME.value = '18:00'
      STD_HOURS_PER_DAY.value = 10
      DEDUPLICATE_THRESHOLD.value = 10
      OT1_START_TIME.value = '18:00'
      OT1_END_TIME.value = '22:00'
      OT2_START_TIME.value = '22:00'
      OT2_END_TIME.value = '08:00'
      LATE_CHECK_THRESHOLD.value = '10:00'
      RATE_OH1.value = 20
      RATE_OH2.value = 30
    }

    return {
      STD_START_TIME,
      STD_END_TIME,
      STD_HOURS_PER_DAY,
      DEDUPLICATE_THRESHOLD,
      OT1_START_TIME,
      OT1_END_TIME,
      OT2_START_TIME,
      OT2_END_TIME,
      LATE_CHECK_THRESHOLD,
      RATE_OH1,
      RATE_OH2,
      resetConfig
    }
  },
  {
    persist: true
  }
)
