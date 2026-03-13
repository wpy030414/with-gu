<script setup lang="ts">
import { goTop } from '@/util'

defineProps<{
  /** 自选背景 */
  optionalBgi?: string
}>()

goTop()
</script>

<template>
  <section
    :class="optionalBgi ? 'optional' : ''"
    :style="optionalBgi ? `--bgi: url(${optionalBgi})` : ''"
  >
    <slot class="slot"></slot>
  </section>
</template>

<style scoped>
section {
  position: relative;
  padding: 15vh 12vw;
  background: var(--theme-sub)
    url('//media.prts.wiki/5/50/立绘_纯烬艾雅法拉_1.png?image_process=format,webp/quality,Q_10')
    right / contain no-repeat;
  background-attachment: fixed;

  &.optional {
    background: var(--bgi) center / cover no-repeat;
  }
}

@media screen and (max-width: 1000px) {
  section {
    padding: 4.2vh 7.2vw;
  }
}
</style>
