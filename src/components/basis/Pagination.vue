<script setup lang="ts">
import { goTop } from '@/util'
import GoButton from '@/components/basis/GoButton.vue'

defineProps<{
  /** 页数 */
  pageNum: number
  /** 页总量 */
  pageAmount: number
}>()

defineEmits(['update:pageNum'])
</script>

<template>
  <div>
    <go-button
      @click="($emit('update:pageNum', pageNum - 1), goTop())"
      :disabled="pageNum <= 1 ? true : false"
      >上一页</go-button
    >
    <span>{{ `${pageNum}/${pageAmount}` }}</span>
    <go-button
      @click="($emit('update:pageNum', pageNum + 1), goTop())"
      :disabled="pageNum >= pageAmount ? true : false"
      >下一页</go-button
    >
  </div>
</template>

<style scoped>
div {
  margin-top: 2em;
  text-align: center;

  & span {
    margin: 0 2em;
    color: var(--g-c-main);
    user-select: none;
  }
}
</style>
