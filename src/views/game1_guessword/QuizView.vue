<template>
  <section class="quiz-shell">
    <div class="glass-card quiz-card">
      <header class="quiz-header">
        <div class="title-block">
          <p class="eyebrow">猜字遊戲</p>
          <h2>遮罩揭示模式</h2>
          <p class="subtitle">
            透過格子或大塊遮罩，一步步揭開底圖，搭配題目一起互動遊玩。
          </p>
        </div>

        <div class="mode-tabs" role="tablist">
          <button
            type="button"
            :class="['tab-btn', { active: mode === 'block' }]"
            @click="mode = 'block'"
          >
            格子遮罩
          </button>
          <button
            type="button"
            :class="['tab-btn', { active: mode === 'big' }]"
            @click="mode = 'big'"
          >
            大遮罩
          </button>
        </div>
      </header>

      <section class="question-panel">
        <div class="question-meta">
          <p class="eyebrow">當前題目</p>
          <h3>{{ effectiveQuizConfig.title || '今日題目' }}</h3>
          <p class="subtitle">{{ effectiveQuizConfig.clue || '請根據提示猜出底圖文字' }}</p>
        </div>
        <router-link to="/game/game1_guessword/editor" class="link-edit">
          {{ canEditQuiz ? '編輯題目' : '查看題目' }}
        </router-link>
      </section>

      <div class="canvas-wrapper">
        <div class="canvas-area" ref="canvasAreaRef">
          <div ref="fullscreenEl" class="fullscreen-stage" :class="{ fullscreen: isFullscreen }">
            <GameCanvas :base-image="baseImage" :rounded="quizConfig.canvasRounded !== false" :aspect-ratio="1">
              <template v-if="mode === 'block'">
                <BlockMaskGrid
                  :rows="rows"
                  :cols="cols"
                  :opened-blocks="openedBlocks"
                  :opacity="maskOpacity"
                  :block-style="quizConfig.blockStyle"
                  :block-style-config="quizConfig.blockStyleConfig"
                  :hover-fx="currentStyleCfg.hoverFx"
                  :disappear-anim="currentStyleCfg.disappearAnim"
                  :enable-hover="quizConfig.hoverEnabled !== false"
                  :enable-disappear-anim="quizConfig.blockDisappearAnimEnabled !== false"
                  :reappear-on-click-enabled="quizConfig.blockReappearOnClickEnabled !== false"
                  :show-numbers="quizConfig.blockNumberEnabled === true"
                  :number-font="quizConfig.blockNumberFont"
                  :number-size="quizConfig.blockNumberSize"
                  :number-color="quizConfig.blockNumberColor"
                  :number-shadow="quizConfig.blockNumberShadow"
                  :number-style="quizConfig.blockNumberStyle"
                  @block-click="onBlockClick"
                />
              </template>
              <template v-else>
                <BigMaskOverlay :mask-config="maskConfig" :opacity="maskOpacity" :scale="maskScale" />
              </template>
              <!-- 紅框改由 canvasRenderer 畫在底圖上（在題目文字之下） -->
            </GameCanvas>
          </div>
        </div>

        <div v-if="mode === 'block'" class="opacity-control">
          <label>遮罩透明度 {{ opacityPercent }}%</label>
          <input type="range" min="0" max="100" v-model.number="opacityPercent" />
        </div>

        <div v-if="mode === 'big'" class="mask-controller-area">
          <div class="panel-title">遮罩控制（支援鍵盤方向鍵 / WASD / Ctrl +/-）</div>
          <BigMaskController v-model:mask-config="maskConfig" v-model:opacity="maskOpacity" />
        </div>
      </div>

      <footer class="toolbar-row">
        <QuizToolbar
          :is-fullscreen="isFullscreen"
          @reset="resetAll"
          @show-answer="showAnswer"
          @toggle-fullscreen="toggleFullscreen"
        />
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import GameCanvas from '@/components/game1_guessword/GameCanvas.vue'
import BlockMaskGrid from '@/components/game1_guessword/BlockMaskGrid.vue'
import BigMaskOverlay from '@/components/game1_guessword/BigMaskOverlay.vue'
import BigMaskController from '@/components/game1_guessword/BigMaskController.vue'
import QuizToolbar from '@/components/game1_guessword/QuizToolbar.vue'
import { useBaseImage } from '@/composables/useBaseImage'
import { useBlockMask } from '@/composables/useBlockMask'
import { useBigMask } from '@/composables/useBigMask'
import { useGuesswordConfig } from '@/composables/useGuesswordConfig'
import { useAuth } from '@/composables/useAuth'
import { playSfx, type SfxId } from '@/utils/sfx'

const mode = ref<'block' | 'big'>('block')
const maskOpacity = ref(1)
const canvasAreaRef = ref<HTMLElement | null>(null)
const canvasBox = ref({ w: 0, h: 0 })
const fullscreenEl = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)
const baseCanvasBox = ref<{ w: number; h: number } | null>(null)

const maskScale = computed(() => {
  const base = baseCanvasBox.value?.w
  if (!base) return 1
  return (canvasBox.value.w || base) / base
})

const { quizConfig } = useGuesswordConfig()
const { canEditQuiz, hasRole } = useAuth()
const canViewAdvanced = computed(() => hasRole(['user', 'admin']))
const initialRows = quizConfig.value.blockRows || 3
const initialCols = quizConfig.value.blockCols || 3

const { baseImage } = useBaseImage()
const { rows, cols, openedBlocks, openBlock, resetBlocks } = useBlockMask({ rows: initialRows, cols: initialCols })
const { maskConfig, updateMask } = useBigMask()

const currentStyleCfg = computed<any>(() => quizConfig.value.blockStyleConfig?.[quizConfig.value.blockStyle] || {})

function onBlockClick(idx: number) {
  const opened = openedBlocks.value instanceof Set ? openedBlocks.value.has(idx) : false
  const styleCfg: any = quizConfig.value.blockStyleConfig?.[quizConfig.value.blockStyle] || {}

  // 已翻開 → 再點重現（重新蓋回去）
  if (opened) {
    if (quizConfig.value.blockReappearOnClickEnabled === false) return
    openedBlocks.value.delete(idx)
    // 蓋回去：使用「蓋上音效」（所有樣式一致）
    if (quizConfig.value.soundEnabled !== false) {
      const id = (styleCfg.soundClose || 'pop-1') as SfxId
      void playSfx(id, 0.32)
    }
    return
  }

  // 未翻開 → 翻開
  if (quizConfig.value.soundEnabled !== false) {
    const id = (styleCfg.soundOpen || 'pop-1') as SfxId
    void playSfx(id, 0.35)
  }
  openBlock(idx)

  // 全部翻開時播放「賓果音效」
  const total = (Number(rows.value) || 3) * (Number(cols.value) || 3)
  if (openedBlocks.value.size === total && quizConfig.value.soundEnabled !== false) {
    const id = ((styleCfg.soundBingo || styleCfg.soundAllOpen) || 'pop-10') as SfxId
    void playSfx(id, 0.45)
  }
}

function resetAll() {
  resetBlocks()
  centerMask()
  maskOpacity.value = 1
}

// 權限不足時：UI 隱藏的內容也不應在遊戲畫面生效/顯示（但仍保留在瀏覽器儲存中）
const effectiveQuizConfig = computed(() => {
  const cfg: any = quizConfig.value
  if (canViewAdvanced.value) return cfg
  return {
    ...cfg,
    title: '',
    clue: '',
    backgroundUrl: '',
  }
})

watch(
  effectiveQuizConfig,
  (cfg) => {
    baseImage.value = {
      ...baseImage.value,
      text: cfg.displayText,
      textColor: cfg.textColor,
      fontSize: cfg.fontSize,
      font: cfg.font,
      textX: cfg.textX,
      textY: cfg.textY,
      backgroundUrl: cfg.backgroundUrl,
      backgroundFit: cfg.backgroundFit || 'cover',
      canvasGridGuide: cfg.canvasGridGuide,
      canvasGridThickness: cfg.canvasGridThickness,
      canvasGridRows: cfg.canvasGridRows,
      canvasGridCols: cfg.canvasGridCols,
      blockRows: cfg.blockRows,
      blockCols: cfg.blockCols,
    }
    rows.value = cfg.blockRows || 3
    cols.value = cfg.blockCols || 3
    resetBlocks()
  },
  { immediate: true, deep: true }
)

const opacityPercent = computed({
  get() { return Math.round(maskOpacity.value * 100) },
  set(v: number) { maskOpacity.value = Math.min(Math.max(v / 100, 0), 1) }
})

function handleKeydown(e: KeyboardEvent) {
  if (mode.value !== 'big') return
  const key = e.key.toLowerCase()

  // 調整大小：Ctrl + / Ctrl -
  if (e.ctrlKey || e.metaKey) {
    if (key === '+' || key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd') {
      e.preventDefault()
      adjustMaskSize(1.12)
      return
    }
    if (key === '-' || key === '_' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
      e.preventDefault()
      adjustMaskSize(0.88)
      return
    }
  }

  if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
    e.preventDefault()
    if (key === 'arrowup' || key === 'w') moveMaskBounded('up')
    if (key === 'arrowdown' || key === 's') moveMaskBounded('down')
    if (key === 'arrowleft' || key === 'a') moveMaskBounded('left')
    if (key === 'arrowright' || key === 'd') moveMaskBounded('right')
  }
}

function adjustMaskSize(scale: number) {
  const nextWidth = Math.max(24, maskConfig.value.width * scale)
  const nextHeight = Math.max(24, maskConfig.value.height * scale)
  setMask({ width: nextWidth, height: nextHeight })
}

function showAnswer() {
  // 音效：全部翻開 / 顯示答案
  if (quizConfig.value.soundEnabled !== false) {
    const styleCfg: any = quizConfig.value.blockStyleConfig?.[quizConfig.value.blockStyle] || {}
    const id = ((styleCfg.soundBingo || styleCfg.soundAllOpen) || 'pop-10') as SfxId
    void playSfx(id, 0.42)
  }
  maskOpacity.value = 0
}

function nextQuestion() {
  resetAll()
}

function setMask(partial: any) {
  const s = maskScale.value || 1
  const cw = canvasBox.value.w || 480
  const ch = canvasBox.value.h || 360
  const cwL = cw / s
  const chL = ch / s
  const current = { ...maskConfig.value, ...partial }
  const w = current.width
  const h = current.height
  const minX = -cwL / 2 - w / 2
  const maxX = cwL / 2 + w / 2
  const minY = -chL / 2 - h / 2
  const maxY = chL / 2 + h / 2
  current.x = Math.min(Math.max(current.x, minX), maxX)
  current.y = Math.min(Math.max(current.y, minY), maxY)
  updateMask(current)
}

function centerMask() {
  const cw = canvasBox.value.w || 480
  const ch = canvasBox.value.h || 360
  // 0,0 代表中心對齊
  setMask({ x: 0, y: 0, width: maskConfig.value.width, height: maskConfig.value.height })
}

function moveMaskBounded(direction: 'up' | 'down' | 'left' | 'right') {
  const step = maskConfig.value.step ?? 12
  const delta = { x: 0, y: 0 }
  if (direction === 'up') delta.y = -step
  if (direction === 'down') delta.y = step
  if (direction === 'left') delta.x = -step
  if (direction === 'right') delta.x = step
  setMask({ x: maskConfig.value.x + delta.x, y: maskConfig.value.y + delta.y })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  const host = fullscreenEl.value || canvasAreaRef.value
  if (!host) return

  function updateBox() {
    const root = (host as HTMLElement).querySelector?.('.game-canvas-root') as HTMLElement | null
    const rect = (root || host).getBoundingClientRect()
    const w = rect.width || 0
    const h = rect.height || 0
    if (w > 0 && h > 0) {
      canvasBox.value = { w, h }
      if (!isFullscreen.value) baseCanvasBox.value = { w, h }
    }
  }

  const obs = new ResizeObserver(() => {
    updateBox()
  })
  obs.observe(host)
  updateBox()
  onBeforeUnmount(() => obs.disconnect())
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    const el = fullscreenEl.value
    if (!el) return
    // Safari fallback
    const anyEl: any = el
    const req = el.requestFullscreen || anyEl.webkitRequestFullscreen
    if (req) await req.call(el)
  } catch {
    // ignore
  }
}
</script>

<style scoped>
@reference "../../assets/main.css";

.quiz-shell {
  @apply flex justify-center w-full px-4 pt-8 pb-16;
}

.quiz-card {
  @apply w-full max-w-5xl px-5 py-6 text-slate-900;
}

.quiz-header {
  @apply flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5;
}

.title-block {
  @apply space-y-2;
}

.eyebrow {
  @apply text-[11px] font-semibold tracking-[0.25em] uppercase text-sky-300/80;
}

.title-block h2 {
  @apply text-xl font-semibold tracking-tight text-slate-900;
}

.subtitle {
  @apply text-xs leading-relaxed text-slate-600/90 max-w-md;
}

.question-panel {
  @apply mt-2 mb-4 flex items-start justify-between gap-3 flex-wrap rounded-2xl border border-slate-200 bg-white/80 px-4 py-3;
}

.question-panel h3 {
  @apply text-lg font-semibold text-slate-900;
}

.question-meta {
  @apply space-y-1;
}

.link-edit {
  @apply inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/80 border border-slate-200 text-slate-800 hover:bg-white transition-colors;
}

.mode-tabs {
  @apply inline-flex items-center gap-1 rounded-full bg-white/80 p-1 border border-slate-200;
}

.tab-btn {
  @apply px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-white transition-colors;
}

.tab-btn.active {
  @apply bg-sky-500 text-white shadow-md shadow-sky-500/40;
}

.canvas-wrapper {
  @apply flex flex-col gap-4 w-full;
}

.canvas-area {
  @apply mt-4 mb-2 flex justify-center w-full;
}

.fullscreen-stage {
  width: 100%;
  max-width: 720px;
}

/* 全螢幕時：置中並撐滿可用空間（保留正方形比例由 GameCanvas 控制） */
.fullscreen-stage:fullscreen,
.fullscreen-stage:-webkit-full-screen {
  width: 100%;
  height: 100%;
  max-width: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0b1220;
  padding: 16px;
}

.fullscreen-stage:fullscreen > * ,
.fullscreen-stage:-webkit-full-screen > * {
  width: min(92vmin, 100%);
}

.grid-guide {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* 要在背景之上、遮罩之下 */
  z-index: 2;
  border: var(--g, 2px) solid rgba(239, 68, 68, 0.75);
  background-image:
    linear-gradient(to right, rgba(239, 68, 68, 0.55) var(--g, 2px), transparent var(--g, 2px)),
    linear-gradient(to bottom, rgba(239, 68, 68, 0.55) var(--g, 2px), transparent var(--g, 2px));
  background-size: calc(100% / 3) calc(100% / 3);
  background-position: 0 0;
}

.opacity-control {
  @apply flex items-center gap-3 text-xs text-slate-700 mb-3 px-1;
}

.opacity-control input[type="range"] {
  @apply w-48;
}

.mask-controller-area {
  @apply mb-3 text-[11px] text-slate-700 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3;
  width: 80%;
  margin-inline: auto;
}

.panel-title {
  @apply text-xs text-slate-600 mb-2;
}

.toolbar-row {
  @apply flex justify-end;
}
</style>
 
