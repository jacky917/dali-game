<template>
  <div class="login-page">
    <div class="login-container">
      <div class="glass-card login-card">
        <div class="card-inner">
          <div class="card-header">
            <div class="icon-wrapper" :class="{ unlocked, failed }">
              <svg class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <!-- shackle -->
                <path
                  class="lock-shackle"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8 11V7a4 4 0 118 0v4"
                />
                <!-- body -->
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
                />
                <!-- keyhole -->
                <path class="lock-keyhole" stroke-linecap="round" stroke-linejoin="round" d="M12 15v2" />
              </svg>
            </div>
            <div class="title-block">
              <p class="eyebrow">LOGIN</p>
              <div class="title-row">
                <h1>網頁小遊戲</h1>
                <label class="remember-mini" aria-label="記住我">
                  <span class="remember-mini-text">記住我</span>
                  <input v-model="rememberPassword" type="checkbox" class="remember-mini-switch" />
                </label>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleLogin" class="form-body">
            <div class="input-wrap">
              <div class="input-inner">
                <input
                    v-model="password"
                    type="password"
                    class="password-input"
                    placeholder="輸入訪問密碼"
                    :class="{ 'error': errorMessage }"
                    :autocomplete="rememberPassword ? 'current-password' : 'off'"
                />
                <div class="indicator-wrapper">
                  <span class="indicator-dot" :class="password.length > 0 ? 'active' : 'inactive'"></span>
                </div>
              </div>
            </div>

            <button
                type="submit"
                :class="['btn-submit', isLoggedIn && !unlocked ? 'btn-logout' : 'btn-login']"
                :disabled="unlocked || (!password && !isLoggedIn)"
            >
              {{ isLoggedIn && !unlocked ? '登出' : 'LOGIN' }}
            </button>
          </form>
        </div>
      </div>

      <p class="footer-text">Protected System &copy; 2025</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const password = ref('')
const errorMessage = ref('')
const { login, logout, isLoggedIn } = useAuth()
const unlocked = ref(false)
const failed = ref(false)
let failTimer: number | null = null

const REMEMBER_KEY = 'dali-remember-password'
const PASSWORD_KEY = 'dali-remembered-password'
const rememberPassword = ref(false)

function clearFailTimer() {
  if (failTimer) window.clearTimeout(failTimer)
  failTimer = null
}

function triggerFailed() {
  clearFailTimer()
  // 重新觸發動畫（連續輸錯也會再播）
  failed.value = false
  window.requestAnimationFrame(() => {
    failed.value = true
    failTimer = window.setTimeout(() => {
      failed.value = false
      failTimer = null
    }, 700)
  })
}

function loadRememberedPassword() {
  try {
    rememberPassword.value = localStorage.getItem(REMEMBER_KEY) === '1'
    if (rememberPassword.value) {
      password.value = localStorage.getItem(PASSWORD_KEY) || ''
    } else {
      password.value = ''
      localStorage.removeItem(PASSWORD_KEY)
    }
  } catch {
    rememberPassword.value = false
    password.value = ''
  }
}

onMounted(() => {
  loadRememberedPassword()
})

watch(
  rememberPassword,
  (v) => {
    try {
      localStorage.setItem(REMEMBER_KEY, v ? '1' : '0')
      if (!v) {
        localStorage.removeItem(PASSWORD_KEY)
        password.value = ''
      } else {
        localStorage.setItem(PASSWORD_KEY, password.value || '')
      }
    } catch {
      // ignore
    }
  },
  { immediate: false }
)

watch(
  password,
  (v) => {
    if (!rememberPassword.value) return
    try {
      localStorage.setItem(PASSWORD_KEY, v || '')
    } catch {
      // ignore
    }
  },
  { immediate: false }
)

const handleLogin = () => {
  errorMessage.value = ''
  setTimeout(() => {
    if (isLoggedIn.value) {
      logout()
      password.value = ''
      unlocked.value = false
      failed.value = false
      clearFailTimer()
      try {
        if (!rememberPassword.value) localStorage.removeItem(PASSWORD_KEY)
      } catch {
        // ignore
      }
      return
    }
    if (!password.value) {
      errorMessage.value = '請輸入密碼'
      unlocked.value = false
      failed.value = false
      clearFailTimer()
      return
    }
    const success = login(password.value)
    if (success) {
      failed.value = false
      clearFailTimer()
      unlocked.value = true
      if (!rememberPassword.value) {
        password.value = ''
        try { localStorage.removeItem(PASSWORD_KEY) } catch { /* ignore */ }
      }
      // 先播放「鎖頭打開」動畫再跳轉，確保看得到
      setTimeout(() => {
        router.push('/home')
      }, 550)
    } else {
      errorMessage.value = '密碼錯誤'
      password.value = ''
      unlocked.value = false
      triggerFailed()
    }
  }, 300)
}
</script>

<style scoped>
/* [關鍵修正]
  引入主 CSS 檔案作為參考，解決 @apply 報錯問題。
  請確保路徑正確指向你的 src/assets/main.css
*/
@reference "../assets/main.css";

.login-page {
  /* Login 頁面在 AppLayout 內（上方有 NavBar），避免用 min-h-screen 造成超出產生滾輪 */
  @apply w-full h-full flex items-center justify-center font-sans px-4;
  min-height: 100vh;
  overflow: hidden;
  overscroll-behavior: none;
}

.login-container {
  @apply w-full max-w-4xl px-3 md:px-8 relative z-10;
  /* 更符合慣例的閱讀位置：略往上，不嚴格垂直置中 */
  transform: translateY(clamp(-56px, -6vh, -18px));
}

.login-card {
  @apply max-w-xl mx-auto p-10 md:p-12;
}

.card-inner {
  /* 讓 header / form 同寬同對齊（比原本窄約 50px） */
  width: min(420px, calc(100% - 50px));
  margin-inline: auto;
}

.card-header {
  @apply flex items-start gap-4 mb-8;
}

.icon-wrapper {
  @apply inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/30;
  transition: background-color 260ms ease, box-shadow 260ms ease, transform 260ms ease;
}

.icon-wrapper.unlocked {
  @apply bg-emerald-600 shadow-lg shadow-emerald-600/30;
}

.icon-wrapper.failed {
  @apply bg-rose-600 shadow-lg shadow-rose-600/30;
  animation: icon-fail 420ms ease-in-out;
}

.icon {
  @apply w-7 h-7;
  /* 避免鎖扣動畫超出 viewBox 時被裁剪 */
  overflow: visible;
}

.lock-shackle {
  transform-box: fill-box;
  /* 左側當作固定點，讓「右邊」單邊上抬（左邊保持連接） */
  transform-origin: 15% 100%;
}

.icon-wrapper.unlocked .lock-shackle {
  animation: shackle-unlock 550ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
}

.icon-wrapper.failed .lock-shackle {
  animation: shackle-fail 420ms ease-in-out;
}

.lock-keyhole {
  transition: opacity 220ms ease;
}

.icon-wrapper.unlocked .lock-keyhole {
  opacity: 0.3;
}

.icon-wrapper.failed .lock-keyhole {
  opacity: 1;
  animation: keyhole-fail 420ms ease-in-out;
}

@keyframes shackle-unlock {
  0% { transform: translateY(0) rotate(0deg); }
  /* 成功：往上跳動一次（不左右抖） */
  22% { transform: translateY(-1.6px) rotate(0deg); }
  40% { transform: translateY(0) rotate(0deg); }
  /* 單邊上抬：右側抬更高（以左側為固定點） */
  70% { transform: translateY(-0.4px) rotate(-30deg); }
  100% { transform: translateY(-0.4px) rotate(-30deg); }
}

@keyframes shackle-fail {
  0% { transform: translate(0, 0); }
  15% { transform: translate(-1px, 0); }
  30% { transform: translate(1px, 0); }
  45% { transform: translate(-1px, 0); }
  60% { transform: translate(1px, 0); }
  75% { transform: translate(-0.6px, 0); }
  100% { transform: translate(0, 0); }
}

@keyframes icon-fail {
  0% { transform: translateX(0); }
  18% { transform: translateX(-1.2px); }
  36% { transform: translateX(1.4px); }
  54% { transform: translateX(-1.0px); }
  72% { transform: translateX(1.1px); }
  100% { transform: translateX(0); }
}

@keyframes keyhole-fail {
  0% { opacity: 1; }
  30% { opacity: 0.55; }
  60% { opacity: 1; }
  100% { opacity: 1; }
}

.title-block {
  @apply flex-1 space-y-1;
}

.eyebrow {
  @apply text-[11px] font-semibold tracking-[0.3em] uppercase text-slate-500;
}

.title-block h1 {
  @apply text-2xl font-semibold text-slate-900;
}

.title-row {
  @apply flex items-end justify-between w-full;
}

.remember-mini {
  @apply inline-flex items-center gap-2 select-none;
  padding: 0.15rem 0.35rem;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.55);
  color: rgba(100, 116, 139, 0.95);
}

.remember-mini-text {
  font-size: 0.6875rem; /* 約 11px，視覺高度約為標題一半 */
  font-weight: 700;
  letter-spacing: 0.08em;
}

.remember-mini-switch {
  width: 28px;
  height: 14px;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.55);
  background: rgba(148, 163, 184, 0.22);
  position: relative;
  appearance: none;
  outline: none;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease;
}

.remember-mini-switch::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  background: #fff;
  transform: translateY(-50%);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
  transition: left 180ms ease;
}

.remember-mini-switch:checked {
  /* 與 LOGIN 同色系（slate-900） */
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(15, 23, 42, 0.65);
}

.remember-mini-switch:checked::after {
  left: 16px;
}

.remember-mini-switch:focus-visible {
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.18);
}

.sub {
  @apply text-sm text-slate-500;
}

.form-body {
  @apply space-y-5;
}

.input-wrap {
  @apply relative w-full;
}

.input-inner {
  @apply relative transition-all duration-300;
}

.password-input {
  @apply w-full pl-10 pr-12 py-5 bg-white/80 hover:bg-white focus:bg-white text-gray-800 rounded-2xl border border-slate-200 focus:border-slate-300 outline-none transition-all duration-300 shadow-sm focus:shadow-xl focus:shadow-slate-200/80 text-base tracking-[0.12em] placeholder:tracking-normal placeholder:text-gray-400/60;

  &.error {
    @apply bg-red-50/70 hover:bg-red-50 focus:bg-red-50 ring-1 ring-red-400/30 text-red-600 placeholder:text-red-300;
  }
}

.indicator-wrapper {
  @apply absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none;
}

.indicator-dot {
  @apply h-3 w-3 rounded-full transition-all duration-500;
  &.active { @apply bg-slate-900 scale-110 shadow-md; }
  &.inactive { @apply bg-gray-200 scale-100; }
}

.btn-submit {
  /* 讓滑鼠點擊與 Enter 觸發時視覺一致：不出現 focus 邊框/光暈
     但保留鍵盤導覽（Tab）時的 focus-visible 光暈 */
  @apply w-full py-4 rounded-2xl font-semibold text-base tracking-[0.18em] shadow-xl transform transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed;
}

.btn-login {
  @apply bg-slate-900 hover:bg-black text-white shadow-slate-900/40 focus-visible:ring-slate-900/30;
}

.btn-logout {
  @apply bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:opacity-95 shadow-rose-500/40 focus-visible:ring-rose-400/40;
}

.footer-text {
  @apply text-center text-gray-400 text-xs mt-8 tracking-[0.25em] uppercase opacity-60;
}
</style>
