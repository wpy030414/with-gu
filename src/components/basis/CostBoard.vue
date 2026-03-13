<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  /** 初始费用 */
  originalCost?: number
  /** 费用异动因素 */
  abnormalFactor?: {
    /** 行商数量（不考虑模组） */
    withMerchants?: number
  }
}>()

const cost = ref(props.originalCost || 10)
/** 费用上限 */
const limit = ref(99)

setInterval(() => {
  if (cost.value < limit.value) cost.value += 1
}, 1000)

setTimeout(() => {
  setInterval(() => {
    const decrease = props?.abnormalFactor?.withMerchants || 0
    cost.value -= decrease * 3
  }, 3000)
}, 400)
</script>

<template>
  <div :class="cost >= limit ? 'full' : ''">
    <span class="key"></span>
    <span class="value">{{ cost }}</span>
  </div>
</template>

<style scoped>
@keyframes running {
  0% {
    width: 0;
  }

  100% {
    width: 100%;
  }
}

div {
  position: relative;
  width: 3.3em;
  height: 1.5em;
  background: rgba(0, 0, 0, 0.7);
  user-select: none;

  &::before,
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0.15em;
    background: rgba(0, 0, 0, 0.3);
  }

  &::after {
    background: #fff;
    animation: running 1s infinite linear;
  }

  &.full::after {
    animation: none;
  }

  & .key {
    position: absolute;
    top: 0.36em;
    left: 0.36em;
    width: 10px;
    height: 10px;
    background: #fff;
    transform: rotate(45deg);
    &::before {
      content: 'C';
      position: absolute;
      top: -0.21em;
      left: 0.03em;
      transform: rotate(-45deg) scale(0.81);
      color: rgba(0, 0, 0, 0.7);
      font-size: 12px;
      font-weight: bold;
    }
  }

  & .value {
    position: absolute;
    top: -0.06em;
    right: 0.48em;
    color: #fff;
    font-size: 18px;
  }
}
</style>
