import { ref, watch } from 'vue'

const STORAGE_KEY = 'guessword-quiz-config'

/**
 * 遊戲 / 編輯器 共用的「預設音效」集中管理
 * - 翻開：pop-1
 * - 蓋上：pop-2
 * - 賓果：pop-10（顯示答案 / 全部翻開時播放）
 *
 * 之後要調整預設音效，只改這裡即可。
 */
export const DEFAULT_BLOCK_SFX = {
  open: 'pop-1',
  close: 'pop-2',
  bingo: 'pop-10',
} as const

/**
 * 方塊樣式的「共通預設值」：所有 style 都會有的欄位
 * - Editor 的 style dialog 也會用這份當預設，確保行為一致
 */
export const DEFAULT_BLOCK_STYLE_COMMON = {
  soundOpen: DEFAULT_BLOCK_SFX.open,
  soundClose: DEFAULT_BLOCK_SFX.close,
  soundBingo: DEFAULT_BLOCK_SFX.bingo,
  // 向後相容：舊欄位保留
  soundAllOpen: DEFAULT_BLOCK_SFX.bingo,
  hoverFx: 'glow',
  disappearAnim: 'fade',
} as const

const defaultConfig = {
  title: '',
  clue: '',
  answer: '天',
  displayText: '天',
  textColor: '#111111',
  fontSize: 750,
  // 預設用跨平台系統字體（本地字體載入成功後，Editor 會自動切到 edukai）
  font: 'sans-serif',
  // 文字位置（以畫布百分比表示，0~1）
  textX: 0.5,
  textY: 0.5,
  backgroundUrl: '',
  backgroundFit: 'cover',
  // 其他開關（功能可擴充）
  soundEnabled: true,
  hoverEnabled: true,
  blockDisappearAnimEnabled: true,
  blockReappearOnClickEnabled: true,
  blockNumberEnabled: false,
  blockNumberFont: 'sans-serif',
  blockNumberSize: 50,
  blockNumberColor: '#111111',
  blockNumberShadow: 'soft',
  blockNumberStyle: 'badge',
  // 遊戲區域外觀（兩種模式共用）
  canvasRounded: false,
  canvasGridGuide: true,
  canvasGridThickness: 2,
  canvasGridRows: 3,
  canvasGridCols: 3,
  blockRows: 3,
  blockCols: 3,
  blockStyle: 'solid-dark',
  blockStyleConfig: {
    'solid-dark': {
      fill: '#0f172a',
      border: '#1f2937',
      ...DEFAULT_BLOCK_STYLE_COMMON,
    },
    frosted: {
      tint: '#ffffff',
      blur: 12,
      border: '#e2e8f0',
      opacity: 0.45,
      ...DEFAULT_BLOCK_STYLE_COMMON,
    },
    neon: {
      // 復古粗框：外框色
      from: '#84cc16',
      to: '#4d7c0f',
      border: '#e0f2fe',
      ...DEFAULT_BLOCK_STYLE_COMMON,
    },
    silver: {
      // 撞球：球體主色/陰影色（預設做成黑球質感）
      from: '#1f2937',
      to: '#0b1220',
      border: '#ffffff',
      ...DEFAULT_BLOCK_STYLE_COMMON,
    },
    plum: {
      from: '#a855f7',
      to: '#4c1d95',
      border: '#f3e8ff',
      ...DEFAULT_BLOCK_STYLE_COMMON,
    },
  },
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultConfig }
    const parsed = { ...defaultConfig, ...JSON.parse(raw) }
    // 舊版本用預設字串當「值」，這裡遷移成 placeholder 行為
    if (parsed.title === '今日題目') parsed.title = ''
    if (parsed.clue === '請根據提示猜出底圖文字') parsed.clue = ''
    if (!parsed.backgroundFit) parsed.backgroundFit = 'cover'
    if (parsed.canvasRounded === undefined) parsed.canvasRounded = false
    if (parsed.canvasGridGuide === undefined) parsed.canvasGridGuide = true
    if (parsed.canvasGridThickness === undefined) parsed.canvasGridThickness = 2
    if (typeof parsed.canvasGridRows !== 'number') parsed.canvasGridRows = Number(parsed.blockRows) || 3
    if (typeof parsed.canvasGridCols !== 'number') parsed.canvasGridCols = Number(parsed.blockCols) || 3
    if (typeof parsed.textX !== 'number') parsed.textX = 0.5
    if (typeof parsed.textY !== 'number') parsed.textY = 0.5
    if (typeof parsed.blockNumberEnabled !== 'boolean') parsed.blockNumberEnabled = false
    if (!parsed.blockNumberFont) parsed.blockNumberFont = 'sans-serif'
    if (typeof parsed.blockNumberSize !== 'number') parsed.blockNumberSize = 50
    if (!parsed.blockNumberColor) parsed.blockNumberColor = '#111111'
    if (!parsed.blockNumberShadow) parsed.blockNumberShadow = 'soft'
    if (!parsed.blockNumberStyle) parsed.blockNumberStyle = 'badge'
    return parsed
  } catch {
    return { ...defaultConfig }
  }
}

const quizConfig = ref(loadFromStorage())

watch(
  quizConfig,
  (v) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v))
  },
  { deep: true }
)

function setConfig(partial: Partial<typeof defaultConfig>) {
  quizConfig.value = { ...quizConfig.value, ...partial }
}

function resetConfig() {
  quizConfig.value = { ...defaultConfig }
}

export function useGuesswordConfig() {
  return { quizConfig, setConfig, resetConfig, defaultConfig }
}
