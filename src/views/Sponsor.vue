<script setup lang="ts">
import { ref } from 'vue'
import type { Article } from '@/types/Article'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import ArticleCard from '@/components/container/ArticleCard.vue'
import { useUniqueDataStore } from '@/stores/unique-data'

/** 赞助书 */
const sponsorship = ref<Article | undefined>()

useUniqueDataStore()
  .getSponsorship()
  .then((response) => {
    sponsorship.value = response
  })
</script>

<template>
  <contents-shell>
    <loading v-if="!sponsorship" />
    <article-card v-if="sponsorship" :data="sponsorship" :is-core-mode="true" />
  </contents-shell>
</template>

<style scoped></style>
