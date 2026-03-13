<script setup lang="ts"></script>

<template>
  <div class="loading"></div>
</template>

<style scoped>
@keyframes running {
  0% {
    left: calc(var(--b-length) * -1);
  }

  100% {
    left: 100%;
  }
}

div {
  position: relative;
  margin: 10% 0;
  --height: 40px;
  height: var(--height);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    --b-length: 54px;
    --b-height: 6px;
    top: calc((var(--height) - var(--b-height)) / 2);
    left: calc(var(--b-length) * -1);
    width: var(--b-length);
    height: var(--b-height);
    background: var(--theme-main);
    animation: running 2s infinite;
  }
}
</style>
