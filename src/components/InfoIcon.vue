<template>
  <span class="info-icon" tabindex="0" ref="iconEl" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide">?
    <Teleport to="body">
      <div v-if="visible" class="info-tooltip" :class="{ 'info-tooltip-below': below }" :style="tooltipStyle">
        <slot />
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const iconEl  = ref<HTMLElement | null>(null)
const visible = ref(false)
const below   = ref(false)
const tooltipStyle = reactive<{ top: string; left: string; maxHeight: string }>({ top: '0px', left: '0px', maxHeight: '70vh' })

function show() {
  if (!iconEl.value) return
  const rect = iconEl.value.getBoundingClientRect()
  const width = 290
  let left = rect.left + rect.width / 2 - width / 2
  left = Math.max(10, Math.min(left, window.innerWidth - width - 10))
  tooltipStyle.left = `${left}px`

  const spaceAbove = rect.top
  const spaceBelow = window.innerHeight - rect.bottom
  below.value = spaceBelow > spaceAbove

  if (below.value) {
    tooltipStyle.top       = `${rect.bottom + 10}px`
    tooltipStyle.maxHeight = `${spaceBelow - 20}px`
  } else {
    tooltipStyle.top       = `${rect.top - 10}px`
    tooltipStyle.maxHeight = `${spaceAbove - 20}px`
  }
  visible.value = true
}

function hide() {
  visible.value = false
}
</script>
