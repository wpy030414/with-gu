<script setup lang="ts">
import { ref } from 'vue'
import type { Program } from '@/types/Program'
import Card from '@/components/basis/Card.vue'

defineProps<{
  /** 单数据 */
  data: Program
}>()

/** 服务商名称映射 */
const ssnMap = ref(
  new Map([
    ['netease', '网易云音乐'],
    ['bilibili', '哔哩哔哩'],
  ]),
)
</script>

<template>
  <card class="program">
    <span>
      <span class="name">
        <p>
          {{ data.name }}
          <i v-if="data.translatedName"> （{{ data.translatedName }}） </i>
        </p>
      </span>
      <span class="date">
        <p>{{ data.releaseDate.toISOString().slice(0, 10) }}</p>
      </span>
    </span>
    <span class="urls">
      <span v-for="u in data.urls">
        <a v-if="u[1]" :href="u[1]" target="_blank">{{ ssnMap.get(u[0]) }}</a>
      </span>
    </span>
  </card>
</template>

<style scoped>
.program {
  padding: 1.5em;

  & > span {
    display: inline-block;
    color: var(--g-c-main);

    & .name > p {
      font-size: 22px;

      & > i {
        color: var(--g-c-sub);
        font-style: normal;
      }
    }

    & .date > p {
      margin: 0.3em 0 0;
    }
  }

  & > .urls {
    float: right;
    display: flex;
    align-items: center;
    height: 59.2px;

    & a {
      margin-left: 1em;
    }
  }
}

@media screen and (max-width: 1000px) {
  .program {
    & .date > p {
      margin: 0.3em 0 0.6em;
    }

    & > .urls {
      float: none;
      display: block;
      height: auto;

      & a {
        margin: 0 1em 0 0;
      }
    }
  }
}
</style>
