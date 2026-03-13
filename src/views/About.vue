<script setup lang="ts">
import { ref } from 'vue'
import type { Article } from '@/types/Article'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import ArticleCard from '@/components/container/ArticleCard.vue'
import { useUniqueDataStore } from '@/stores/unique-data'

/** 自述 */
const readme = ref<Article | undefined>()

useUniqueDataStore()
  .getReadme()
  .then((response) => {
    readme.value = response
  })
</script>

<template>
  <contents-shell>
    <loading v-if="!readme" />
    <article-card v-if="readme" :data="readme" :is-core-mode="true" />
  </contents-shell>
</template>

<style scoped></style>
