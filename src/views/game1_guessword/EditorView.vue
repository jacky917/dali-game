<template>
  <section class="editor-shell">
    <div class="glass-card editor-card">
      <header class="heading">
        <div>
          <p class="eyebrow">Guessword / Editor</p>
          <h2>自定義題目</h2>
        </div>
      </header>

      <form class="form-grid" @submit.prevent="handleSave">
        <label class="field">
          <span>標題</span>
          <input v-model="form.title" type="text" placeholder="今日題目" />
        </label>

        <label class="field">
          <span>提示敘述</span>
          <textarea v-model="form.clue" rows="3" placeholder="請根據提示猜出底圖文字"></textarea>
        </label>

        <div class="row-4">
          <label class="field">
            <span>題目</span>
            <input v-model="unifiedText" type="text" placeholder="例如：天" />
          </label>
          <label class="field">
            <span>文字大小</span>
            <input v-model.number="form.fontSize" type="number" min="28" max="1000" />
          </label>
          <label class="field">
            <span>字體</span>
            <select v-model="form.font">
              <option v-for="f in fontOptions" :key="f.value" :value="f.value">
                {{ f.label }}
              </option>
            </select>
          </label>
          <label class="field color-field">
            <span>文字顏色</span>
            <div class="color-picker">
              <input v-model="form.textColor" type="color" class="color-input" :style="{ background: form.textColor }" />
              <span class="color-hex">{{ form.textColor }}</span>
            </div>
          </label>
        </div>

        <div class="field">
          <span>遮罩方塊樣式（長按可編輯）</span>
          <div class="style-options">
            <label
              v-for="style in blockStyles"
              :key="style.value"
              class="style-chip"
              @mousedown.prevent="pressStyle(style.value)"
              @mouseup.prevent="releaseStyle"
              @mouseleave.prevent="releaseStyle"
              @touchstart.prevent="pressStyle(style.value)"
              @touchend.prevent="releaseStyle"
            >
              <input type="radio" v-model="form.blockStyle" :value="style.value" />
              <span class="chip-visual" :class="`preview-${style.value}`"></span>
              <span class="chip-label">{{ style.label }}</span>
            </label>
          </div>
        </div>

        <div class="row-settings">
          <label class="field two-inline option">
            <span>格子數量</span>
            <div class="inline-inputs single">
              <div class="inline-field">
                <input class="grid-size-input" v-model.number="gridSize" type="number" />
              </div>
            </div>
            <span class="small-label">目前：{{ gridSize || 0 }} × {{ gridSize || 0 }}</span>
          </label>

          <div class="field option">
            <span>圓角</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.canvasRounded }"
              @click="form.canvasRounded = !form.canvasRounded"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.canvasRounded ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>

          <div class="field option">
            <span>紅框</span>
            <div class="redframe-controls" aria-label="紅框與粗細">
              <button
                type="button"
                class="toggle"
                :class="{ on: form.canvasGridGuide }"
                @click="form.canvasGridGuide = !form.canvasGridGuide"
              >
                <span class="toggle-knob"></span>
                <span class="toggle-text">{{ form.canvasGridGuide ? '開' : '關' }}</span>
              </button>
              <select
                class="thin-select"
                v-model.number="form.canvasGridThickness"
                :disabled="!form.canvasGridGuide"
                aria-label="紅框粗細"
              >
                <option :value="1">細 (1px)</option>
                <option :value="2">中 (2px)</option>
                <option :value="3">粗 (3px)</option>
                <option :value="4">特粗 (4px)</option>
              </select>
            </div>
            <span class="small-label">&nbsp;</span>
          </div>

          <label class="field url-wide option">
            <span>背景圖片（選填）</span>
            <div class="url-row">
              <select v-model="form.backgroundFit" class="fit-select" aria-label="背景圖片顯示方式">
                <option value="cover">填滿裁切（cover）</option>
                <option value="contain">等比完整（contain）</option>
                <option value="stretch">拉伸填滿（stretch）</option>
              </select>
              <input v-model="form.backgroundUrl" type="url" placeholder="https://example.com/bg.jpg" />
            </div>
            <span class="small-label bg-hint" v-if="bgStatus === 'loading'">檢查中...</span>
            <span class="small-label bg-ok" v-else-if="bgStatus === 'ok'">圖片可用（支持 CORS）</span>
            <span class="small-label bg-err" v-else-if="bgStatus === 'error'">{{ bgError }}</span>
            <span class="small-label bg-hint" v-else>建議使用同源 /public 圖片或支援 CORS 的圖床，亦可貼 data URL。</span>
          </label>
        </div>

        <div class="preview-card">
          <div class="preview-header">
            <p class="eyebrow">即時預覽</p>
          </div>
          <div class="preview-canvas" :style="{ '--preview-radius': form.canvasRounded !== false ? '16px' : '0px' }">
            <GameCanvas :base-image="previewBaseImage" :rounded="form.canvasRounded !== false" :aspect-ratio="1" />
            <div
              v-if="form.canvasGridGuide"
              class="preview-grid-guide"
              :style="previewGuideStyle"
            ></div>
            <div class="preview-hint small-label">Ctrl + 方向鍵 調整文字位置</div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn subtle" @click="reset">重置預設</button>
          <button type="submit" class="btn primary">儲存題目</button>
        </div>
      </form>

      <FloatingToast :message="toast?.message ?? null" :mode="toast?.type ?? 'success'" />

      <teleport to="body">
        <transition name="dialog-fade">
          <div v-if="styleDialogOpen" class="dialog-backdrop" @click.self="onDialogBackdropClick">
            <div class="dialog-card">
              <header class="dialog-header">
                <h3>自訂樣式：{{ blockStyles.find(b => b.value === editingStyle)?.label }}</h3>
                <button type="button" class="dialog-close" @click="closeStyleDialog">×</button>
              </header>

              <div class="dialog-body two-pane">
                <div class="dialog-controls" v-if="editingStyle === 'solid-dark'">
                  <label class="dialog-field">
                    <span>填充顏色</span>
                    <input type="color" v-model="styleDraft.fill" />
                  </label>
                  <label class="dialog-field">
                    <span>邊框顏色</span>
                    <input type="color" v-model="styleDraft.border" />
                  </label>
                </div>

                <div class="dialog-controls" v-else-if="editingStyle === 'frosted'">
                  <label class="dialog-field">
                    <span>邊框顏色</span>
                    <input type="color" v-model="styleDraft.border" />
                  </label>
                  <label class="dialog-field">
                    <span>模糊強度 (px)</span>
                    <input type="range" min="0" max="40" step="1" v-model.number="styleDraft.blur" />
                    <span class="small-label">{{ styleDraft.blur ?? 0 }} px</span>
                  </label>
                  <label class="dialog-field">
                    <span>透明度</span>
                    <input type="range" min="0" max="1" step="0.05" v-model.number="styleDraft.opacity" />
                    <span class="small-label">{{ ((styleDraft.opacity ?? 0.45) * 100).toFixed(0) }}%</span>
                  </label>
                </div>

                <div class="dialog-controls" v-else-if="editingStyle === 'neon'">
                  <label class="dialog-field">
                    <span>起始顏色</span>
                    <input type="color" v-model="styleDraft.from" />
                  </label>
                  <label class="dialog-field">
                    <span>結束顏色</span>
                    <input type="color" v-model="styleDraft.to" />
                  </label>
                  <label class="dialog-field">
                    <span>邊框顏色</span>
                    <input type="color" v-model="styleDraft.border" />
                  </label>
                </div>

                <div class="dialog-controls" v-else-if="editingStyle === 'silver'">
                  <label class="dialog-field">
                    <span>起始顏色</span>
                    <input type="color" v-model="styleDraft.from" />
                  </label>
                    <label class="dialog-field">
                    <span>結束顏色</span>
                    <input type="color" v-model="styleDraft.to" />
                  </label>
                  <label class="dialog-field">
                    <span>邊框顏色</span>
                    <input type="color" v-model="styleDraft.border" />
                  </label>
                </div>

                <div class="dialog-controls" v-else-if="editingStyle === 'plum'">
                  <label class="dialog-field">
                    <span>內圈顏色</span>
                    <input type="color" v-model="styleDraft.from" />
                  </label>
                  <label class="dialog-field">
                    <span>外圈顏色</span>
                    <input type="color" v-model="styleDraft.to" />
                  </label>
                  <label class="dialog-field">
                    <span>邊框顏色</span>
                    <input type="color" v-model="styleDraft.border" />
                  </label>
                </div>

                <div class="dialog-preview">
                  <div v-if="editingStyle === 'frosted'" class="preview-bg">test</div>
                  <div class="preview-box" :style="dialogPreview.boxStyle">
                  </div>
                </div>
              </div>

              <footer class="dialog-footer">
                <button type="button" class="btn subtle" @click="closeStyleDialog">取消</button>
                <button type="button" class="btn primary" @click="saveStyleDialog">套用</button>
              </footer>
            </div>
          </div>
        </transition>
      </teleport>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGuesswordConfig } from '@/composables/useGuesswordConfig'
import GameCanvas from '@/components/game1_guessword/GameCanvas.vue'
import { getFontOptions, loadLocalFonts } from '@/utils/localFonts'
import FloatingToast from '@/components/ui/FloatingToast.vue'

const router = useRouter()
const route = useRoute()
const { quizConfig, setConfig, resetConfig, defaultConfig } = useGuesswordConfig()
const form = reactive({ ...quizConfig.value })
const toast = ref<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null)
let toastTimer: number | null = null
const bgStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')
const bgError = ref('')
const fontOptions = ref(getFontOptions())
const styleDialogOpen = ref(false)
const editingStyle = ref('solid-dark')
const styleDraft = reactive<any>({})
const dialogPreview = computed<any>(() => buildPreviewStyle(editingStyle.value, styleDraft))
let longPressTimer: any = null
let suppressBackdropClick = false

const blockStyles = [
  { value: 'solid-dark', label: '深色實心' },
  { value: 'frosted', label: '霧面玻璃' },
  { value: 'neon', label: '霓虹漸層' },
  { value: 'silver', label: '銀灰亮面' },
  { value: 'plum', label: '深紫霧光' },
]

const previewBaseImage = computed(() => ({
  text: form.displayText,
  textColor: form.textColor,
  fontSize: form.fontSize,
  font: form.font,
  textX: form.textX,
  textY: form.textY,
  backgroundUrl: form.backgroundUrl,
  backgroundFit: form.backgroundFit,
  aspectRatio: 4 / 3,
}))

const previewGuideStyle = computed(() => ({
  '--g': `${Number(form.canvasGridThickness) || 2}px`,
}))

const EDUKAI_LOCAL_FAMILY = 'local-edukai-5-0'

function applyDefaultFontIfAvailable() {
  // 只在「還是預設字體」的情況下自動套用，避免覆蓋使用者自選
  const isDefaultFont = !form.font || form.font === defaultConfig.font
  if (!isDefaultFont) return

  const hasEdukai = fontOptions.value.some((f) => f.value === EDUKAI_LOCAL_FAMILY)
  form.font = hasEdukai ? EDUKAI_LOCAL_FAMILY : defaultConfig.font
}

function clamp01Text(v: number) {
  return Math.min(Math.max(v, 0), 1)
}

function handleTextNudgeKeydown(e: KeyboardEvent) {
  // 只在 Ctrl / Cmd + 方向鍵時觸發，避免干擾一般輸入
  if (!(e.ctrlKey || e.metaKey)) return
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return

  const target = e.target as HTMLElement | null
  const tag = target?.tagName?.toUpperCase()
  if (tag && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

  e.preventDefault()

  const step = 0.02
  if (typeof form.textX !== 'number') form.textX = 0.5
  if (typeof form.textY !== 'number') form.textY = 0.5

  if (e.key === 'ArrowLeft') form.textX = clamp01Text(form.textX - step)
  if (e.key === 'ArrowRight') form.textX = clamp01Text(form.textX + step)
  if (e.key === 'ArrowUp') form.textY = clamp01Text(form.textY - step)
  if (e.key === 'ArrowDown') form.textY = clamp01Text(form.textY + step)
}

onMounted(() => {
  window.addEventListener('keydown', handleTextNudgeKeydown)
  // 本地字體載入完後刷新下拉選單（遇到不支援/壞檔會被自動跳過）
  loadLocalFonts().then(() => {
    fontOptions.value = getFontOptions()
    applyDefaultFontIfAvailable()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleTextNudgeKeydown)
})

const unifiedText = computed({
  get() {
    return form.displayText || form.answer || ''
  },
  set(v: string) {
    form.displayText = v
    form.answer = v
  },
})

const gridSize = computed({
  get() {
    return Number(form.blockRows) || Number(form.blockCols) || 3
  },
  set(v: number) {
    const n = Number(v) || 0
    form.blockRows = n
    form.blockCols = n
  },
})

watch(
  () => form.backgroundUrl,
  async (url) => {
    if (!url) {
      bgStatus.value = 'idle'
      bgError.value = ''
      return
    }
    bgStatus.value = 'loading'
    bgError.value = ''
    try {
      await probeImage(url)
      bgStatus.value = 'ok'
    } catch (e: any) {
      bgStatus.value = 'error'
      bgError.value = '圖片載入失敗，可能是跨域限制，請改用 /public 同源路徑、開放 CORS 的圖床，或貼上 data:image/...'
    }
  },
  { immediate: true }
)

function handleSave() {
  // 確保答案與底圖文字一致
  form.answer = unifiedText.value
  form.displayText = unifiedText.value
  // 確保格子為方形
  form.blockRows = gridSize.value
  form.blockCols = gridSize.value
  setConfig(form)
  showToast('已儲存題目', 'success')
  const game = (route.params.gameName as string) || 'game1_guessword'
  router.push(`/game/${game}/quiz`)
}

function reset() {
  resetConfig()
  Object.assign(form, defaultConfig)
  applyDefaultFontIfAvailable()
  showToast('已重置為預設', 'warning')
}

function openStyleDialog(style: string) {
  editingStyle.value = style
  const current = form.blockStyleConfig?.[style] || defaultConfig.blockStyleConfig?.[style] || {}
  Object.assign(styleDraft, current)
  styleDialogOpen.value = true
  // 避免長按開啟後，放開滑鼠/手指剛好點到 backdrop 立刻關掉
  suppressBackdropClick = true
  setTimeout(() => { suppressBackdropClick = false }, 250)
}

function closeStyleDialog() {
  styleDialogOpen.value = false
}

function onDialogBackdropClick() {
  if (suppressBackdropClick) return
  closeStyleDialog()
}

function saveStyleDialog() {
  form.blockStyleConfig = {
    ...form.blockStyleConfig,
    [editingStyle.value]: { ...styleDraft },
  }
  form.blockStyle = editingStyle.value
  styleDialogOpen.value = false
  showToast('已套用樣式', 'success')
}

function pressStyle(style: string) {
  longPressTimer && clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    openStyleDialog(style)
  }, 450)
}

function releaseStyle() {
  longPressTimer && clearTimeout(longPressTimer)
  longPressTimer = null
}

function buildPreviewStyle(style: string, cfg: any) {
  const baseBox = {
    border: '1px solid #e2e8f0',
    width: '140px',
    height: '70px',
    borderRadius: '12px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }
  if (style === 'frosted') {
    const opacity = clamp01(cfg.opacity ?? 0.45)
    const blur = cfg.blur ?? 12
    return {
      boxStyle: {
        ...baseBox,
        background: colorWithAlpha('#ffffff', opacity),
        // 不透明時不應看到背景（也不需要 blur）
        backdropFilter: opacity >= 0.99 ? 'none' : `blur(${blur}px)`,
        WebkitBackdropFilter: opacity >= 0.99 ? 'none' : `blur(${blur}px)`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
        border: `1px solid ${cfg.border || '#e2e8f0'}`,
      },
      textOpacity: clamp01(1 - opacity),
    }
  }
  if (style === 'neon') {
    return {
      boxStyle: {
        ...baseBox,
        background: `linear-gradient(135deg, ${cfg.from || '#06b6d4'}, ${cfg.to || '#6366f1'})`,
        border: `1px solid ${cfg.border || '#e0f2fe'}`,
      },
      textOpacity: 0,
    }
  }
  if (style === 'silver') {
    return {
      boxStyle: {
        ...baseBox,
        background: `linear-gradient(160deg, ${cfg.from || '#e5e7eb'}, ${cfg.to || '#cbd5e1'})`,
        border: `1px solid ${cfg.border || '#cbd5e1'}`,
      },
      textOpacity: 0,
    }
  }
  if (style === 'plum') {
    return {
      boxStyle: {
        ...baseBox,
        background: `radial-gradient(circle at 30% 30%, ${cfg.from || '#a855f7'} 0%, ${cfg.to || '#4c1d95'} 70%)`,
        border: `1px solid ${cfg.border || '#f3e8ff'}`,
      },
      textOpacity: 0,
    }
  }
  // solid-dark
  return {
    boxStyle: {
      ...baseBox,
      background: cfg.fill || '#0f172a',
      border: `1px solid ${cfg.border || '#1f2937'}`,
    },
    textOpacity: 0,
  }
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1)
}

function colorWithAlpha(color: string, alpha: number) {
  const a = clamp01(alpha)
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.slice(0, 6)
    const bigint = parseInt(normalized, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  if (color.startsWith('rgb')) {
    return color.replace(/rgba?\(([^)]+)\)/, (_m, inner) => {
      const parts = inner.split(',').map((p: string) => p.trim()).slice(0, 3)
      return `rgba(${parts.join(',')}, ${a})`
    })
  }
  return color
}

function probeImage(url: string) {
  return new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('load error'))
    img.src = url
  })
}

function showToast(message: string, type: 'success' | 'warning' | 'error' = 'success') {
  toast.value = { message, type }
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 1800)
}
</script>

<style scoped>
.editor-shell {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 2rem 1rem 4rem;
}

.editor-card {
  width: 100%;
  max-width: 64rem;
  padding: 2rem 1.5rem;
  color: #0f172a;
}

.heading {
  margin-bottom: 1.5rem;
}

.heading h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
}

.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(125, 211, 252, 0.8);
}

.hint {
  font-size: 0.9375rem;
  color: rgba(100, 116, 139, 0.9);
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: #1f2937;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  color: #0f172a;
}

.color-field {
  gap: 0.25rem;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.5rem 0.75rem;
  height: 42px; /* 對齊 select/input 高度 */
}

.color-input {
  width: 42px;
  height: 28px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: transparent;
}

.color-input::-webkit-color-swatch-wrapper { padding: 0; }
.color-input::-webkit-color-swatch { border: none; border-radius: 0.45rem; }
.color-input::-moz-color-swatch { border: none; border-radius: 0.45rem; }

.color-hex {
  font-size: 0.75rem;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.two-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.row-4 {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 0.75rem;
}

.row-settings {
  display: grid;
  /* 以比例分配，避免固定寬度造成溢出 */
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 2.5fr) minmax(0, 6fr);
  gap: 0.75rem;
  align-items: end;
}

.row-settings > * {
  min-width: 0; /* 允許內容縮小，避免溢出 */
}

.row-settings input[type="number"],
.row-settings input[type="url"],
.row-settings select {
  height: 42px;
  box-sizing: border-box;
}

.row-settings .small-label {
  min-height: 18px;
  line-height: 18px;
}

.row-settings .url-wide .small-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.url-row {
  display: grid;
  /* 左：策略（可縮），右：網址（吃剩餘） */
  grid-template-columns: minmax(0,170px) minmax(0, 1fr);
  gap: 0.5rem;
  align-items: center;
}

.url-row input {
  width: 100%;
  min-width: 0;
}

.fit-select {
  width: 100%;
  max-width: 220px;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  color: #0f172a;
  height: 42px;
}

@media (max-width: 860px) {
  .row-4 {
    grid-template-columns: 1fr;
  }
  .row-settings {
    grid-template-columns: 1fr;
  }
}

.two-inline {
  gap: 0.5rem;
}

.inline-inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inline-inputs.single {
  gap: 0;
}

.inline-inputs input {
  width: 100%;
}

.grid-size-input {
  width: var(--ctl-width, 90px);
}

.inline-field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mini-label {
  font-size: 0.75rem;
  color: #64748b;
}

.divider {
  color: #64748b;
  font-size: 0.875rem;
}

.style-options {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}

.style-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  user-select: none;
}

.style-chip input {
  accent-color: #334155;
}

.chip-visual {
  width: 3rem;
  height: 2rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
}

.chip-label {
  font-size: 0.75rem;
  color: #334155;
}

.preview-solid-dark { background: #0f172a; }
.preview-frosted { background: rgba(255,255,255,0.4); }
.preview-neon { background: linear-gradient(135deg, #06b6d4, #6366f1); }
.preview-silver { background: linear-gradient(160deg, #e5e7eb, #cbd5e1); }
.preview-plum { background: radial-gradient(circle at 30% 30%, #a855f7 0%, #4c1d95 70%); }

.dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.dialog-card {
  width: 100%;
  max-width: 28rem;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 25px 60px rgba(15,23,42,0.16);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.dialog-close {
  font-size: 1.25rem;
  color: #64748b;
}

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog-body.two-pane {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 1rem;
}

.dialog-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #334155;
}

.dialog-field input[type="color"] {
  width: 3.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.dialog-field input[type="range"] {
  width: 100%;
}

.dialog-preview {
  margin-top: 0.25rem;
  display: grid;
  place-items: center;
  gap: 0.5rem;
  position: relative;
  padding: 0.75rem;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.75);
}

.dialog-preview .preview-bg {
  position: absolute;
  inset: 0.75rem;
  border-radius: 0.75rem;
  background:
    radial-gradient(circle at 20% 20%, rgba(14,165,233,0.35), transparent 55%),
    radial-gradient(circle at 80% 30%, rgba(236,72,153,0.28), transparent 55%),
    radial-gradient(circle at 40% 80%, rgba(34,197,94,0.22), transparent 55%),
    repeating-linear-gradient(135deg, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 12px, rgba(226,232,240,0.16) 12px, rgba(226,232,240,0.16) 24px);
  color: rgba(15,23,42,0.48);
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 2rem;
  letter-spacing: 0.25em;
  pointer-events: none;
  user-select: none;
  mix-blend-mode: multiply;
}

.dialog-preview .preview-box {
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 1px 2px rgba(15,23,42,0.08);
  position: relative;
  overflow: hidden;
  width: 140px;
  height: 70px;
  background: #fff;
}

.preview-text {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #0f172a;
  font-weight: 700;
  font-size: 1.25rem;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
}

.small-label {
  font-size: 0.75rem;
  color: #64748b;
}

.dialog-footer {
  display: flex;
  justify-content: end;
  gap: 0.5rem;
}

.chip-edit { display: none; }

.preview-card {
  margin-top: 1rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.7);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.preview-canvas {
  width: 100%;
  /* 與 QuizView 的非全螢幕畫布一致：最多 720px 並置中 */
  max-width: 720px;
  margin-inline: auto;
  border-radius: var(--preview-radius, 16px);
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  position: relative;
}

.preview-grid-guide {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  border-radius: inherit;
  border: var(--g, 2px) solid rgba(239, 68, 68, 0.75);
  background-image:
    linear-gradient(to right, rgba(239, 68, 68, 0.55) var(--g, 2px), transparent var(--g, 2px)),
    linear-gradient(to bottom, rgba(239, 68, 68, 0.55) var(--g, 2px), transparent var(--g, 2px));
  background-size: calc(100% / 3) calc(100% / 3);
}

.preview-hint {
  position: absolute;
  left: 15px;
  bottom: 10px;
  z-index: 3;
  pointer-events: none;
  user-select: none;
  /* 樣式沿用 .small-label（通用灰色） */
}

.canvas-options {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 0.25rem;
}

.option {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.option-title {
  font-size: 0.875rem;
  color: #334155;
}

.toggle {
  height: 42px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.45rem;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.85);
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  width: var(--ctl-width, 90px);
  justify-content: space-between;
}

.toggle-knob {
  width: 28px;
  height: 18px;
  border-radius: 9999px;
  position: relative;
  background: rgba(148, 163, 184, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.6);
  transition: background 180ms ease, border-color 180ms ease;
}

.toggle-knob::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #ffffff;
  transform: translateY(-50%);
  box-shadow: 0 2px 6px rgba(15,23,42,0.18);
  transition: left 180ms ease;
}

.toggle.on .toggle-knob {
  background: rgba(14, 165, 233, 0.65);
  border-color: rgba(14, 165, 233, 0.7);
}

.toggle.on .toggle-knob::after {
  left: 12px;
}

.toggle-text {
  min-width: 1.5rem;
  text-align: center;
}

.redframe-controls {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}

.thin-select {
  width: var(--ctl-width, 90px);
  height: 42px;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  background: rgba(255,255,255,0.85);
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0 0.55rem;
}

.thin-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions {
  display: flex;
  justify-content: end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.btn {
  padding: 0.5rem 0.9rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 150ms ease;
}

.btn.subtle {
  background: rgba(255,255,255,0.8);
  border: 1px solid #e2e8f0;
  color: #334155;
}

.btn.primary {
  background: linear-gradient(90deg, #0ea5e9, #7c3aed);
  color: #fff;
  box-shadow: 0 8px 18px rgba(14,165,233,0.35);
}

.footer-msg {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* toast 樣式已封裝到 FloatingToast */
</style>
