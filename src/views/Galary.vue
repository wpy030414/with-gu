<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Picture } from '@/types/Picture'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import PictureCard from '@/components/container/PictureCard.vue'
import Pagination from '@/components/basis/Pagination.vue'
import { useDataStore } from '@/stores/data'

/** 是否已准备好数据 */
const isReady = ref(false)

/** 已分页的数据 */
const pagedData = ref<Picture[]>([])
/** 页数 */
const pageNum = ref(1)
/** 页容量 */
const pageSize = ref(12)
/** 页总量 */
const pageAmount = ref(0)

/**
 * 刷新页面。
 */
function reflash() {
  useDataStore()
    .getPictures(pageNum.value, pageSize.value)
    .then((response) => {
      pagedData.value = response.data
      pageAmount.value = Math.ceil(response.totalSize / pageSize.value)
      isReady.value = true
    })
}

reflash()

watch(pageNum, reflash)
</script>

<template>
  <contents-shell>
    <loading v-if="!isReady" />
    <div v-if="isReady">
      <div class="cards-shell">
        <picture-card v-for="p in pagedData" :data="p" />
      </div>
      <pagination :page-num="pageNum" :page-amount="pageAmount" />
    </div>
  </contents-shell>
</template>

<style scoped>
.cards-shell {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 27px;
}

@media screen and (max-width: 1000px) {
  .cards-shell {
    grid-template-columns: 1fr;
  }
}
</style>
