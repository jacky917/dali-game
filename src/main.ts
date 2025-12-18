import './assets/tailwind.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initLocalFonts } from './utils/localFonts'

// 自動注入本地字體（src/assets/fonts/**）
initLocalFonts()

const app = createApp(App)
app.use(router)
app.mount('#app')
