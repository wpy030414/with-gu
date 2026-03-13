<script setup lang="ts">
import { option } from '@/app.option'

import { ref } from 'vue'
import { mdiArrowUp, mdiWeatherNight, mdiMusic } from '@mdi/js'
import { useThemeStore } from '@/stores/theme'
import { useBGMStore } from '@/stores/bgm'

/** 精灵图标 */
const buttons = ref([{ icon: mdiArrowUp }, { icon: mdiWeatherNight }, { icon: mdiMusic }])

/**
 * 精灵行为。
 *
 * @param i 按钮序号
 */
function spirit(i: number) {
  switch (i) {
    case 0:
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
      break
    case 1:
      useThemeStore().changeTheme()
      break
    case 2:
      useBGMStore().playOrPause()
      break
  }
}
</script>

<template>
  <div class="buttons">
    <button v-for="(b, index) in buttons" @click="spirit(index)" class="spirit">
      <svg width="24" height="24">
        <path :d="b.icon"></path>
      </svg>
    </button>
  </div>
  <audio id="player" :src="option.global?.backgroundMusic" loop></audio>
</template>

<style scoped>
.buttons {
  position: fixed;
  z-index: 990;
  bottom: 36px;
  right: 36px;
  --div-width: 50px;
  width: var(--div-width);

  & > button {
    width: var(--div-width);
    height: var(--div-width);
    margin-top: 15px;
    background: var(--theme-main);
    border: none;
    outline: none;
    border-radius: calc(var(--div-width) / 2);
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;

    &:active {
      transform: scale(0.9);
      transition: none;
    }
  }
}

.player {
  display: none;
}
</style>
