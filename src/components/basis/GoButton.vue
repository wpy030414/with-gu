<script setup lang="ts">
defineProps<{
  /** 是否需要箭头动效 */
  go?: boolean
  /** 是否被选中 */
  chosen?: boolean
  /** 跳转链接 */
  to?: string
}>()

/**
 * 处理用户离开页面。
 *
 * @param url 外链
 */
function handleUserLeave(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <button :class="chosen ? 'chosen' : ''" @click="to ? handleUserLeave(to) : void 0">
    <p :class="go ? 'go' : ''">
      <slot></slot>
    </p>
  </button>
</template>

<style scoped>
button {
  padding: 1em;
  outline: none;
  border: 2.7px solid var(--theme-main);
  border-radius: 9px;
  background: transparent;
  color: var(--theme-main);
  font-weight: bold;
  letter-spacing: 1px;

  &.chosen {
    background: var(--g-bg-c);
  }

  & p {
    &::after {
      position: relative;
      left: 0px;
      transition: all 0.2s;
    }

    &.go::after {
      content: ' >';
    }
  }

  &:hover > p::after {
    left: 3px;
  }

  &:disabled {
    border: 2.7px solid var(--g-c-sub);
    color: var(--g-c-sub);
  }
}
</style>
