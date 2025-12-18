<template>
  <div class="big-mask-root">
    <div
      class="mask"
      :style="maskStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ maskConfig: any; opacity?: number; scale?: number }>()

const maskStyle = computed(() => {
  const cfg = props.maskConfig || { x: 0, y: 0, width: 100, height: 100, color: 'rgba(0,0,0,0.6)', shape: 'circle' }
  const s = Number(props.scale ?? 1) || 1
  const x = (cfg.x ?? 0) * s
  const y = (cfg.y ?? 0) * s
  const w = (cfg.width ?? 100) * s
  const h = (cfg.height ?? 100) * s
  const transformBase = `translate(-50%, -50%) translate(${x}px, ${y}px)`
  const base: any = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: transformBase,
    width: `${w}px`,
    height: `${h}px`,
    background: applyOpacity(cfg.color || 'rgba(0,0,0,1)', props.opacity ?? 1),
    pointerEvents: 'none'
  }
  if (cfg.shape === 'circle') base.borderRadius = '50%'
  if (cfg.shape === 'square') base.borderRadius = '6px'
  if (cfg.shape === 'trapezoid') base.transform = `${transformBase} skewY(-20deg)`
  return base
})

function applyOpacity(color: string, opacity: number) {
  const o = Math.min(Math.max(opacity, 0), 1)
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const bigint = parseInt(hex.slice(0, 6), 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${o})`
  }
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\(([^)]+)\)/, (m, inner) => {
      const parts = inner.split(',').map(p => p.trim())
      parts[3] = o.toString()
      return `rgba(${parts.join(',')})`
    })
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgb\(([^)]+)\)/, (m, inner) => `rgba(${inner}, ${o})`)
  }
  return color
}
</script>

<style scoped>
.big-mask-root { position: absolute; left: 0; top: 0; right: 0; bottom: 0; z-index: 5; }
.mask { box-shadow: 0 0 0 0 rgba(0,0,0,0.2); transition: all 140ms ease; }
</style>
