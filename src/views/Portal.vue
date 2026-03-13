<script setup lang="ts">
import { option } from '@/app.option'

import { ref } from 'vue'
import type { Article } from '@/types/Article'
import type { Picture } from '@/types/Picture'
import type { Project } from '@/types/Project'
import ShakeBox from '@/components/basis/ShakeBox.vue'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import TopicTitle from '@/components/basis/TopicTitle.vue'
import Loading from '@/components/basis/Loading.vue'
import ArticleCard from '@/components/container/ArticleCard.vue'
import PictureCard from '@/components/container/PictureCard.vue'
import ProjectCard from '@/components/container/ProjectCard.vue'
import { useDataStore } from '@/stores/data'

/** 是否已准备好数据 */
const isReady = ref([false, false, false])

/** 近期文章 */
const articles = ref<Article[]>([])

useDataStore()
  .getArticles(1, 2)
  .then((response) => {
    articles.value = response.data
    isReady.value[0] = true
  })

/** 近期图片 */
const pictures = ref<Picture[]>([])

useDataStore()
  .getPictures(1, 3)
  .then((response) => {
    pictures.value = response.data
    isReady.value[1] = true
  })

/** 近期项目 */
const projects = ref<Project[]>([])

useDataStore()
  .getProjects(1, 4)
  .then((response) => {
    projects.value = response.data
    isReady.value[2] = true
  })
</script>

<template>
  <shake-box />
  <contents-shell class="recently">
    <div v-if="!(option.portalFunctions?.blogs === false)" class="topic-shell">
      <topic-title logo="blogs">近期博客</topic-title>
      <loading v-if="!isReady[0]" />
      <div v-if="isReady[0]" class="cards-shell">
        <article-card
          v-for="c in articles"
          :data="c"
          :is-simple-mode="true"
          @click="$router.push('/blog/' + c.id)"
        />
      </div>
    </div>
    <div v-if="!(option.portalFunctions?.pictures === false)" class="topic-shell">
      <topic-title logo="pictures">近期捕获</topic-title>
      <loading v-if="!isReady[1]" />
      <div v-if="isReady[1]" class="cards-shell">
        <picture-card v-for="c in pictures" :data="c" />
      </div>
    </div>
    <div v-if="!(option.portalFunctions?.projects === false)" class="topic-shell">
      <topic-title logo="projects">近期示范项目</topic-title>
      <loading v-if="!isReady[2]" />
      <div v-if="isReady[2]" class="cards-shell">
        <project-card v-for="c in projects" :data="c" />
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

.topic-shell > .cards-shell {
  display: grid;
  grid-gap: 27px;
  margin: 7vh 0 14vh;
}

.topic-shell:last-child > .cards-shell {
  margin-bottom: 0;
}

.cards-shell > div {
  display: inline-block;
  transition: all 0.2s;
}

.cards-shell > div:hover {
  box-shadow: 0 8px 28px #00000026;
  transform: translateY(-8px);
}

.topic-shell:nth-child(1) > .cards-shell {
  grid-template-columns: repeat(2, 1fr);
}

.topic-shell:nth-child(2) > .cards-shell {
  grid-template-columns: repeat(3, 1fr);
}

.topic-shell:nth-child(3) > .cards-shell {
  grid-template-columns: repeat(2, 1fr);
}

@media screen and (max-width: 1000px) {
  .recently {
    padding: 15vh 6vw;
  }

  .cards-shell {
    grid-template-columns: 1fr !important;
  }
}
</style>
