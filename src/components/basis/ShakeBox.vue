<script setup lang="ts">
import { option } from '@/app.option'

import { ref } from 'vue'
import { mdiChevronDown } from '@mdi/js'
import DynamicLine from '@/components/basis/DynamicLine.vue'
import GoButton from '@/components/basis/GoButton.vue'

/** 门户主人 */
const who = ref(option.owner)

/** x 轴上翻转的角度 */
const xDeg = ref(0)
/** y 轴上翻转的角度 */
const yDeg = ref(0)

document.addEventListener('mousemove', (event) => {
  const xRelative = event.clientX / window.innerWidth
  const yRelative = event.clientY / window.innerHeight
  const magnifyTimes = 20
  yDeg.value = -(xRelative - 0.5) * magnifyTimes
  xDeg.value = (yRelative - 0.5) * magnifyTimes * 1.5
})

/** 社交网站外链 */
const socials = ref(option.socialLinks)

function handleKnowingMore() {
  window.scrollBy({
    top: window.innerHeight - 60,
    behavior: 'smooth',
  })
}
</script>

<template>
  <section class="start">
    <img
      src="//media.prts.wiki/9/97/立绘_煌_skin1.png?image_process=format,webp/quality,Q_10"
      alt=""
    />
    <svg width="24" height="24">
      <path :d="mdiChevronDown"></path>
    </svg>
    <section class="nameplate" :style="`--xDeg: ${xDeg}deg; --yDeg: ${yDeg}deg;`">
      <p>你好，我是</p>
      <h1>{{ who || `Penyo` }}</h1>
      <dynamic-line class="line"></dynamic-line>
      <div class="socials">
        <a v-for="s in socials" :href="s.link" :title="s.name" target="_blank">
          <img :src="s.icon" alt="" width="20" />
        </a>
      </div>
      <go-button :go="true" @click="handleKnowingMore">了解更多</go-button>
      <div class="image-shell"></div>
    </section>
  </section>
</template>

<style scoped>
@keyframes dancing {
  0% {
    transform: scale(4, 3) translate(-3px, 0);
    opacity: 0.85;
  }

  50% {
    transform: scale(4, 3) translate(-3px, 10px);
    opacity: 1;
  }

  100% {
    transform: scale(4, 3) translate(-3px, 0);
    opacity: 0.85;
  }
}

.start {
  position: relative;
  height: calc(100vh - 60px);
  background: var(--theme-main);
  background-image:
    repeating-linear-gradient(
      45deg,
      var(--g-tp-high),
      var(--g-tp-high) 15px,
      transparent 0,
      transparent 30px
    ),
    repeating-linear-gradient(
      -45deg,
      var(--g-tp-high),
      var(--g-tp-high) 15px,
      transparent 0,
      transparent 30px
    );
  text-align: center;
  overflow: hidden;
  perspective: 2333px;

  & > img {
    position: absolute;
    top: -90vh;
    left: -55vw;
    opacity: 0.65;
  }

  & > svg {
    position: absolute;
    z-index: 800;
    bottom: 75px;
    animation: dancing 2s infinite;
  }

  & .nameplate {
    position: absolute;
    --np-width: 45vw;
    --np-height: 63vh;
    top: calc((100% - var(--np-height)) / 2 - 3vh);
    left: calc((100% - var(--np-width)) / 2);
    width: var(--np-width);
    height: var(--np-height);
    background: var(--g-tp-low);
    border-radius: 15px;
    transform-style: preserve-3d;
    transform: translateZ(233px) rotateX(var(--xDeg)) rotateY(var(--yDeg));

    & > * {
      position: absolute;
      left: 45px;
      user-select: none;
    }

    & > p:nth-child(1) {
      top: 50px;
      color: var(--g-c-sub);
      font-size: 18px;
    }

    & > h1 {
      top: 100px;
      color: var(--g-c-main);
      font-size: 80px;
      transform: translateZ(36px);
    }

    & > .line {
      bottom: 180px;
      color: var(--g-c-sub);
    }

    & > .socials {
      bottom: 128px;

      & a:hover img {
        filter: grayscale(0);
      }

      & img {
        margin-right: 12px;
        filter: grayscale(1);
        transition: all 0.2s;
      }
    }

    & > button {
      bottom: 50px;
    }

    & > .image-shell {
      top: -45px;
      left: calc(var(--np-width) * 0.45);
      width: calc(var(--np-height) * 1.44 * 0.55);
      height: calc(var(--np-height) * 1.44);
      background: url('//media.prts.wiki/0/0c/立绘_阿米娅_skin1.png?image_process=format,webp/quality,Q_10')
        center / cover;
      transform: translateZ(36px);
    }
  }
}

@media screen and (max-width: 1000px) {
  .start {
    & > img {
      left: -180vw;
    }

    & .nameplate {
      --np-width: 85vw;
      overflow: hidden;

      & > * {
        left: 35px;
      }

      & > h1 {
        top: 90px;
        font-size: 70px;
      }

      & > .image-shell {
        z-index: -1;
        left: calc(var(--np-width) * 0.21);
        opacity: 0.45;
        transform: translateZ(0);
      }
    }
  }
}
</style>
