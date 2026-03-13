<script setup lang="ts">
import { option } from '@/app.option'

import { onMounted, ref } from 'vue'
import { mdiHome, mdiPen, mdiImage, mdiStar, mdiArchiveMusic, mdiMenu } from '@mdi/js'

defineProps<{
  /** 当前页面默认路由 */
  pageName: string
}>()

/** 菜单 */
const menu = ref([
  { icon: mdiHome, href: '/' },
  {
    icon: mdiPen,
    href: '/blog',
    enable: !(option.coreFunctions?.blog === false),
  },
  {
    icon: mdiImage,
    href: '/galary',
    enable: !(option.coreFunctions?.galary === false),
  },
  {
    icon: mdiStar,
    href: '/museum',
    enable: !(option.coreFunctions?.museum === false),
  },
  {
    icon: mdiArchiveMusic,
    href: '/project',
    enable: !(option.coreFunctions?.project === false),
  },
])

/** 是否（可能）在移动端上 */
const isOnMobile = ref(false)

onMounted(() => {
  const updateIsOnMobile = () => {
    isOnMobile.value = window.innerWidth < 1000
  }

  updateIsOnMobile()

  window.addEventListener('resize', updateIsOnMobile)
})

/** 菜单是否已弹出 */
const isMenuPoped = ref(false)
</script>

<template>
  <header>
    <button @click="isMenuPoped = !isMenuPoped">
      <svg width="24" height="24">
        <path :d="mdiMenu"></path>
      </svg>
    </button>
    <h1>{{ pageName }}</h1>
    <transition name="menu">
      <ul v-if="!isOnMobile || isMenuPoped">
        <li v-for="i in menu" @click="isMenuPoped = false">
          <router-link v-if="i.enable === undefined || i.enable" :to="i.href">
            <svg width="24" height="24">
              <path :d="i.icon"></path>
            </svg>
          </router-link>
        </li>
      </ul>
    </transition>
  </header>
</template>

<style scoped>
header {
  position: sticky;
  z-index: 900;
  top: 0;
  --header-height: 60px;
  height: var(--header-height);
  background: var(--theme-main);
  text-align: center;

  & > button {
    display: none;
    position: absolute;
    z-index: 910;
    top: 17px;
    left: 24px;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    outline: none;
    transform: scale(1.25);
  }

  & > h1 {
    position: absolute;
    left: 2em;
    color: #fff;
    font-family: 'Novecento';
    line-height: var(--header-height);
    transform: translateY(-3.5px);
    user-select: none;
  }

  & > ul,
  & > ul > li,
  & > ul > li > a {
    display: inline-block;
    height: var(--header-height);
  }

  & > ul > li > a {
    position: relative;
    width: 75px;
    height: 40px;
    margin: 10px 0;
    border-radius: 4px;
    overflow: hidden;

    & > * {
      transform: scale(1.25) translateY(6.5px);
    }

    &:hover::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.1);
    }
  }
}

@media screen and (max-width: 1000px) {
  header {
    & > button {
      display: block;
    }

    & > h1 {
      left: 0;
      width: 100%;
    }

    & > ul {
      position: relative;
      width: 100%;
      top: 60px;
      left: 0;
      background: var(--theme-main);
    }
  }

  .menu-enter-active,
  .menu-leave-active {
    transition: all 0.5s;
  }

  .menu-enter-from,
  .menu-leave-to {
    left: -100% !important;
  }
}
</style>
