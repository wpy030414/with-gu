<script setup lang="ts">
import { ref } from 'vue'
import type { Collection } from '@/types/Collection'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import TopicTitle from '@/components/basis/TopicTitle.vue'
import CollectionCard from '@/components/container/CollectionCard.vue'
import { useDataStore } from '@/stores/data'

/** 是否已准备好数据 */
const isReady = ref([false])

const figures = ref<Collection[]>([])

useDataStore()
  .getCollections()
  .then((response) => {
    figures.value = response.filter((c) => {
      return c.category === 'figure'
    })
    isReady.value[0] = true
  })
</script>

<template>
  <contents-shell class="topics">
    <div class="topic-shell">
      <topic-title logo="figures">手办</topic-title>
      <loading v-if="!isReady[0]" />
      <div v-if="isReady[0]" class="cards-shell">
        <collection-card v-for="f in figures" :data="f" />
      </div>
    </div>
  </contents-shell>
</template>

<style scoped>
.topic-shell {
  margin-top: 27px;
  border: 1px solid transparent;
}

.topic-shell:first-child {
  margin-top: 0;
}

.cards-shell {
  display: grid;
  grid-gap: 27px;
  margin: 7vh 0 14vh;
}

.topic-shell:last-child > .cards-shell {
  margin-bottom: 0;
}

@media screen and (max-width: 1000px) {
  .topics {
    padding: 10vh 6vw;
  }
}
</style>
