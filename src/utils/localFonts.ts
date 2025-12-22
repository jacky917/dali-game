type FontOption = { label: string; value: string }

const SYSTEM_FONT_OPTIONS: FontOption[] = [
  // 「必定有」的做法只能用 generic family
  { label: '系統無襯線（sans-serif）', value: 'sans-serif' },
  { label: '系統襯線（serif）', value: 'serif' },
]

let cachedLocalOptions: FontOption[] = []
let loadPromise: Promise<FontOption[]> | null = null

function sanitizeFamilyName(name: string) {
  return `local-${name}`
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

function hashToBase36(input: string) {
  // 簡單穩定 hash（避免中文檔名導致 family 變空或重複）
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function getFormat(filename: string) {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.woff2')) return 'woff2'
  if (lower.endsWith('.woff')) return 'woff'
  if (lower.endsWith('.ttf')) return 'truetype'
  if (lower.endsWith('.otf')) return 'opentype'
  return null
}

type ManifestFont = {
  file: string
  label?: string
  family?: string
  weight?: string | number
  style?: 'normal' | 'italic' | 'oblique'
}

type Manifest = {
  fonts: ManifestFont[]
}

function getBaseName(filename: string) {
  return filename.replace(/\.(woff2|woff|ttf|otf)$/i, '')
}

function ensureUniqueFamily(rawFamily: string, seen: Set<string>, salt: string) {
  let family = rawFamily
  if (!family || family === 'local' || family === 'local-') {
    family = `local-${hashToBase36(salt)}`
  }
  if (seen.has(family)) {
    family = `local-${hashToBase36(`${salt}-${family}`)}`
  }
  seen.add(family)
  return family
}

async function loadFontFace(
  family: string,
  url: string,
  fmt: string,
  weight: string | number = '400',
  style: 'normal' | 'italic' | 'oblique' = 'normal'
) {
  const face = new FontFace(family, `url(${url}) format("${fmt}")`, {
    weight: String(weight),
    style,
    // @ts-expect-error - 部分瀏覽器支援 display descriptor
    display: 'swap',
  })
  await face.load()
  ;(document as any).fonts.add(face)
}

async function loadBundledFonts(seen: Set<string>): Promise<FontOption[]> {
  // 打包內字體：src/assets/fonts/**（Vite build 時會 hash 但 URL 會自動重寫）
  const files = import.meta.glob('../assets/fonts/**/*.{woff2,woff,ttf,otf}', {
    eager: true,
    query: '?url',
    import: 'default',
  }) as Record<string, string>

  const next: FontOption[] = []

  for (const [path, url] of Object.entries(files)) {
    try {
      if (typeof url !== 'string' || !url) continue
      const filename = path.split('/').pop() || path
      const base = getBaseName(filename)
      const fmt = getFormat(filename)
      if (!fmt) continue

      const familyRaw = sanitizeFamilyName(base)
      const family = ensureUniqueFamily(familyRaw, seen, path)

      await loadFontFace(family, url, fmt)
      next.push({ label: `本地：${base}`, value: family })
    } catch {
      // ignore（不支援/壞檔/載入失敗都跳過）
    }
  }

  return next
}

async function loadExternalFontsFromManifest(seen: Set<string>): Promise<FontOption[]> {
  // 部署後可擴充：public/fonts/manifest.json + public/fonts/*.ttf...
  // 使用 BASE_URL 兼容子路徑部署（例如 /dali-game/）
  const baseUrl = ((import.meta as any).env?.BASE_URL as string | undefined) || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const join = (p: string) => `${normalizedBase}${p.replace(/^\/+/, '')}`

  try {
    const res = await fetch(join('fonts/manifest.json'), { cache: 'no-store' })
    if (!res.ok) return []
    const data = (await res.json()) as Manifest
    if (!data || !Array.isArray(data.fonts)) return []

    const next: FontOption[] = []

    for (const f of data.fonts) {
      try {
        if (!f || typeof f.file !== 'string' || !f.file) continue
        const filename = f.file.split('/').pop() || f.file
        const fmt = getFormat(filename)
        if (!fmt) continue

        const base = getBaseName(filename)
        const familyRaw = f.family ? String(f.family) : sanitizeFamilyName(base)
        const family = ensureUniqueFamily(familyRaw, seen, f.file)
        const label = f.label ? String(f.label) : `本地：${base}`

        const fileUrl = join(`fonts/${f.file}`)
        await loadFontFace(family, fileUrl, fmt, f.weight ?? '400', f.style ?? 'normal')
        next.push({ label, value: family })
      } catch {
        // ignore
      }
    }

    return next
  } catch {
    return []
  }
}

export async function loadLocalFonts(): Promise<FontOption[]> {
  // 已載入過就直接回傳，避免重複 load FontFace（也避免 Editor 反覆進出時浪費）
  if (cachedLocalOptions.length > 0) return cachedLocalOptions
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const seen = new Set<string>()

    // 沒有 FontFace API 時：無法驗證載入成功與否，只能保守地不加入本地字體
    if (typeof FontFace === 'undefined' || typeof document === 'undefined' || !('fonts' in document)) {
      cachedLocalOptions = []
      return cachedLocalOptions
    }

    const bundled = await loadBundledFonts(seen)
    const external = await loadExternalFontsFromManifest(seen)

    cachedLocalOptions = [...bundled, ...external]
    return cachedLocalOptions
  })()

  return loadPromise
}

export function getFontOptions(): FontOption[] {
  return [...SYSTEM_FONT_OPTIONS, ...(cachedLocalOptions || [])]
}

// 給 main.ts 一鍵呼叫：開始背景載入（不阻塞）
export function initLocalFonts() {
  void loadLocalFonts()
}

