<script setup lang="ts">
import { option } from '@/app.option'

import { ref } from 'vue'

/** 链接 */
const infos = ref([
  {
    title: '更多',
    items: [
      { name: '关于', link: '/about' },
      { name: '赞助', link: '/sponsor' },
      {
        name: '赤牧神社',
        link: '/shrine',
        enable: !(option.bottomFunctions?.shrine === false),
      },
      {
        name: '？',
        link: '/easter-egg',
        enable: !(option.bottomFunctions?.easterEgg === false),
      },
    ],
  },
  {
    title: '设计参考',
    items: [
      { name: '保罗的小窝 Beta', link: '//beta.paul.ren/' },
      { name: 'Material Design 3', link: '//m3.material.io/' },
      { name: 'PicToGrammers', link: '//pictogrammers.com/' },
    ],
  },
  {
    title: '服务支持',
    items: option.bottomFunctions?.support || [],
  },
])
</script>

<template>
  <footer>
    <div>
      <ul class="card h-card">
        <li>
          <h4>{{ option.owner }}</h4>
          <p><i>To archive higher value.</i></p>
        </li>
      </ul>
      <ul class="card" v-for="i of [infos[0]]">
        <h4>{{ i!.title }}</h4>
        <li v-for="c of i!.items">
          <router-link v-if="c.enable === undefined || c.enable" :to="c.link">{{
            c.name
          }}</router-link>
        </li>
      </ul>
      <ul class="card" v-for="i in infos.slice(1)">
        <h4>{{ i.title }}</h4>
        <li v-for="c in i.items">
          <a :href="c.link" target="_blank">{{ c.name }}</a>
        </li>
      </ul>
    </div>
    <p class="site-info">
      © {{ new Date().getFullYear() }} {{ option.owner }}. All rights reserved.
      <a v-if="option.icpInfo" href="//beian.miit.gov.cn/" target="_blank">
        {{ option.icpInfo }}
      </a>
    </p>
  </footer>
</template>

<style scoped>
@keyframes running {
  0% {
    left: 0;
  }

  100% {
    left: calc(100% - 16px);
  }
}

footer {
  padding: 8.1vh 12vw;
  background-color: var(--g-bg-c);
  background-image:
    radial-gradient(var(--theme-main-tp) 10%, transparent 0),
    radial-gradient(var(--theme-main-tp) 10%, transparent 0);
  background-size: 30px 30px;
  background-position:
    0 0,
    15px 15px;

  & > div {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
  }

  & .card {
    display: inline-block;
    vertical-align: top;
    margin-bottom: 7.2vh;
    color: var(--g-c-main);

    & > h4 {
      margin-bottom: 1.2em;
      font-size: 20px;
    }

    & > li {
      margin-bottom: 1.2em;
      transform: translateX(1em);
      color: var(--theme-main);
    }

    & > li > a {
      position: relative;

      &:hover::before {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 16px;
        height: 2px;
        background: var(--theme-main);
        color: var(--theme-main);
        text-decoration: none;
        animation: running 1s infinite;
      }
    }
  }

  & .h-card {
    width: 300px;
    user-select: none;

    & > li {
      list-style: none;
      transform: none;

      & > h4 {
        position: relative;
        margin-bottom: 1em;

        &::before {
          content: '';
          position: absolute;
          bottom: -0.6em;
          width: 70%;
          height: 1.5px;
          background: var(--theme-main);
        }
      }
    }
  }

  & .site-info {
    color: var(--g-c-main);
    font-size: 15px;

    & > a {
      float: right;
      color: var(--g-c-sub);
      text-decoration: none;
    }
  }
}

@media screen and (max-width: 1000px) {
  footer {
    & > div {
      grid-template-columns: 1fr;
    }

    & .site-info > a {
      float: none !important;
      display: block;
    }
  }
}
</style>
