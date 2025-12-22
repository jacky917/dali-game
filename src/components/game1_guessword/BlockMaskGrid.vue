<template>
  <div class="block-grid" :style="gridStyle">
    <div
      v-for="(cell, idx) in totalCells"
      :key="idx"
      class="cell"
      :class="{ clickable: isClickable(idx) }"
      @click="handleClick(idx)"
    >
      <div class="cover" :class="[coverClass, hoverClass, disappearClass, { opened: isOpened(idx) }]" :style="coverStyle">
        <div
          v-if="props.showNumbers && !isOpened(idx)"
          class="num"
          :class="numberClass"
          :style="numberStyle"
        >
          {{ idx + 1 }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  rows: number | any
  cols: number | any
  openedBlocks: any
  opacity?: number
  blockStyle?: string
  blockStyleConfig?: Record<string, any>
  hoverFx?: 'glow' | 'lift' | string
  disappearAnim?: 'fade' | 'scale' | string
  enableHover?: boolean
  enableDisappearAnim?: boolean
  reappearOnClickEnabled?: boolean
  showNumbers?: boolean
  numberFont?: string
  numberSize?: number
  numberColor?: string
  numberShadow?: 'none' | 'soft' | 'strong' | 'glow' | string
  numberStyle?: 'plain' | 'badge' | string
}>()
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

function isClickable(idx: number) {
  // 未翻開一定可點；已翻開只有在「再點重現」開啟時才可點（游標需一致）
  if (!isOpened(idx)) return true
  return props.reappearOnClickEnabled !== false
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

const numberStyle = computed(() => ({
  '--num-font': props.numberFont || 'sans-serif',
  '--num-size': `${Number(props.numberSize) || 18}px`,
  '--num-color': props.numberColor || '#111111',
  '--num-shadow': props.numberShadow === 'strong'
    ? '0 3px 10px rgba(15,23,42,0.35)'
    : props.numberShadow === 'glow'
      ? '0 0 10px rgba(255,255,255,0.55), 0 2px 6px rgba(15,23,42,0.22)'
      : props.numberShadow === 'none'
        ? 'none'
        : '0 2px 6px rgba(15,23,42,0.22)',
}))

const numberClass = computed(() => (props.numberStyle ? `num-${props.numberStyle}` : 'num-badge'))

const coverClass = computed(() => `style-${props.blockStyle || 'solid-dark'}`)
const hoverClass = computed(() => (props.enableHover === false ? '' : props.hoverFx ? `hover-${props.hoverFx}` : ''))
const disappearClass = computed(() => (props.enableDisappearAnim === false ? '' : props.disappearAnim ? `disappear-${props.disappearAnim}` : ''))

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
.cell { position: relative; background: transparent; cursor: default; }
.cell.clickable { cursor: pointer; }
.cell:hover { z-index: 60; } /* 確保 hover 浮起來時在最上層 */
.cover { position: absolute; inset: 0; transition: opacity .15s ease, transform .25s ease; border: 1px solid rgba(0,0,0,0.25); cursor: inherit; }
.cover.opened { opacity: 0 !important; pointer-events: none; }

.num {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  font-family: var(--num-font, sans-serif);
  font-size: var(--num-size, 18px);
  color: var(--num-color, #111111);
  opacity: 1;
  font-weight: 800;
  letter-spacing: 0.02em;
  z-index: 3; /* 確保在球面/高光之上 */
  text-shadow: var(--num-shadow, 0 2px 6px rgba(15,23,42,0.22));
}

.num-plain {
  background: transparent;
}

.num-badge::before {
  content: '';
  position: absolute;
  width: 40%;
  height: 40%;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    inset 0 2px 4px rgba(15,23,42,0.08),
    0 6px 14px rgba(15,23,42,0.10);
  z-index: -1;
}
.num-badge {
  /* 圓牌樣式下，文字要更深更清楚 */
  color: rgba(15, 23, 42, 0.92);
}

/* Hover FX */
.cover.hover-glow:not(.opened):hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 10px 16px rgba(15, 23, 42, 0.18));
}
.cover.hover-lift:not(.opened):hover {
  transform: translateY(-3px) scale(1.02);
  filter: drop-shadow(0 12px 18px rgba(15, 23, 42, 0.16));
}

.cover.hover-top:not(.opened):hover {
  transform: translateY(-4px) scale(1.03);
  filter: drop-shadow(0 14px 20px rgba(15, 23, 42, 0.18));
  z-index: 2;
}

/* Disappear animation variants (opened state) */
.cover.disappear-scale.opened {
  transform: scale(0.86);
}

/* Style 1: 實心深色 */
.style-solid-dark { background: var(--mask-fill, #0f172a); border-color: var(--mask-border, #1f2937); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); opacity: var(--mask-opacity,1); }

/* Style 2: 霧面玻璃 */
.style-frosted { background: var(--mask-fill, rgba(255,255,255,0.12)); backdrop-filter: blur(var(--mask-blur, 6px)); border-color: var(--mask-border, rgba(255,255,255,0.2)); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15); opacity: var(--mask-opacity,1); }

/* Style 3: 漸層霓虹 */
.style-neon {
  /* 復古粗框按鈕（參考圖：粗外框 + 內部淡色按鍵） */
  border-radius: 18px;
  background: linear-gradient(180deg, #f7f8fa, #eef1f5);
  border-color: transparent;
  opacity: var(--mask-opacity,1);
  box-shadow:
    inset 0 0 0 10px var(--mask-from, #84cc16),
    inset 0 0 0 16px var(--mask-to, #4d7c0f),
    inset 0 2px 0 #ffffff,
    inset 0 -8px 12px rgba(15, 23, 42, 0.10),
    0 12px 26px rgba(15,23,42,0.16);
}
.style-neon::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 14px;
  /* 不用透明疊色（避免看到底圖文字），改成實心高光與內凹陰影 */
  background:
    radial-gradient(circle at 30% 22%, rgba(255,255,255,0.95), rgba(255,255,255,0.0) 42%),
    linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.0) 46%);
  pointer-events: none;
}

/* Style 4: 亮面銀灰 */
.style-silver {
  /* 撞球：圓形 + 立體高光 + 中央白色圓牌 */
  border-radius: 9999px;
  background:
    /* 反射光帶 */
    linear-gradient(135deg, rgba(255,255,255,0.38), rgba(255,255,255,0.0) 42%),
    /* 高光點 */
    radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98), rgba(255,255,255,0.0) 34%),
    /* 次高光 */
    radial-gradient(circle at 64% 76%, rgba(255,255,255,0.14), rgba(255,255,255,0.0) 60%),
    /* 暗角/體積 */
    radial-gradient(circle at 50% 62%, rgba(0,0,0,0.30), rgba(0,0,0,0.0) 58%),
    /* 球體主色 */
    radial-gradient(circle at 42% 45%, var(--mask-from, #1f2937), var(--mask-to, #0b1220) 78%);
  border-color: transparent;
  opacity: var(--mask-opacity,1);
  box-shadow:
    inset 0 0 0 2px rgba(255,255,255,0.55),
    inset 0 14px 22px rgba(255,255,255,0.22),
    inset 0 -20px 30px rgba(0,0,0,0.28),
    0 10px 22px rgba(15,23,42,0.16);
}
.style-silver::before {
  /* 讓球更像照片：加一條柔和的亮面反光弧 */
  content: '';
  position: absolute;
  inset: 6%;
  border-radius: 9999px;
  background: radial-gradient(circle at 22% 18%, rgba(255,255,255,0.45), rgba(255,255,255,0.0) 55%);
  pointer-events: none;
}
.style-silver::after {
  content: '';
  position: absolute;
  inset: 28%;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 30% 30%, #ffffff, #e5e7eb 72%);
  box-shadow:
    inset 0 2px 4px rgba(15,23,42,0.08),
    0 2px 8px rgba(15,23,42,0.10);
  pointer-events: none;
  z-index: 1;
}

/* Style 5: 深紫霧光 */
.style-plum { background: radial-gradient(circle at 30% 30%, var(--mask-from, #a855f7) 0%, var(--mask-to, #4c1d95) 70%); border-color: var(--mask-border, rgba(255,255,255,0.12)); opacity: var(--mask-opacity,1); }
</style>
