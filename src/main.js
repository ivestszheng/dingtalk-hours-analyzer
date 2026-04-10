import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import './style.css'
import 'vxe-table/lib/style.css'
import VxeTable from 'vxe-table'
import VxeUI from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(VxeUI)
app.use(VxeTable)
app.use(ElementPlus)
app.mount('#app')
