<template>
  <header class="nav-shell">
    <nav class="nav">
      <div class="left">
        <router-link to="/home" class="brand">
          <span class="brand-mark">G</span>
          <span class="brand-text">Game</span>
        </router-link>
        <span class="divider"></span>
        <template v-for="g in gamesList" :key="g.key">
          <router-link
            v-if="g.enabled"
            :to="`/game/${g.key}/quiz`"
            class="nav-link"
          >
            {{ g.displayName }}
          </router-link>
        </template>
      </div>
      <div class="right">
        <span v-if="isLoggedIn" class="status-pill">已登入</span>
        <button
          v-if="isLoggedIn"
          class="btn-logout"
          @click="handleLogout"
        >
          登出
        </button>
        <router-link
          v-else
          to="/login"
          class="btn-primary"
        >
          登入
        </router-link>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { games } from '@/games/registry'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isLoggedIn, logout, checkAuth } = useAuth()
const gamesList = games

onMounted(() => {
  checkAuth()
})
function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<style scoped>
@reference "../assets/main.css";

.nav-shell {
  @apply sticky top-0 z-20 flex justify-center px-4 pt-4 pb-2;
}

.nav {
  @apply w-full max-w-5xl flex items-center justify-between rounded-2xl bg-slate-900/70 border border-white/10 backdrop-blur-xl px-5 py-3 text-sm text-slate-100 shadow-lg shadow-slate-950/40;
}

.left {
  @apply flex items-center gap-3;
}

.right {
  @apply flex items-center gap-3;
}

.brand {
  @apply flex items-center gap-2 text-slate-100;
}

.brand-mark {
  @apply inline-flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 text-[11px] font-bold tracking-wide shadow-md shadow-sky-500/40;
}

.brand-text {
  @apply text-xs font-medium tracking-[0.18em] uppercase text-slate-200/90;
}

.divider {
  @apply h-6 w-px bg-slate-500/40 mx-1;
}

.nav-link {
  @apply px-3 py-1.5 rounded-full text-xs font-medium text-slate-200/80 hover:text-white hover:bg-slate-700/70 transition-colors;
}

.status-pill {
  @apply px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-400/15 text-emerald-300 border border-emerald-400/25;
}

.btn-primary {
  @apply px-3.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-md shadow-sky-500/40 hover:opacity-95 hover:-translate-y-0.5 transition-all;
}

.btn-logout {
  @apply px-3.5 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 shadow-md shadow-rose-500/40 hover:opacity-95 hover:-translate-y-0.5 transition-all border border-white/10;
}
</style>
