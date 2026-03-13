<script setup lang="ts">
import type { Article } from '@/types/Article'
import Card from '@/components/basis/Card.vue'
import Md2Html from '@/components/basis/Md2Html.vue'

defineProps<{
  /** 单数据 */
  data: Article
  /** 是否为简单模式 */
  isSimpleMode?: boolean
  /** 是否为核心模式 */
  isCoreMode?: boolean
}>()
</script>

<template>
  <card class="article" :class="isSimpleMode ? 'simple' : ''">
    <h2 :id="isCoreMode ? '' : data.id">{{ data.title }}</h2>
    <p v-if="!isCoreMode">
      <span class="date">
        {{ data.date.toISOString().slice(0, 10) }}
      </span>
      <span class="category">
        {{ data.category }}
      </span>
    </p>
    <md2-html class="body" :md="isSimpleMode ? data.body.slice(0, 500) : data.body" />
    <!-- <go-button v-if="!isSimpleMode">赞同</go-button> -->
  </card>
</template>

<style scoped>
.article {
  position: relative;
  padding: 2em;
  border-radius: 16px;
  overflow: hidden;
  background: var(--g-bg-c);

  & h2 {
    opacity: 0.9;
    color: var(--g-c-main);
    font-size: 30px;

    &::before {
      content: '# ';
      color: var(--theme-main);
    }
  }

  & .date {
    position: absolute;
    top: 11px;
    right: 42px;
    width: 6em;
    opacity: 0.05;
    user-select: none;
    color: var(--g-c-main);
    text-align: right;
    font-size: 64px;
    font-weight: bold;
  }

  & .category {
    position: absolute;
    top: 0;
    right: 32px;
    padding: 2px 1em;
    border-radius: 0 0 4px 4px;
    background: var(--theme-main);
    color: var(--g-bg-c);
  }

  &.simple {
    margin-bottom: 0;
    height: 388px;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 60%;
      background: linear-gradient(to bottom, transparent, var(--g-bg-c) 90%);
    }
  }
}

@media screen and (max-width: 1000px) {
  .article {
    padding: 2.4em 1.5em;

    & .date {
      transform-origin: 100% 0;
      transform: rotate(-90deg) translate(-10vw, -10vh);
    }
  }
}
</style>
