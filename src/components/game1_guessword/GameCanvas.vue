<template>
  <div ref="rootEl" class="game-canvas-root" :style="rootStyle">
    <canvas ref="canvasEl" class="game-canvas"></canvas>
    <div class="overlay"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { renderBaseImage } from '@/utils/canvasRenderer'

const props = defineProps<{
  baseImage?: any
  aspectRatio?: number
  rounded?: boolean
}>()
const canvasEl = ref<HTMLCanvasElement | null>(null)
const rootEl = ref<HTMLDivElement | null>(null)
let ro: ResizeObserver | null = null

async function draw() {
  const canvas = canvasEl.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  // let renderer handle drawing
  try {
    await renderBaseImage(canvas, props.baseImage || {}, { width: rect.width, height: rect.height })
  } catch (e) {
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const w = (canvas.width = Math.round(rect.width * dpr))
    const h = (canvas.height = Math.round(rect.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = '#ddd'
    ctx.fillRect(0, 0, w / dpr, h / dpr)
    ctx.fillStyle = '#333'
    ctx.font = '20px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Game Canvas Preview', (w / dpr) / 2, (h / dpr) / 2)
  }
}

onMounted(() => {
  nextTick(draw)
  const el = rootEl.value
  if (el && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      nextTick(draw)
    })
    ro.observe(el)
  }
})

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  ro = null
})

watch(
  () => props.baseImage,
  () => {
    nextTick(draw)
  },
  { deep: true }
)

const rootStyle = computed(() => ({
  '--ar': String(props.aspectRatio ?? 4 / 3),
  borderRadius: props.rounded === false ? '0px' : '16px',
}))
</script>

<style scoped>
.game-canvas-root { position: relative; width: 100%; max-width: 100%; aspect-ratio: var(--ar, 4 / 3); overflow: hidden; }
.game-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; background: #eee; }
.overlay { position: absolute; inset: 0; pointer-events: auto; overflow: hidden; }
</style>
