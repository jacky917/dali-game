type BuiltinSfxId =
  | 'pop-1'
  | 'pop-2'
  | 'pop-3'
  | 'pop-4'
  | 'pop-5'
  | 'pop-6'
  | 'pop-7'
  | 'pop-8'
  | 'pop-9'
  | 'pop-10'

/**
 * SfxId
 * - 內建：pop-1 ~ pop-10（WebAudio 震盪器合成）
 * - 資產：asset:<id>（從 src/assets/sfx/** 自動讀入音效檔）
 *
 * 例：
 * - playSfx('pop-1')
 * - playSfx('asset:correct')  // 對應 src/assets/sfx/correct.mp3（或 wav/ogg/m4a）
 */
export type SfxId = BuiltinSfxId | `asset:${string}`

type SfxOption = { label: string; value: SfxId }

function sanitizeId(name: string) {
  return String(name)
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

function hashToBase36(input: string) {
  // 簡單穩定 hash（避免同名檔案或路徑差異導致 id 重複）
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function ensureUniqueId(raw: string, seen: Set<string>, salt: string) {
  let id = raw
  if (!id) id = `sfx-${hashToBase36(salt)}`
  if (seen.has(id)) id = `${id}-${hashToBase36(`${salt}-${id}`)}`
  seen.add(id)
  return id
}

// 讀入 src/assets/sfx/**（由 Vite 打包、URL 會自動重寫）
// @ts-expect-error - Vite 才支援 import.meta.glob（TS linter 可能不認得）
const ASSET_SFX_FILES = import.meta.glob('../assets/sfx/**/*.{mp3,wav,ogg,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const assetUrlById = new Map<string, string>()
const assetLabelById = new Map<string, string>() // 記住原始檔名（去副檔名）供 UI 顯示

;(() => {
  const seen = new Set<string>()
  for (const [path, url] of Object.entries(ASSET_SFX_FILES)) {
    if (typeof url !== 'string' || !url) continue
    const filename = path.split('/').pop() || path
    const basename = filename.replace(/\.(mp3|wav|ogg|m4a)$/i, '')
    const raw = sanitizeId(filename)
    const id = ensureUniqueId(raw, seen, path)
    const fullId = `asset:${id}`
    assetUrlById.set(fullId, url)
    assetLabelById.set(fullId, basename) // 保留原始檔名（去副檔名）
  }
})()

/**
 * 取得音效下拉選項（內建 + assets）
 * - 注意：目前 UI 若要顯示這些選項，請用這個函式取代寫死的 SOUND_OPTIONS
 */
export function getSfxOptions(): SfxOption[] {
  const builtin: SfxOption[] = [
    { value: 'pop-1', label: 'Pop 1（輕快）' },
    { value: 'pop-2', label: 'Pop 2（厚實）' },
    { value: 'pop-3', label: 'Pop 3（俐落）' },
    { value: 'pop-4', label: 'Pop 4（柔和）' },
    { value: 'pop-5', label: 'Pop 5（雙音）' },
    { value: 'pop-6', label: 'Pop 6（亮音）' },
    { value: 'pop-7', label: 'Pop 7（鈴聲）' },
    { value: 'pop-8', label: 'Pop 8（短促）' },
    { value: 'pop-9', label: 'Pop 9（低沉）' },
    { value: 'pop-10', label: 'Pop 10（賓果）' },
  ]

  const assets: SfxOption[] = Array.from(assetUrlById.keys())
    .sort()
    .map((id) => ({
      value: id as SfxId,
      label: `本地：${assetLabelById.get(id) || id.replace(/^asset:/, '')}`,
    }))

  return [...builtin, ...assets]
}

let ctx: AudioContext | null = null
const assetBufferCache = new Map<string, AudioBuffer>()

function getCtx() {
  if (ctx) return ctx
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  return ctx
}

function now(c: AudioContext) {
  return c.currentTime
}

export async function playSfx(id: SfxId, volume = 0.35) {
  const v = Math.min(Math.max(volume, 0), 1)

  // 資產音效：優先用 WebAudio 播放（更一致的音量/延遲），沒有 AudioContext 時 fallback 用 <audio>
  if (String(id).startsWith('asset:')) {
    const url = assetUrlById.get(String(id))
    if (!url) return

    const c = getCtx()
    if (!c) {
      try {
        const a = new Audio(url)
        a.volume = v
        // 避免被瀏覽器阻擋時 throw
        await a.play()
      } catch {
        /* ignore */
      }
      return
    }

    if (c.state === 'suspended') {
      try { await c.resume() } catch { /* ignore */ }
    }

    try {
      let buffer = assetBufferCache.get(url)
      if (!buffer) {
        const res = await fetch(url)
        const ab = await res.arrayBuffer()
        buffer = await c.decodeAudioData(ab)
        assetBufferCache.set(url, buffer)
      }

      const src = c.createBufferSource()
      src.buffer = buffer
      const gain = c.createGain()
      gain.gain.setValueAtTime(Math.max(0.0001, v), c.currentTime)
      src.connect(gain)
      gain.connect(c.destination)
      src.start()
    } catch {
      // 失敗就不播（避免破壞互動）
    }
    return
  }

  // 內建合成音效
  const c = getCtx()
  if (!c) return

  // 某些瀏覽器需要 user gesture 後 resume
  if (c.state === 'suspended') {
    try { await c.resume() } catch { /* ignore */ }
  }

  const t0 = now(c)

  const playOne = (
    type: OscillatorType,
    fStart: number,
    fEnd: number,
    dur: number,
    v: number,
    detune = 0,
    t = t0
  ) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    if (detune) osc.detune.setValueAtTime(detune, t)
    osc.frequency.setValueAtTime(Math.max(40, fStart), t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, fEnd), t + dur * 0.65)

    const peak = Math.max(0.0001, v)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(peak, t + Math.min(0.012, dur * 0.25))
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  switch (id as BuiltinSfxId) {
    case 'pop-1':
      playOne('triangle', 900, 520, 0.11, v)
      break
    case 'pop-2':
      playOne('sine', 520, 220, 0.13, v)
      break
    case 'pop-3':
      playOne('square', 760, 320, 0.12, v * 0.85)
      break
    case 'pop-4':
      playOne('sawtooth', 420, 180, 0.14, v * 0.75)
      break
    case 'pop-5':
      // 雙音（微 detune）更厚實
      playOne('triangle', 680, 260, 0.14, v * 0.55, -9)
      playOne('triangle', 680, 260, 0.14, v * 0.55, +9)
      break
    case 'pop-6':
      // 向上 chirp（比較亮）
      playOne('sine', 240, 860, 0.12, v * 0.8)
      break
    case 'pop-7':
      // 小鈴鐺感（高頻短促）
      playOne('sine', 880, 660, 0.18, v * 0.6)
      playOne('sine', 1320, 990, 0.14, v * 0.35, 0, t0 + 0.01)
      break
    case 'pop-8':
      // 更短的 click-pop
      playOne('triangle', 1200, 520, 0.09, v * 0.75)
      break
    case 'pop-9':
      // 比較低沉的 plop
      playOne('sine', 260, 120, 0.16, v * 0.85)
      break
    case 'pop-10':
      // 賓果：簡單三音（很短的上行）
      playOne('sine', 523.25, 523.25, 0.12, v * 0.55, 0, t0 + 0.0)  // C5
      playOne('sine', 659.25, 659.25, 0.12, v * 0.55, 0, t0 + 0.09) // E5
      playOne('sine', 783.99, 783.99, 0.14, v * 0.6, 0, t0 + 0.18)  // G5
      break
  }
}

