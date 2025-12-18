<template>
  <div class="toolbar">
    <button class="btn subtle" @click="$emit('reset')">重置遮罩</button>
    <button class="btn accent" @click="$emit('show-answer')">顯示答案</button>
    <button class="btn outline" @click="$emit('toggle-fullscreen')">
      {{ isFullscreen ? '退出全螢幕' : '全螢幕' }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ isFullscreen?: boolean }>()
</script>

<style scoped>
@reference "../../assets/main.css";

.toolbar {
  @apply inline-flex items-center gap-2;
}

.btn {
  @apply px-3 py-1.5 rounded-full text-[11px] font-medium transition-all;
}

.btn.subtle {
  @apply bg-slate-800/70 border border-slate-600/70 text-slate-200/90 hover:bg-slate-700/90;
}

.btn.accent {
  @apply bg-amber-400/90 text-slate-900 border border-amber-300 shadow-sm shadow-amber-500/30 hover:bg-amber-300;
}

.btn.outline {
  @apply bg-white/80 border border-slate-200 text-slate-800 hover:bg-white;
}

.btn.primary {
  @apply bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-sm shadow-sky-500/40 hover:opacity-95 hover:-translate-y-0.5;
}
</style>
