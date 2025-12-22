export async function renderBaseImage(
  canvas: HTMLCanvasElement,
  config: any,
  opts: { width?: number; height?: number; dpr?: number } = {}
) {
  const ctx = canvas.getContext('2d')!
  const fit = config.backgroundFit || 'cover' // cover | contain | stretch

  // 讓 canvas 解析度跟著顯示尺寸（含 DPR），避免放大後鋸齒/糊
  const dpr = opts.dpr || window.devicePixelRatio || 1
  const w = Math.max(1, Math.round((opts.width || canvas.getBoundingClientRect().width || 480) * dpr))
  const h = Math.max(1, Math.round((opts.height || canvas.getBoundingClientRect().height || 360) * dpr))
  canvas.width = w
  canvas.height = h

  // 用 CSS 像素為座標系繪製
  const cssW = w / dpr
  const cssH = h / dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.imageSmoothingEnabled = true
  // @ts-ignore
  ctx.imageSmoothingQuality = 'high'

  // background
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, cssW, cssH)

  if (config.backgroundUrl) {
    try {
      const img = await loadImage(config.backgroundUrl)
      const iw = img.naturalWidth || img.width
      const ih = img.naturalHeight || img.height

      if (fit === 'stretch') {
        ctx.drawImage(img, 0, 0, cssW, cssH)
      } else {
        const scale = fit === 'cover'
          ? Math.max(cssW / iw, cssH / ih)
          : Math.min(cssW / iw, cssH / ih)
        const dw = iw * scale
        const dh = ih * scale
        const dx = (cssW - dw) / 2
        const dy = (cssH - dh) / 2
        ctx.drawImage(img, dx, dy, dw, dh)
      }
    } catch (e) {
      // ignore
    }
  }

  // 紅框/網格：畫在底圖上（在題目文字之下）
  if (config.canvasGridGuide) {
    const g = Number(config.canvasGridThickness) || 2
    const rows = Number(config.canvasGridRows) || Number(config.blockRows) || 3
    const cols = Number(config.canvasGridCols) || Number(config.blockCols) || 3
    drawGridGuide(ctx, cssW, cssH, g, rows, cols)
  }

  if (config.text && config.text.length) {
    ctx.fillStyle = config.textColor || '#000'
    ctx.font = `${config.fontSize || 48}px ${config.font || 'sans-serif'}`
    ctx.textAlign = 'center'
    // 用 alphabetic + 實際 bounding box 做「視覺置中」校正
    ctx.textBaseline = 'alphabetic'
    const tx = typeof config.textX === 'number' ? config.textX : 0.5
    const ty = typeof config.textY === 'number' ? config.textY : 0.5
    const x = cssW * Math.min(Math.max(tx, 0), 1)
    const y = cssH * Math.min(Math.max(ty, 0), 1)

    // 視覺中心相對於對齊點的偏移
    const m = ctx.measureText(config.text)
    const hasV =
      Number.isFinite(m.actualBoundingBoxAscent) &&
      Number.isFinite(m.actualBoundingBoxDescent)
    const hasH =
      Number.isFinite(m.actualBoundingBoxLeft) &&
      Number.isFinite(m.actualBoundingBoxRight)

    const xShift = hasH ? (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2 : 0
    // baseline(0) 上方是 -ascent，下方是 +descent，所以中心 = (descent - ascent)/2
    const yShift = hasV ? (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2 : 0

    ctx.fillText(config.text, x - xShift, y - yShift)
  }
}

function drawGridGuide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  thickness: number,
  rows: number,
  cols: number
) {
  const t = Math.max(1, thickness)
  ctx.save()
  ctx.lineWidth = t
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)'

  // border
  ctx.strokeRect(t / 2, t / 2, w - t, h - t)

  // internal grid lines
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)'
  for (let c = 1; c < cols; c++) {
    const x = (w * c) / cols
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let r = 1; r < rows; r++) {
    const y = (h * r) / rows
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  ctx.restore()
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
