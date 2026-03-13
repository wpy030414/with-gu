<script setup lang="ts">
import '@/assets/colored-theme/vermillion.css'
import { onBeforeUnmount, ref } from 'vue'
import ContentsShell from '@/components/frame/ContentsShell.vue'
import Card from '@/components/basis/Card.vue'
import { useThemeStore } from '@/stores/theme'
import { useBGMStore } from '@/stores/bgm'
import { useDrawingStore } from '@/stores/drawing'
import { Theme } from '@/types/Theme'
import { option } from '@/app.option'

const outside = useThemeStore().getTheme()

useThemeStore().applyTheme(Theme.VERMILLION)
useBGMStore().setBGM(useBGMStore().vendor.getNeteaseUnit('1879108724'))
useBGMStore().playOrPause('play')

onBeforeUnmount(() => {
  useThemeStore().applyTheme(outside)
  useBGMStore().setBGM(option.global.backgroundMusic || '')
  useBGMStore().playOrPause('pause')
})

/** 背景图 */
const bgi = ref(
  '//th.bing.com/th/id/R.af861498e15ba919327f7bef9cfe593d?rik=PCuE0KMeLytGYw&riu=http%3a%2f%2fys-helloworld.com%2fwp-content%2fuploads%2f2014%2f11%2fIMG_9683.jpg&ehk=wBNAZomkHSfhqu2X9z956Gd3vFHZs9R7clxP5%2bBjXFs%3d&risl=&pid=ImgRaw&r=0',
)

/** 结果。由“程度”和“方向”组成 */
const result = ref<[string, string]>(['', ''])

/**
 * 处理御神签选中。
 */
function handleSelect() {
  if (useDrawingStore().canDraw()) result.value = useDrawingStore().draw()
  else alert('您不能过于频繁地抽签！请明天再来吧。')
}

/** 抽签动画是否结束 */
const isAnimationDone = ref(false)
</script>

<template>
  <contents-shell :optional-bgi="bgi">
    <card class="lots-box" :class="isAnimationDone && (result[1] === '凶' ? 'bad' : '')">
      <h2>❀ 御神签箱 ❀</h2>
      <transition name="lots" @after-leave="isAnimationDone = true">
        <div v-if="!result[1]" class="lots">
          <div v-for="l in 5" :style="`--bit: ${l - 3}`" @click="handleSelect"></div>
        </div>
      </transition>
      <div v-if="isAnimationDone && result[1]" class="result">
        <span v-if="result[0]" class="degree">{{ result[0] }}</span>
        <span class="direction">{{ result[1] }}</span>
      </div>
    </card>
  </contents-shell>
</template>

<style scoped>
.lots-box {
  position: relative;
  padding: 2em;
  height: 60vh;
  opacity: 0.95;
  user-select: none;
  color: var(--g-c-main);
  text-align: center;
}

.lots-box.bad {
  background: var(--theme-main);
}

.lots-leave-active {
  transition: opacity 2s;
}

.lots-leave-to {
  opacity: 0;
}

.lots > div {
  position: absolute;
  top: 20vh;
  left: calc((100% - 80px) / 2);
  width: 80px;
  height: 800px;
  background: var(--theme-sub);
  box-shadow: 0 0 10px #33333326;
  --degree: 30deg;
  --extract: 0;
  transform: rotate(calc(var(--bit) * 0.618 * var(--degree))) translateY(var(--extract));
  transition: all 0.5s;
}

.lots > div:hover,
.lots > div:active {
  background: var(--theme-main);
  --extract: -30px;
}

@keyframes appear {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.result {
  margin-top: 20vh;
  font-size: 48px;
  animation: appear 1s;
}

.result > span {
  margin: auto;
  padding: 0 0.15em;
}

.result > .degree {
  background: var(--theme-main);
  color: #fff;
}

@media screen and (max-width: 1000px) {
  .lots {
    position: relative;
    top: 20%;
    zoom: 0.6;
  }

  .lots > div {
    --degree: 25deg;
  }
}
</style>
