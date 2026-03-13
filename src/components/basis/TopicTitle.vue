<script setup lang="ts">
defineProps<{
  /** 名牌内容 */
  logo?: string
}>()
</script>

<template>
  <h1 :style="logo ? `--logo: '${logo}';` : ''">
    <slot></slot>
  </h1>
</template>

<style scoped>
h1 {
  position: relative;
  color: var(--theme-main);
  text-shadow: 0.1em 0.1em 0 var(--g-bg-c);
  font-size: 44px;
  user-select: none;

  &::before {
    content: var(--logo);
    position: absolute;
    top: -1.4em;
    padding: 0.2em 0.8em;
    background: var(--theme-main);
    color: var(--g-bg-c);
    text-shadow: none;
    font-size: 14px;
    font-family: 'Novecento';
  }
}
</style>
