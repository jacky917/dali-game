import { ref, computed } from 'vue'

export function useBlockMask(init: { rows?: number; cols?: number } = {}) {
  const rows = ref(init.rows || 3)
  const cols = ref(init.cols || 3)
  const openedBlocks = ref<Set<number>>(new Set())

  function openBlock(idx: number) {
    openedBlocks.value.add(idx)
  }

  function resetBlocks() {
    openedBlocks.value = new Set()
  }

  return {
    rows,
    cols,
    openedBlocks,
    openBlock,
    resetBlocks,
  }
}
