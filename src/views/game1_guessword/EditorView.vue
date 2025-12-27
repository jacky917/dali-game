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
        <!-- 權限：僅 user/admin 可設定標題與提示 -->
        <AuthGate :roles="['user', 'admin']">
          <label class="field">
            <span>標題</span>
            <input v-model="form.title" type="text" placeholder="今日題目" />
          </label>
        </AuthGate>

        <AuthGate :roles="['user', 'admin']">
          <label class="field">
            <span>提示敘述</span>
            <textarea v-model="form.clue" rows="3" placeholder="請根據提示猜出底圖文字"></textarea>
          </label>
        </AuthGate>

        <!-- 基本題目設定：文字、大小、字體、顏色 -->
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

        <!-- 方塊樣式選擇：長按可開啟編輯 dialog -->
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

        <!-- row-settings：一排控制格子/紅框/互動效果等（由 grid-template-columns 統一控寬） -->
        <div class="row-settings">
          <label class="field two-inline option">
            <span>格子數量</span>
            <div class="inline-inputs single">
              <div class="inline-field">
                <input class="grid-size-input" v-model.number="blockGridSize" type="number" min="1" max="9" />
              </div>
            </div>
            <span class="small-label">目前：{{ blockGridSize || 0 }} × {{ blockGridSize || 0 }}</span>
          </label>

          <div class="field option">
            <span>紅框</span>
            <div class="redframe-controls" aria-label="紅框設定（開關 / 數量 / 粗細）">
              <button
                type="button"
                class="toggle"
                :class="{ on: form.canvasGridGuide }"
                @click="form.canvasGridGuide = !form.canvasGridGuide"
              >
                <span class="toggle-knob"></span>
                <span class="toggle-text">{{ form.canvasGridGuide ? '開' : '關' }}</span>
              </button>
              <input
                class="grid-size-input"
                v-model.number="gridGuideSize"
                type="number"
                min="1"
                max="9"
                :disabled="!form.canvasGridGuide"
                aria-label="紅框數量（方形）"
              />
              <select
                class="thin-select"
                v-model.number="form.canvasGridThickness"
                :disabled="!form.canvasGridGuide"
                aria-label="紅框粗細"
              >
                <option :value="1">細</option>
                <option :value="2">中</option>
                <option :value="3">粗</option>
                <option :value="4">特粗</option>
              </select>
            </div>
            <span class="small-label">
              {{ form.canvasGridGuide ? `數量：${gridGuideSize || 0} × ${gridGuideSize || 0}` : '停用紅框' }}
            </span>
          </div>

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
            <span>音效</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.soundEnabled }"
              @click="form.soundEnabled = !form.soundEnabled"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.soundEnabled ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>

          <div class="field option">
            <span>Hover</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.hoverEnabled }"
              @click="form.hoverEnabled = !form.hoverEnabled"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.hoverEnabled ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>

          <div class="field option">
            <span>消失動畫</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.blockDisappearAnimEnabled }"
              @click="form.blockDisappearAnimEnabled = !form.blockDisappearAnimEnabled"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.blockDisappearAnimEnabled ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>

          <div class="field option">
            <span>再點重現</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.blockReappearOnClickEnabled }"
              @click="form.blockReappearOnClickEnabled = !form.blockReappearOnClickEnabled"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.blockReappearOnClickEnabled ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>

          <div class="field option">
            <span>顯示編號</span>
            <button
              type="button"
              class="toggle"
              :class="{ on: form.blockNumberEnabled }"
              @click="form.blockNumberEnabled = !form.blockNumberEnabled"
            >
              <span class="toggle-knob"></span>
              <span class="toggle-text">{{ form.blockNumberEnabled ? '開' : '關' }}</span>
            </button>
            <span class="small-label">&nbsp;</span>
          </div>
        </div>

        <!-- 顯示編號關閉時：整段「方塊編號樣式」收合並隱藏 -->
        <div
          class="number-settings-collapse"
          :class="{ open: form.blockNumberEnabled }"
          :aria-hidden="!form.blockNumberEnabled"
        >
          <div class="number-settings-inner">
            <div class="number-settings">
              <div class="number-settings-title">方塊編號樣式</div>
              <div class="number-settings-grid">
                <label class="field">
                  <span>字體</span>
                  <select v-model="form.blockNumberFont">
                    <option v-for="f in fontOptions" :key="f.value" :value="f.value">
                      {{ f.label }}
                    </option>
                  </select>
                </label>

                <label class="field">
                  <span>大小</span>
                  <input v-model.number="form.blockNumberSize" type="number" min="8" max="80" />
                </label>

                <label class="field color-field">
                  <span>顏色</span>
                  <div class="color-picker">
                    <input
                      v-model="form.blockNumberColor"
                      type="color"
                      class="color-input"
                      :style="{ background: form.blockNumberColor }"
                    />
                    <span class="color-hex">{{ form.blockNumberColor }}</span>
                  </div>
                </label>

                <label class="field">
                  <span>陰影</span>
                  <select v-model="form.blockNumberShadow">
                    <option value="none">無</option>
                    <option value="soft">柔和</option>
                    <option value="strong">強烈</option>
                    <option value="glow">發光</option>
                  </select>
                </label>

                <label class="field">
                  <span>樣式</span>
                  <select v-model="form.blockNumberStyle">
                    <option value="plain">純文字</option>
                    <option value="badge">圓牌</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 權限：僅 user/admin 可設定背景圖片（guest 一律遮蔽、避免洩露/排版混亂） -->
        <AuthGate :roles="['user', 'admin']">
          <label class="field bg-wide">
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
        </AuthGate>

        <!-- 即時預覽：Canvas 會隨容器大小自適應（含 DPR 渲染） -->
        <div class="preview-card">
          <div class="preview-header">
            <p class="eyebrow">即時預覽</p>
          </div>
          <div class="preview-canvas" :style="{ '--preview-radius': form.canvasRounded !== false ? '16px' : '0px' }">
            <GameCanvas :base-image="previewBaseImage" :rounded="form.canvasRounded !== false" :aspect-ratio="1" />
            <div class="preview-hint small-label">Ctrl + 方向鍵 調整文字位置</div>
          </div>
        </div>

        <!-- 主要動作：重置 / 儲存（依權限決定是否可儲存） -->
        <div class="actions">
          <button type="button" class="btn subtle" @click="reset">重置預設</button>
          <button type="submit" class="btn primary" :disabled="!canEditQuiz">儲存題目</button>
        </div>
      </form>

      <!-- 右下角浮動提示（復用元件，確保 z-index 在最上層） -->
      <FloatingToast :message="toast?.message ?? null" :mode="toast?.type ?? 'success'" />

      <!-- 樣式編輯 Dialog：使用 teleport 避免被父層 overflow 截斷 -->
      <teleport to="body">
        <transition name="dialog-fade">
          <div v-if="styleDialogOpen" class="dialog-backdrop" @click.self="onDialogBackdropClick">
            <div class="dialog-card">
              <header class="dialog-header">
                <h3>自訂樣式：{{ blockStyles.find(b => b.value === editingStyle)?.label }}</h3>
                <button type="button" class="dialog-close" @click="closeStyleDialog">×</button>
              </header>

              <div class="dialog-body two-pane">
                <div class="dialog-controls">
                  <div class="dialog-section">
                    <div class="dialog-section-title">共通設定</div>

                    <label class="dialog-field">
                      <span>翻開音效</span>
                      <div class="dialog-select-row">
                        <select v-model="styleDraft.soundOpen">
                          <option v-for="o in SOUND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                        </select>
                        <button type="button" class="mini-btn" @click="previewSound(styleDraft.soundOpen)">試聽</button>
                      </div>
                    </label>

                    <label class="dialog-field">
                      <span>蓋上音效</span>
                      <div class="dialog-select-row">
                        <select v-model="styleDraft.soundClose">
                          <option v-for="o in SOUND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                        </select>
                        <button type="button" class="mini-btn" @click="previewSound(styleDraft.soundClose)">試聽</button>
                      </div>
                    </label>

                    <label class="dialog-field">
                      <span>賓果音效</span>
                      <div class="dialog-select-row">
                        <select v-model="styleDraft.soundBingo">
                          <option v-for="o in SOUND_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                        </select>
                        <button type="button" class="mini-btn" @click="previewSound(styleDraft.soundBingo)">試聽</button>
                      </div>
                    </label>

                    <label class="dialog-field">
                      <span>Hover</span>
                      <select v-model="styleDraft.hoverFx">
                        <option v-for="o in HOVER_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                    </label>

                    <label class="dialog-field">
                      <span>消失動畫</span>
                      <select v-model="styleDraft.disappearAnim">
                        <option v-for="o in DISAPPEAR_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                    </label>
                  </div>

                  <div class="dialog-section">
                    <div class="dialog-section-title">樣式外觀</div>

                    <template v-if="editingStyle === 'solid-dark'">
                      <label class="dialog-field">
                        <span>填充顏色</span>
                        <input type="color" v-model="styleDraft.fill" />
                      </label>
                      <label class="dialog-field">
                        <span>邊框顏色</span>
                        <input type="color" v-model="styleDraft.border" />
                      </label>
                    </template>

                    <template v-else-if="editingStyle === 'frosted'">
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
                    </template>

                    <template v-else-if="editingStyle === 'neon'">
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
                    </template>

                    <template v-else-if="editingStyle === 'silver'">
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
                    </template>

                    <template v-else-if="editingStyle === 'plum'">
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
                    </template>
                  </div>
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
import { useGuesswordConfig, DEFAULT_BLOCK_STYLE_COMMON } from '@/composables/useGuesswordConfig'
import GameCanvas from '@/components/game1_guessword/GameCanvas.vue'
import { getFontOptions, loadLocalFonts } from '@/utils/localFonts'
import FloatingToast from '@/components/ui/FloatingToast.vue'
import { useAuth } from '@/composables/useAuth'
import { playSfx, getSfxOptions, type SfxId } from '@/utils/sfx'

/**
 * EditorView（猜字遊戲題庫編輯器）
 * - 目的：提供題目/底圖文字/遮罩方塊樣式的設定介面，並即時預覽
 * - 原則：UI 看得到的功能就能操作（依權限決定顯示/可編輯）
 * - 特別注意：
 *   1) 文字位置用 Ctrl/Cmd + 方向鍵微調（避免干擾輸入框）
 *   2) 「格子數量」與「紅框數量」為兩組獨立值，但各自維持方形 N×N
 *   3) 權限不足（guest）時：背景圖片在預覽與遊戲端都會被遮蔽，但資料仍留在 localStorage
 */

type ToastMode = 'success' | 'warning' | 'error'

// ---------------------------
// Router & Config
// ---------------------------
const router = useRouter()
const route = useRoute()
const { quizConfig, setConfig, resetConfig, defaultConfig } = useGuesswordConfig()

// 以 reactive 複製一份供表單編輯（避免直接改動儲存狀態造成副作用）
const form = reactive({ ...quizConfig.value })

// ---------------------------
// Auth / Permission
// ---------------------------
const { canEditQuiz, canEditStyles, hasRole } = useAuth()
const canViewAdvanced = computed(() => hasRole(['user', 'admin']))

// ---------------------------
// UI State
// ---------------------------
const toast = ref<{ message: string; type: ToastMode } | null>(null)
let toastTimer: number | null = null
const bgStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')
const bgError = ref('')
const fontOptions = ref(getFontOptions())

// ---------------------------
// 樣式長按編輯 Dialog
// ---------------------------
const styleDialogOpen = ref(false)
const editingStyle = ref('solid-dark')
const styleDraft = reactive<any>({})
const dialogPreview = computed<any>(() => buildPreviewStyle(editingStyle.value, styleDraft))
let longPressTimer: any = null
let suppressBackdropClick = false

// ---------------------------
// UI：樣式選項（Chip）
// ---------------------------
const blockStyles = [
  { value: 'solid-dark', label: '深色實心' },
  { value: 'frosted', label: '霧面玻璃' },
  { value: 'neon', label: '復古粗框' },
  { value: 'silver', label: '撞球' },
  { value: 'plum', label: '深紫霧光' },
]

// ---------------------------
// 共通選項（所有方塊樣式共用）
// - 音效選項改為「自動讀入」：內建 pop + src/assets/sfx/** 資產音效
// ---------------------------
const SOUND_OPTIONS = getSfxOptions()

const HOVER_OPTIONS = [
  { value: 'glow', label: 'Glow（微光）' },
  { value: 'lift', label: 'Lift（輕微上浮）' },
  { value: 'top', label: 'Top（置頂上浮）' },
]

const DISAPPEAR_OPTIONS = [
  { value: 'fade', label: 'Fade（淡出）' },
  { value: 'scale', label: 'Scale（縮小淡出）' },
]

// Dialog 的共通預設值：與遊戲端 defaultConfig 共用同一份，避免預設不一致
const COMMON_STYLE_DEFAULTS = { ...DEFAULT_BLOCK_STYLE_COMMON }

// 在 Editor 內試聽音效（不影響遊戲邏輯）
function previewSound(id: any) {
  if (!id) return
  void playSfx(id as SfxId, 0.35)
}

// ---------------------------
// Canvas 預覽資料（傳給 GameCanvas）
// ---------------------------
const previewBaseImage = computed(() => ({
  text: form.displayText,
  textColor: form.textColor,
  fontSize: form.fontSize,
  font: form.font,
  textX: form.textX,
  textY: form.textY,
  // 權限不足時：背景不應顯示（但仍保留在儲存中，供 user/admin 回來使用）
  backgroundUrl: canViewAdvanced.value ? form.backgroundUrl : '',
  backgroundFit: form.backgroundFit,
  canvasGridGuide: form.canvasGridGuide,
  canvasGridThickness: form.canvasGridThickness,
  canvasGridRows: form.canvasGridRows,
  canvasGridCols: form.canvasGridCols,
  blockRows: form.blockRows,
  blockCols: form.blockCols,
  aspectRatio: 4 / 3,
}))

// ---------------------------
// 字體：教育部標準楷書（若本地有放入，就自動切換到它）
// ---------------------------
const EDUKAI_LOCAL_FAMILY = 'local-edukai-5-0'

function applyDefaultFontIfAvailable() {
  // 只在「還是預設字體」的情況下自動套用，避免覆蓋使用者自選
  const isDefaultFont = !form.font || form.font === defaultConfig.font
  if (!isDefaultFont) return

  const hasEdukai = fontOptions.value.some((f) => f.value === EDUKAI_LOCAL_FAMILY)
  form.font = hasEdukai ? EDUKAI_LOCAL_FAMILY : defaultConfig.font
}

// ---------------------------
// 文字位置微調（Ctrl/Cmd + 方向鍵）
// ---------------------------
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

// ---------------------------
// 表單欄位：題目文字（displayText/answer 兩者同步）
// ---------------------------
const unifiedText = computed({
  get() {
    return form.displayText || form.answer || ''
  },
  set(v: string) {
    form.displayText = v
    form.answer = v
  },
})

// ---------------------------
// row-settings：格子/紅框數量（分開設置，但各自維持方形 N×N）
// ---------------------------
const blockGridSize = computed({
  get() {
    const v = Number(form.blockRows) || Number(form.blockCols) || 3
    return Math.min(9, Math.max(1, v))
  },
  set(v: number) {
    const n = Math.min(9, Math.max(1, Number(v) || 1))
    form.blockRows = n
    form.blockCols = n
  },
})

const gridGuideSize = computed({
  get() {
    const v = Number(form.canvasGridRows) || Number(form.canvasGridCols) || blockGridSize.value || 3
    return Math.min(9, Math.max(1, v))
  },
  set(v: number) {
    const n = Math.min(9, Math.max(1, Number(v) || 1))
    form.canvasGridRows = n
    form.canvasGridCols = n
  },
})

// ---------------------------
// 背景圖片：即時檢測（避免填入不可用/跨域圖片後還以為有效）
// - guest 會被遮蔽，所以監聽來源也要一起遮蔽（避免不必要的 loading）
// ---------------------------
watch(
  () => (canViewAdvanced.value ? form.backgroundUrl : ''),
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

// ---------------------------
// 主要操作：儲存 / 重置
// ---------------------------
function handleSave() {
  if (!canEditQuiz.value) {
    showToast('目前權限僅可查看，無法儲存（請用 user / admin）', 'warning')
    return
  }
  // 確保答案與底圖文字一致
  form.answer = unifiedText.value
  form.displayText = unifiedText.value
  // 依需求：格子數量與紅框數量各自獨立，但皆為方形（寬高相等）
  const n = Math.min(9, Math.max(1, Number(blockGridSize.value) || 1))
  const g = Math.min(9, Math.max(1, Number(gridGuideSize.value) || n))
  form.blockRows = n
  form.blockCols = n
  form.canvasGridRows = g
  form.canvasGridCols = g
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

// ---------------------------
// Dialog：開啟 / 關閉 / 套用
// ---------------------------
function openStyleDialog(style: string) {
  editingStyle.value = style
  const current = form.blockStyleConfig?.[style] || defaultConfig.blockStyleConfig?.[style] || {}
  Object.assign(styleDraft, COMMON_STYLE_DEFAULTS, current)
  // migrate: soundAllOpen -> soundBingo
  if (!styleDraft.soundBingo && styleDraft.soundAllOpen) styleDraft.soundBingo = styleDraft.soundAllOpen
  styleDialogOpen.value = true
  // 避免長按開啟後，放開滑鼠/手指剛好點到 backdrop 立刻關掉
  suppressBackdropClick = true
  setTimeout(() => {
    suppressBackdropClick = false
  }, 250)
}

function closeStyleDialog() {
  styleDialogOpen.value = false
}

function onDialogBackdropClick() {
  if (suppressBackdropClick) return
  closeStyleDialog()
}

function saveStyleDialog() {
  if (!canEditStyles.value) {
    showToast('目前權限無法修改樣式（請用 user / admin）', 'warning')
    styleDialogOpen.value = false
    return
  }
  form.blockStyleConfig = {
    ...form.blockStyleConfig,
    [editingStyle.value]: {
      ...styleDraft,
      // 向後相容：保存兩個欄位，避免舊程式碼讀不到
      soundAllOpen: styleDraft.soundBingo || styleDraft.soundAllOpen,
    },
  }
  form.blockStyle = editingStyle.value
  styleDialogOpen.value = false
  showToast('已套用樣式', 'success')
}

// ---------------------------
// 長按開啟 Dialog（PC：mouse、Mobile：touch）
// ---------------------------
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

// ---------------------------
// Dialog 右側預覽：依 style 產生預覽盒子的 inline style
// - 注意：此預覽只做「大致」效果，避免和正式的 BlockMaskGrid CSS 綁死
// ---------------------------
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

// ---------------------------
// 小工具：數值 clamp / 顏色加 alpha / 背景圖片探測 / Toast
// ---------------------------
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
  /* 八個欄位共用同一套欄寬，方便統一調整：
     格子數量 / 紅框（含數量/粗細） / 圓角 / 音效 / Hover / 消失動畫 / 再點重現 / 顯示編號 */
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 3fr)
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr)
    minmax(0, 1fr);
  gap: 1rem;
  align-items: end;
  /* 1) 可調整左右兩側留白（百分比、左右一致）
     用法：在此改成 2% / 4% 等，或在父層用 style 覆寫 --row-side-pad */
  padding-inline: var(--row-side-pad, 0%);
  box-sizing: border-box;
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

.row-settings .toggle,
.row-settings .thin-select,
.row-settings .grid-size-input,
.row-settings .fit-select {
  /* 2) row-settings 內部元件寬度一律 100%，交由 grid/gap 控制 */
  width: 100%;
  max-width: 100%;
}

.row-settings .toggle {
  --ctl-width: 100%;
}

.row-settings .redframe-controls {
  width: 100%;
}

.row-settings .small-label {
  min-height: 18px;
  line-height: 18px;
}

.bg-wide .small-label {
  min-height: 18px;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bg-wide input[type="url"],
.bg-wide select {
  height: 42px;
  box-sizing: border-box;
}

.number-settings {
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.55);
}

.number-settings-collapse {
  display: grid;
  grid-template-rows: 0fr;
  margin-top: 0;
  transition:
    grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
    margin-top 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.number-settings-collapse.open {
  grid-template-rows: 1fr;
  margin-top: 0.25rem;
}

.number-settings-inner {
  overflow: hidden;
  min-height: 0;
}

.number-settings-collapse:not(.open) {
  pointer-events: none;
}

.number-settings-collapse .number-settings {
  opacity: 0;
  transform: translateY(-6px);
  filter: blur(2px);
  transition:
    opacity 180ms ease,
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.number-settings-collapse.open .number-settings {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .number-settings-collapse,
  .number-settings-collapse .number-settings {
    transition: none !important;
  }
}

.number-settings-title {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(100, 116, 139, 0.9);
  margin-bottom: 0.65rem;
}

.number-settings-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 0.75rem;
  align-items: end;
}

@media (max-width: 860px) {
  .number-settings-grid {
    grid-template-columns: 1fr;
  }
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

.grid-size-input:disabled {
  /* 需求：紅框關閉時，紅框數量的字體要變灰（與 disabled 的粗細 select 一致） */
  color: #94a3b8; /* slate-400 */
  -webkit-text-fill-color: #94a3b8;
  opacity: 0.6;
  cursor: not-allowed;
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
  position: relative;
  overflow: hidden;
}

.chip-label {
  font-size: 0.75rem;
  color: #334155;
}

.preview-solid-dark { background: #0f172a; }
.preview-frosted { background: rgba(255,255,255,0.4); }
.preview-neon {
  border-radius: 0.75rem;
  background: linear-gradient(180deg, #f7f8fa, #eef1f5);
  box-shadow:
    inset 0 0 0 8px #84cc16,
    inset 0 0 0 14px #4d7c0f,
    inset 0 2px 0 #ffffff,
    inset 0 -6px 10px rgba(15, 23, 42, 0.08);
}
.preview-silver {
  border-radius: 9999px;
  background:
    linear-gradient(135deg, rgba(255,255,255,0.38), rgba(255,255,255,0.0) 42%),
    radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98), rgba(255,255,255,0.0) 34%),
    radial-gradient(circle at 64% 76%, rgba(255,255,255,0.14), rgba(255,255,255,0.0) 60%),
    radial-gradient(circle at 50% 62%, rgba(0,0,0,0.30), rgba(0,0,0,0.0) 58%),
    radial-gradient(circle at 42% 45%, #1f2937, #0b1220 78%);
  box-shadow:
    inset 0 0 0 2px rgba(255,255,255,0.55),
    inset 0 12px 20px rgba(255,255,255,0.22),
    inset 0 -18px 26px rgba(0,0,0,0.26),
    0 10px 20px rgba(15,23,42,0.18);
}
.preview-silver::before {
  content: '';
  position: absolute;
  inset: 6%;
  border-radius: 9999px;
  background: radial-gradient(circle at 22% 18%, rgba(255,255,255,0.45), rgba(255,255,255,0.0) 55%);
}
.preview-silver::after {
  content: '';
  position: absolute;
  inset: 28%;
  border-radius: 9999px;
  background:
    radial-gradient(circle at 30% 30%, #ffffff, #e5e7eb 70%);
  box-shadow:
    inset 0 2px 4px rgba(15,23,42,0.08),
    0 2px 8px rgba(15,23,42,0.10);
}
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

.dialog-field select {
  width: 100%;
  height: 42px;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.85);
  color: #0f172a;
}

.dialog-select-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.mini-btn {
  height: 42px;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  color: rgba(15, 23, 42, 0.8);
  font-weight: 700;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  cursor: pointer;
}

.mini-btn:hover {
  background: rgba(255, 255, 255, 1);
}

.mini-btn:active {
  transform: translateY(1px);
}

.mini-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.25);
}

.dialog-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.9rem;
  border: 1px solid #e2e8f0;
  background: rgba(248, 250, 252, 0.75);
}

.dialog-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(100, 116, 139, 0.9);
  margin-bottom: 0.15rem;
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

/* preview-grid-guide 已改為 canvasRenderer 繪製（在題目文字之下） */

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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.7fr) minmax(0, 1.3fr);
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

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  filter: grayscale(0.1);
  box-shadow: none;
}

.btn.primary:disabled {
  background: linear-gradient(90deg, rgba(14,165,233,0.55), rgba(124,58,237,0.55));
}

.footer-msg {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #64748b;
}

/* toast 樣式已封裝到 FloatingToast */
</style>
