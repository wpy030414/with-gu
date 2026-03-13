<script setup lang="ts">
import type { Project } from '@/types/Project'
import Card from '@/components/basis/Card.vue'
import GoButton from '@/components/basis/GoButton.vue'

defineProps<{
  /** 单数据 */
  data: Project
}>()
</script>

<template>
  <card class="project">
    <span :style="`background-image: url(${data.picture.url});`"></span>
    <h2>{{ data.name }}</h2>
    <p>{{ data.description }}</p>
    <go-button :go="true" :to="data.detail.url">详情</go-button>
  </card>
</template>

<style scoped>
.project {
  position: relative;
  padding: 1.5em 1.8em;

  & span {
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background-size: cover;
    -webkit-mask-image: linear-gradient(to left, #000, transparent);
    opacity: 0.9;
    filter: blur(2px);
  }

  & h2 {
    color: var(--g-c-main);
    font-size: 28px;
  }

  & p {
    margin: 0.3em 0 1.8em;
    color: var(--g-c-sub);
  }
}
</style>
