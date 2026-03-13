<script setup lang="ts">
import { ref } from 'vue'
import type { Program } from '@/types/Program'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import TopicTitle from '@/components/basis/TopicTitle.vue'
import ProgramCard from '@/components/container/ProgramCard.vue'
import { useDataStore } from '@/stores/data'

/** 是否已准备好数据 */
const isReady = ref(false)

/** 节目 */
const programs = ref<Program[]>([])
/** 年份 */
const years = ref(new Set<number>())

useDataStore()
  .getPrograms()
  .then((response) => {
    programs.value = response
    programs.value.forEach((p) => {
      years.value.add(p.releaseDate.getFullYear())
    })
    isReady.value = true
  })
</script>

<template>
  <contents-shell class="years">
    <loading v-if="!isReady" />
    <div v-if="isReady" v-for="y in years" class="year">
      <topic-title>{{ y }}</topic-title>
      <div class="cards-shell">
        <program-card
          v-for="p in programs.filter((sp) => {
            return sp.releaseDate.getFullYear() === y
          })"
          :data="p"
        />
      </div>
    </div>
  </contents-shell>
</template>

<style scoped>
.cards-shell {
  display: grid;
  grid-gap: 27px;
  margin: 7vh 0 9vh;
}

.year:last-child > .cards-shell {
  margin-bottom: 0;
}

@media screen and (max-width: 1000px) {
  .years {
    padding: 10vh 6vw;
  }
}
</style>
