<template>
  <div class="ambient-container">
    <div
      v-for="b in blobs"
      :key="b.id"
      class="blob"
      :style="{
        width: `${b.size}px`,
        height: `${b.size}px`,
        left: `${b.x}%`,
        top: `${b.y}%`,
        backgroundImage: b.gradient,
        '--driftDur': `${b.driftDur}s`,
        '--colorDur': `${b.colorDur}s`,
        '--lifeDur': `${b.lifeDur}s`,
        '--driftDelay': `${b.driftDelay}s`,
        '--colorDelay': `${b.colorDelay}s`,
        '--lifeDelay': `${b.lifeDelay}s`,
        '--maxOpacity': String(b.maxOpacity),
        '--blur': `${b.blur}px`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

type BlobConfig = {
  id: string
  size: number
  x: number
  y: number
  gradient: string
  maxOpacity: number
  blur: number
  driftDur: number
  colorDur: number
  lifeDur: number
  driftDelay: number
  colorDelay: number
  lifeDelay: number
}

const blobs = ref<BlobConfig[]>([])
const STORAGE_KEY = 'ambient-blobs-v1'

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: readonly T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeGradient(c1: string, c2: string, c3: string) {
  const a = randInt(120, 165)
  return `linear-gradient(${a}deg, ${c1}, ${c2}, ${c3})`
}

function generateBlobs() {
  // 讓顏色更「生動」且避免同色系堆疊：用分組色盤，優先混搭三種色系
  type Group = 'cool' | 'warm' | 'purple'
  const palette: Record<Group, string[]> = {
    cool: [
      '#60a5fa', // sky-400
      '#22d3ee', // cyan-400
      '#34d399', // emerald-400
      '#38bdf8', // sky-400 (alt)
      '#2dd4bf', // teal-400
    ],
    warm: [
      '#fb7185', // rose-400
      '#f97316', // orange-500
      '#fbbf24', // amber-400
      '#fda4af', // rose-300
      '#fdba74', // orange-300
    ],
    purple: [
      '#a78bfa', // violet-400
      '#e879f9', // fuchsia-400
      '#c084fc', // purple-400
      '#f0abfc', // fuchsia-300
    ],
  }

  const next: BlobConfig[] = []

  for (let i = 0; i < 10; i++) {
    // 70% 機率使用三色系混搭（更符合現代審美、避免一片藍）
    // 30% 使用兩色系（但仍禁止三個都同色系）
    const useThreeGroups = Math.random() < 0.7
    const groups: Group[] = ['cool', 'warm', 'purple']
    const g1 = pick(groups)
    const g2 = pick(groups.filter((g) => g !== g1))
    const g3 = useThreeGroups ? (groups.find((g) => g !== g1 && g !== g2) as Group) : pick([g1, g2] as const)

    const colors = shuffle([pick(palette[g1]), pick(palette[g2]), pick(palette[g3])])
    const [c1, c2, c3] = colors

    const size = randInt(360, 760)
    // 允許部分超出畫面，讓光暈更自然
    const x = randFloat(-18, 92)
    const y = randFloat(-18, 92)

    // 生命週期動畫 duty cycle ~ 25%：平均同時顯示約 2~3 顆
    const lifeDur = randInt(18, 32)
    const lifeDelay = -randFloat(0, lifeDur) // 負延遲：進站就呈現不同初始狀態

    const driftDur = randInt(20, 34)
    const driftDelay = -randFloat(0, driftDur)

    const colorDur = randInt(16, 30)
    const colorDelay = -randFloat(0, colorDur)

    next.push({
      id: `blob-${i}-${Math.random().toString(16).slice(2)}`,
      size,
      x,
      y,
      gradient: makeGradient(c1, c2, c3),
      maxOpacity: randFloat(0.22, 0.42),
      blur: randInt(42, 72),
      driftDur,
      colorDur,
      lifeDur,
      driftDelay,
      colorDelay,
      lifeDelay,
    })
  }

  blobs.value = next
}

function isValidBlobs(v: any): v is BlobConfig[] {
  if (!Array.isArray(v) || v.length !== 10) return false
  for (const b of v) {
    if (!b || typeof b !== 'object') return false
    if (typeof b.id !== 'string') return false
    for (const k of ['size', 'x', 'y', 'maxOpacity', 'blur', 'driftDur', 'colorDur', 'lifeDur', 'driftDelay', 'colorDelay', 'lifeDelay'] as const) {
      if (typeof b[k] !== 'number' || !Number.isFinite(b[k])) return false
    }
    if (typeof b.gradient !== 'string' || !b.gradient.includes('gradient')) return false
  }
  return true
}

function loadFromStorage(): BlobConfig[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidBlobs(parsed) ? parsed : null
  } catch {
    return null
  }
}

function saveToStorage(v: BlobConfig[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  } catch {
    // ignore
  }
}

onMounted(() => {
  // 狀態要保存：刷新不重新生成（除非沒有/壞資料）
  const cached = loadFromStorage()
  if (cached) {
    blobs.value = cached
    return
  }
  generateBlobs()
  saveToStorage(blobs.value)
})
</script>

<style scoped>
/* Tailwind v4 utility 參考（顏色 / spacing 等） */
@reference "../../assets/main.css";

/* 全螢幕環境背景容器 */
.ambient-container {
  @apply fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#f8f9fa];
}

/* 彩色光暈球共用樣式 */
.blob {
  @apply absolute rounded-full mix-blend-multiply;
  filter: blur(var(--blur, 56px));
  opacity: 0;
  background-size: 200% 200%;
  animation:
    blob-drift var(--driftDur, 24s) ease-in-out infinite alternate,
    blob-color var(--colorDur, 20s) ease-in-out infinite alternate,
    blob-life var(--lifeDur, 24s) ease-in-out infinite;
  animation-delay: var(--driftDelay, 0s), var(--colorDelay, 0s), var(--lifeDelay, 0s);
  will-change: transform, background-position;
}

/* 漂移動畫（幅度小、節奏更細） */
@keyframes blob-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  30% {
    transform: translate3d(18px, -22px, 0) scale(1.05);
  }
  60% {
    transform: translate3d(-14px, 16px, 0) scale(0.97);
  }
  100% {
    transform: translate3d(10px, -12px, 0) scale(1.03);
  }
}

/* 漸層流動（製造很細的顏色變化，不改整體風格） */
@keyframes blob-color {
  0% {
    background-position: 0% 30%;
  }
  50% {
    background-position: 70% 60%;
  }
  100% {
    background-position: 100% 40%;
  }
}

/* 生命週期：只讓少數 blob 同時可見（淡入淡出） */
@keyframes blob-life {
  0% { opacity: 0; }
  24% { opacity: 0; }
  34% { opacity: var(--maxOpacity, 0.35); }
  54% { opacity: var(--maxOpacity, 0.35); }
  70% { opacity: 0; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .blob {
    animation: none;
    opacity: 0.18;
  }
}
</style>
