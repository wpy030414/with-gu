<script setup lang="ts">
type Theme = 'w&o' | 'w&b' | 'o&b' | 'b&o' | 'b&w' | 'o&w'

withDefaults(
  defineProps<{
    /** 宽度，默认 100px。由于 `Logo` 是正方形的，因此指定了宽度的同时也确定了高度。 */
    width?: number
    /** 主题，默认白底橙字。可配置 `(背景色)&(前景色)`，如 'w&o' 表示白底橙字。 */
    theme?: Theme
  }>(),
  {
    width: 100,
    theme: 'w&o',
  },
)

/**
 * 根据主题获取颜色。
 *
 * @param theme 主题
 * @param layer 背景/前景
 * @returns 颜色的 Hex 值
 */
function getColor(theme: Theme, layer: 'b' | 'f') {
  type ColorName = string
  type ColorHexValue = string
  const colors: Map<ColorName, ColorHexValue> = new Map()
  colors.set('w', '#ffffff')
  colors.set('o', '#ef5b00')
  colors.set('b', '#000000')
  return colors.get(theme.split('&')[layer === 'b' ? 0 : 1]!) as string
}
</script>

<template>
  <span>
    <svg :width="width" :height="width" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,0 100,0 100,100 0,100" :style="`fill: ${getColor(theme, 'b')};`" />
      <polygon points="42,16 86,32 78,85 47,73" :style="`fill: ${getColor(theme, 'f')};`" />
      <polygon points="47,73 78,85 78,100 0,100" />
    </svg>
  </span>
</template>

<style scoped>
polygon {
  fill: #efefef;
}
</style>
