<template>
  <div class="block-grid" :style="gridStyle">
    <div v-for="(cell, idx) in totalCells" :key="idx" class="cell" @click="handleClick(idx)">
      <div class="cover" :class="[coverClass, { opened: isOpened(idx) }]" :style="coverStyle"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ rows: number | any; cols: number | any; openedBlocks: any; opacity?: number; blockStyle?: string; blockStyleConfig?: Record<string, any> }>()
const emit = defineEmits<{
  (e: 'block-click', idx: number): void
}>()

const rows = computed(() => Number(props.rows) || 3)
const cols = computed(() => Number(props.cols) || 3)
const totalCells = computed(() => rows.value * cols.value)

function isOpened(idx: number) {
  const opened = props.openedBlocks
  if (!opened) return false
  if (opened instanceof Set) return opened.has(idx)
  if (Array.isArray(opened)) return !!opened[idx]
  return false
}

function handleClick(idx: number) {
  emit('block-click', idx)
}

const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${cols.value}, 1fr)`,
  gridTemplateRows: `repeat(${rows.value}, 1fr)`,
  gap: '0px',
  width: '100%',
  height: '100%',
}))

const coverStyle = computed(() => ({
  '--mask-opacity': Math.min(Math.max(props.opacity ?? 1, 0), 1),
  ...styleVars.value,
}))

const coverClass = computed(() => `style-${props.blockStyle || 'solid-dark'}`)

const styleVars = computed(() => {
  const config = props.blockStyleConfig?.[props.blockStyle || ''] || {}
  switch (props.blockStyle) {
    case 'frosted':
      const tint = config.tint || '#ffffff'
      const alpha = typeof config.opacity === 'number' ? clamp01(config.opacity) : 0.45
      return {
        '--mask-fill': colorWithAlpha(tint, alpha),
        '--mask-border': config.border || 'rgba(255,255,255,0.2)',
        '--mask-blur': `${config.blur ?? 6}px`,
        '--mask-text-opacity': clamp01(1 - alpha),
      }
    case 'neon':
      return {
        '--mask-from': config.from || '#06b6d4',
        '--mask-to': config.to || '#6366f1',
        '--mask-border': config.border || 'rgba(255,255,255,0.12)',
      }
    case 'silver':
      return {
        '--mask-from': config.from || '#e5e7eb',
        '--mask-to': config.to || '#cbd5e1',
        '--mask-border': config.border || 'rgba(0,0,0,0.08)',
      }
    case 'plum':
      return {
        '--mask-from': config.from || '#a855f7',
        '--mask-to': config.to || '#4c1d95',
        '--mask-border': config.border || 'rgba(255,255,255,0.12)',
      }
    case 'solid-dark':
    default:
      return {
        '--mask-fill': config.fill || '#0f172a',
        '--mask-border': config.border || '#1f2937',
      }
  }
})

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1)
}

function colorWithAlpha(color: string, alpha: number) {
  const a = clamp01(alpha)
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const bigint = parseInt(hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex.slice(0, 6), 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map(p => p.trim()).slice(0, 3)
      return `rgba(${parts.join(',')}, ${a})`
    })
  }
  return color
}
</script>

<style scoped>
.block-grid { width: 100%; height: 100%; position: absolute; inset: 0; z-index: 5; }
.cell { position: relative; background: transparent; }
.cover { position: absolute; inset: 0; transition: opacity .15s ease, transform .25s ease; border: 1px solid rgba(0,0,0,0.25); }
.cover.opened { opacity: 0 !important; pointer-events: none; }

/* Style 1: 實心深色 */
.style-solid-dark { background: var(--mask-fill, #0f172a); border-color: var(--mask-border, #1f2937); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); opacity: var(--mask-opacity,1); }

/* Style 2: 霧面玻璃 */
.style-frosted { background: var(--mask-fill, rgba(255,255,255,0.12)); backdrop-filter: blur(var(--mask-blur, 6px)); border-color: var(--mask-border, rgba(255,255,255,0.2)); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15); opacity: var(--mask-opacity,1); }

/* Style 3: 漸層霓虹 */
.style-neon { background: linear-gradient(135deg, var(--mask-from, #06b6d4), var(--mask-to, #6366f1)); border-color: var(--mask-border, rgba(255,255,255,0.12)); opacity: var(--mask-opacity,1); }

/* Style 4: 亮面銀灰 */
.style-silver { background: linear-gradient(160deg, var(--mask-from, #e5e7eb), var(--mask-to, #cbd5e1)); border-color: var(--mask-border, rgba(0,0,0,0.08)); opacity: var(--mask-opacity,1); }

/* Style 5: 深紫霧光 */
.style-plum { background: radial-gradient(circle at 30% 30%, var(--mask-from, #a855f7) 0%, var(--mask-to, #4c1d95) 70%); border-color: var(--mask-border, rgba(255,255,255,0.12)); opacity: var(--mask-opacity,1); }
</style>
