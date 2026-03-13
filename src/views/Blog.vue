<script setup lang="ts">
import { ref, watch } from 'vue'
import { goTop } from '@/util'
import type { Article } from '@/types/Article'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Loading from '@/components/basis/Loading.vue'
import ArticleCard from '@/components/container/ArticleCard.vue'
import GoButton from '@/components/basis/GoButton.vue'
import Pagination from '@/components/basis/Pagination.vue'
import Card from '@/components/basis/Card.vue'
import { useDataStore } from '@/stores/data'
import router, { setPageTitle } from '@/router'

setPageTitle(['博客'])

/** 是否已准备好数据 */
const isReady = ref(false)

/** 文章缓存代理 */
const articlesProxy = ref<Article[]>([])
/** 现在应该展示的页数据 */
const pagedData = ref<Article[]>([])
/** 页数 */
const pageNum = ref(1)
/** 页容量 */
const pageSize = ref(5)

/** 文章 ID 是否已指定 */
const isIDGiven = ref(false)

/**
 * 刷新数据。
 *
 * @param needDisplayAtOnce 是否需要立即显示
 */
async function reflash(needDisplayAtOnce?: boolean) {
  await useDataStore()
    .getArticles()
    .then((response) => {
      articlesProxy.value = response.data
      if (needDisplayAtOnce) {
        isReady.value = true
        handlePageNumChange(1)
      }
    })

  const id = router.currentRoute.value.params.id as string
  if (id) {
    const a = articlesProxy.value.filter((a) => {
      return a.id === id
    })[0]
    if (a) setPageTitle(['博客', a.category, a.title])
    isIDGiven.value = true
    search(id)
  }
}

reflash(true)

/**
 * 获取总页数。
 */
function getPageAmount() {
  return Math.ceil(articlesProxy.value.length / pageSize.value)
}

watch(pageNum, (pageNum) => {
  handlePageNumChange(pageNum)
})

/**
 * 处理页数变动。
 *
 * @param newPageNum 新的页数
 */
function handlePageNumChange(newPageNum: number) {
  pageNum.value = newPageNum
  const start = (pageNum.value - 1) * pageSize.value
  const end =
    start + pageSize.value > articlesProxy.value.length
      ? articlesProxy.value.length
      : start + pageSize.value
  pagedData.value = articlesProxy.value.slice(start, end)
}

/** 搜索参数 */
const searchParas = ref<{
  categories: string[]
  contents: string
  datePeriod: {
    from: string
    to: string
  }
}>({
  categories: [],
  contents: '',
  datePeriod: {
    from: '',
    to: '',
  },
})

/**
 * 执行多重搜索。
 *
 * @param id 文章唯一识别码。一旦被给定，则其余条件全部失效
 */
async function search(id?: string) {
  if (id) {
    articlesProxy.value = articlesProxy.value.filter((a) => {
      return a.id === id
    })
  } else {
    isReady.value = false
    await reflash(false)

    articlesProxy.value = articlesProxy.value.filter((a) => {
      return (
        (!searchParas.value.categories.length ||
          searchParas.value.categories.includes(a.category)) &&
        (!searchParas.value.contents ||
          a.title.includes(searchParas.value.contents) ||
          a.body.includes(searchParas.value.contents)) &&
        new Date(searchParas.value.datePeriod.from || '1970-01-01').getTime() < a.date.getTime() &&
        a.date.getTime() < new Date(searchParas.value.datePeriod.to || '2099-12-31').getTime()
      )
    })

    goTop()
  }

  isReady.value = true
  handlePageNumChange(1)
}
</script>

<template>
  <contents-shell>
    <loading v-if="!isReady" />
    <div v-if="isReady" class="layout" :class="isIDGiven ? '' : 'given'">
      <div class="articles-shell">
        <article-card v-for="a in pagedData" :data="a" :need-margin="true" />
      </div>
      <p></p>
      <card v-if="!isIDGiven" class="select">
        <p class="assistant">按类别搜索</p>
        <div v-for="(cb, i) in ['主题长文章', '随笔杂谈', '评论', '技术参考']">
          <input
            type="checkbox"
            :id="`blog-category-${i}`"
            :value="cb"
            v-model="searchParas.categories"
          />
          <label :for="`blog-category-${i}`">{{ cb }}</label>
        </div>
        <p class="assistant">按内容搜索</p>
        <div>
          <input type="text" placeholder="标题/正文" v-model="searchParas.contents" />
        </div>
        <p class="assistant">按日期搜索</p>
        <div
          v-for="d in [
            { zh: '从', en: 'from' },
            { zh: '至', en: 'to' },
          ]"
        >
          <label :for="`blog-date-${d.en}`">{{ d.zh }}</label>
          <input
            type="date"
            :id="`blog-date-${d.en}`"
            v-model="searchParas.datePeriod[d.en as 'from' | 'to']"
          />
        </div>
        <go-button @click="search()">搜索</go-button>
      </card>
    </div>
    <pagination
      v-if="isReady && !isIDGiven"
      v-model:pageNum="pageNum"
      :pageAmount="getPageAmount()"
    ></pagination>
  </contents-shell>
</template>

<style scoped>
.layout {
  grid-template-columns: 70% 2em auto;
  align-items: flex-start;
}

.layout.given {
  display: grid;
}

.select {
  position: sticky;
  top: 90px;
  padding: 2em;
  border-radius: 16px;
  overflow: hidden;
  background: var(--g-bg-c);
  color: var(--g-c-main);
}

.select .assistant {
  position: relative;
  --offset: 0.9em;
  left: var(--offset);
  margin: 0.5em 0;
  font-size: 18px;
}

.select .assistant::before {
  content: '';
  position: absolute;
  top: 18%;
  left: calc(var(--offset) * -1);
  width: 0.5em;
  height: 1em;
  background: var(--theme-main);
}

.select .assistant:first-child {
  margin-top: 0;
}

.select div {
  margin-left: 18px;
}

.select input[type='checkbox'] {
  position: relative;
  top: 2.5px;
  width: 16px;
  height: 16px;
  margin-right: 0.5em;
  border-radius: 8px;
}

.select input[type='date'] {
  position: relative;
  bottom: 1px;
  margin-left: 0.5em;
}

.select button {
  margin-top: 15px;
}

@media screen and (max-width: 1000px) {
  .layout {
    display: block !important;
  }
}
</style>
