import './assets/tailwind.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadLocalFonts } from './utils/localFonts'
import AuthGate from './components/auth/AuthGate.vue'

async function bootstrap() {
  // 關鍵：先載入/註冊本地字體，再 mount
  // 這樣 Editor 的 <select> 初次渲染就能找到已儲存的本地字體 value，避免被 Vue 重設成第一個 option（看起來像「字體消失」）
  await loadLocalFonts()

  const app = createApp(App)
  app.component('AuthGate', AuthGate)
  app.use(router)
  app.mount('#app')
}

void bootstrap()
