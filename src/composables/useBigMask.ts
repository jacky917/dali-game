import { ref } from 'vue'

export function useBigMask() {
  const maskConfig = ref({ x: 0, y: 0, width: 900, height: 900, shape: 'circle', color: '#ffffff', step: 12 })

  function updateMask(cfg: any) {
    maskConfig.value = { ...maskConfig.value, ...cfg }
  }

  function moveMask(direction: 'up' | 'down' | 'left' | 'right', multiplier = 1) {
    const step = (maskConfig.value.step ?? 12) * multiplier
    const delta = { x: 0, y: 0 }
    if (direction === 'up') delta.y = -step
    if (direction === 'down') delta.y = step
    if (direction === 'left') delta.x = -step
    if (direction === 'right') delta.x = step
    maskConfig.value = {
      ...maskConfig.value,
      x: Math.max(0, maskConfig.value.x + delta.x),
      y: Math.max(0, maskConfig.value.y + delta.y),
    }
  }

  return { maskConfig, updateMask, moveMask }
}
