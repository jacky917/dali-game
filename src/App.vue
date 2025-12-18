<script setup lang="ts">
import AppLayout from './layout/AppLayout.vue'
import AmbientBackground from './components/ui/AmbientBackground.vue'
/* RouterView 不需要在這裡引入，因為通常是在 AppLayout 裡面處理 */
</script>

<template>
  <AmbientBackground />
  <AppLayout />
</template>

<style>
/* [關鍵修正] 引入 Tailwind 設定 */
@reference "./assets/main.css";

/* 確保 #app 容器本身是透明的 */
#app {
  @apply bg-transparent w-full min-h-screen;
}
</style>
