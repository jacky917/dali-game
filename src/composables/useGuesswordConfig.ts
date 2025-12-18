import { ref, watch } from 'vue'

const STORAGE_KEY = 'guessword-quiz-config'

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
  // 遊戲區域外觀（兩種模式共用）
  canvasRounded: false,
  canvasGridGuide: true,
  canvasGridThickness: 2,
  blockRows: 3,
  blockCols: 3,
  blockStyle: 'solid-dark',
  blockStyleConfig: {
    'solid-dark': { fill: '#0f172a', border: '#1f2937' },
    frosted: { tint: '#ffffff', blur: 12, border: '#e2e8f0', opacity: 0.45 },
    neon: { from: '#06b6d4', to: '#6366f1', border: '#e0f2fe' },
    silver: { from: '#e5e7eb', to: '#cbd5e1', border: '#cbd5e1' },
    plum: { from: '#a855f7', to: '#4c1d95', border: '#f3e8ff' },
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
    if (typeof parsed.textX !== 'number') parsed.textX = 0.5
    if (typeof parsed.textY !== 'number') parsed.textY = 0.5
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
