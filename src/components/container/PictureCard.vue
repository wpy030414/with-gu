<script setup lang="ts">
import type { Picture } from '@/types/Picture'
import Card from '@/components/basis/Card.vue'

defineProps<{
  /** 单数据 */
  data: Picture
}>()
</script>

<template>
  <card class="picture" @click="$router.push('/blog/' + data.id)">
    <span :style="`background-image: url(${data.url});`"></span>
    <p>{{ data.date.toISOString().slice(0, 10) }}</p>
  </card>
</template>

<style scoped>
.picture {
  user-select: none;

  & span {
    display: block;
    margin: 5% 5% 0;
    padding-top: 90%;
    background-size: cover;
    border-radius: 10px;
  }

  & p {
    margin: 1em 0 1.2em;
    color: var(--g-c-sub);
    text-indent: 5%;
  }
}
</style>
