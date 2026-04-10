import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/Index/index.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: Index
  }
]

const router = createRouter({
  history: createWebHistory('/dingtalk-hours-analyzer/'),
  routes
})

export default router
