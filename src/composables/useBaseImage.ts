import { ref } from 'vue'
import { renderBaseImage } from '@/utils/canvasRenderer'

type BaseImageConfig = {
  text: string
  font: string
  textColor: string
  fontSize: number
  textX: number
  textY: number
  backgroundUrl: string
  backgroundFit: string
  aspectRatio: number
  canvasGridGuide?: boolean
  canvasGridThickness?: number
  canvasGridRows?: number
  canvasGridCols?: number
  blockRows?: number
  blockCols?: number
}

export function useBaseImage() {
  const baseImage = ref<BaseImageConfig>({
    text: '天',
    font: 'sans-serif',
    textColor: '#222',
    fontSize: 72,
    textX: 0.5,
    textY: 0.5,
    backgroundUrl: '',
    backgroundFit: 'cover',
    aspectRatio: 4/3
  })

  // draw helper for GameCanvas to call if needed
  async function renderToCanvas(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    return renderBaseImage(canvas, baseImage.value, { width: rect.width || 480, height: rect.height || 360 })
  }

  return { baseImage, renderToCanvas }
}
