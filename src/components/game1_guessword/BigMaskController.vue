<template>
  <div class="controller">
    <div class="row row-1">
      <label>
        <span class="t">X：</span>
        <input type="number" v-model.number="local.x" @input="emitUpdate" />
      </label>
      <label>
        <span class="t">Y：</span>
        <input type="number" v-model.number="local.y" @input="emitUpdate" />
      </label>
      <label>
        <span class="t">寬：</span>
        <input type="number" v-model.number="local.width" @input="emitUpdate" />
      </label>
      <label>
        <span class="t">高：</span>
        <input type="number" v-model.number="local.height" @input="emitUpdate" />
      </label>
      <label>
        <span class="t">形狀：</span>
        <select v-model="local.shape" @change="emitUpdate">
          <option value="circle">圓形</option>
          <option value="square">方形</option>
          <option value="trapezoid">梯形</option>
        </select>
      </label>
      <label>
        <span class="t">顏色：</span>
        <input type="color" v-model="hex" @input="onColorInput" />
      </label>
    </div>

    <div class="row row-2">
      <label class="range half">
        敏感度：
        <input type="range" min="2" max="60" v-model.number="local.step" @input="emitUpdate" />
        <span class="value value-fixed">{{ local.step }}px/鍵</span>
      </label>
      <label class="range half">
        遮罩透明度：
        <input type="range" min="0" max="100" v-model.number="opacityPct" @input="emitOpacity" />
        <span class="value value-fixed">{{ opacityPct }}%</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
const props = defineProps<{ maskConfig: any; opacity?: number }>()
const emit = defineEmits<{
  (e: 'update:maskConfig', cfg: any): void
  (e: 'update:opacity', v: number): void
}>()

const local = reactive({ ...(props.maskConfig || { x: 80, y: 80, width: 120, height: 120, shape: 'circle', color: '#000000', step: 12 }) })

watch(() => props.maskConfig, (v) => {
  if (v) Object.assign(local, v)
}, { deep: true })

function emitUpdate() {
  emit('update:maskConfig', { ...local })
}

const hex = computed({
  get() { return local.color || '#000000' },
  set(v: string) { local.color = v }
})

function onColorInput() {
  emitUpdate()
}

const opacityPct = computed({
  get() {
    const o = Math.min(Math.max(props.opacity ?? 1, 0), 1)
    return Math.round(o * 100)
  },
  set(v: number) {
    const n = Math.min(Math.max(v, 0), 100)
    emit('update:opacity', n / 100)
  }
})

function emitOpacity() {
  emit('update:opacity', opacityPct.value / 100)
}
</script>

<style scoped>
.controller { display:flex; gap:8px; flex-wrap:wrap; align-items:center }
.row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; width: 100%; }
.row-1{
  display: grid;
  gap: 8px;
  width: 100%;
  /* 方案 A：6 欄比例，桌機下幾乎必定同一行 */
  grid-template-columns:
    minmax(0, 1fr)  /* X */
    minmax(0, 1fr)  /* Y */
    minmax(0, 1fr)  /* 寬 */
    minmax(0, 1fr)  /* 高 */
    minmax(0, 1.4fr)/* 形狀 */
    minmax(0, 1.4fr)/* 顏色 */
  ;
  align-items: center;
}
.row-2 { width: 100%; }
.controller label { font-size:12px }
input[type="number"] { width:64px }
.range { display:flex; align-items:center; gap:6px; }
.range input[type="range"] { flex: 1; width:auto; min-width: 160px; }
.value { color:#e2e8f0; font-size:11px; }
.half { flex: 1 1 320px; }
.value-fixed { display:inline-block; width:64px; text-align:right; }

/* 第一行視覺垂直對齊（特別是 color input） */
.row-1 > label {
  display:flex;
  align-items:center;
  gap:6px;
  height:32px;
  min-width: 0;
}
.row-1 > label .t { flex: 0 0 auto; }
.row-1 > label select { height: 28px; flex: 1 1 auto; min-width: 0; }
.row-1 > label input[type="number"] { height: 28px; flex: 1 1 auto; min-width: 0; }
.row-1 > label input[type="color"] {
  height: 28px;
  width: 76px;
  padding: 0;
  vertical-align: middle;
  flex: 0 0 auto;
}
</style>
