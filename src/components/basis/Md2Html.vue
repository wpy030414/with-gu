<script setup lang="ts">
import { marked } from 'marked'
import { gfmHeadingId } from 'marked-gfm-heading-id'

marked.use(gfmHeadingId())

defineProps<{
  /** Markdown 源码 */
  md: string
}>()
</script>

<template>
  <div class="blog-body" v-html="marked.parse(md)"></div>
</template>

<style>
.blog-body {
  margin-top: 1.8em;
  color: var(--g-c-sub);

  & p {
    margin-top: 0.6em;
    line-height: 1.5em;
    text-indent: 2em;
    letter-spacing: 0.5px;
  }

  & blockquote {
    position: relative;
    margin-top: 0.6em;
    padding: 0.1em 0 0.7em;
    background: var(--g-tp-high-rev);

    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 0;
      width: 32px;
      height: 100%;
      background: var(--g-tp-high-rev);
    }

    &::before {
      left: -32px;
    }

    &::after {
      right: -32px;
    }
  }

  & li {
    margin: 0.6em 0 0 3em;
    line-height: 1.5em;
  }

  & code {
    padding: 4px 8px;
    background: var(--theme-main);
    border-radius: 4px;
    color: var(--g-bg-c);
  }

  & img {
    display: block;
    margin: auto;
    width: 30%;
  }
}
</style>
