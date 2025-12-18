<template>
  <div class="app-layout">
    <NavBar v-if="showNav" />
    <main class="main-content" :class="{ 'main-fullscreen': !showNav }">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './NavBar.vue'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { isLoggedIn } = useAuth()

// 未登入/登入頁：隱藏 NavBar，讓內容真 100vh
const showNav = computed(() => isLoggedIn.value && route.name !== 'login')
</script>

<style scoped>
/* 1. 引入 Tailwind v4 設定 */
@reference "../assets/main.css";

.app-layout {
  /* 2. [核心修正] background 改為 transparent (或直接不寫背景色)
     原本的 #f3f4f6 是實色，會擋住下層的動畫。
     改為 transparent 後，底下的 AmbientBackground 就能透出來了。
  */
  @apply relative z-10 min-h-screen w-full flex flex-col bg-transparent;
}

.main-content {
  @apply flex-1 w-full relative box-border m-0 p-0 overflow-x-hidden;

  /* Tailwind v4 也可以寫 arbitrary value，例如 min-h-[calc(100vh-52px)]
     但這裡保留原生 CSS 寫法也可以，看你習慣d
  */
  min-height: calc(100vh - 52px);
}

.main-content.main-fullscreen {
  min-height: 100vh;
}
</style>
