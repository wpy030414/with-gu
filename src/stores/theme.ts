import { defineStore } from 'pinia'
import type { Theme } from '@/types/Theme'

export const useThemeStore = defineStore('theme', () => {
  /** 是否处于暗黑模式 */
  let isDark = localStorage.getItem('isDark') === 'true' ? true : false
  /** 现在的有色主题 */
  let nowColor: Theme

  /**
   * 获取有色主题。
   */
  function getTheme() {
    return nowColor
  }

  /**
   * 应用主题。
   *
   * @param color 有色主题
   */
  function applyTheme(color?: Theme) {
    const holder = document.documentElement.classList
    if (isDark) holder.add('dark')
    else holder.remove('dark')
    if (color) {
      holder.forEach((ct) => {
        if (ct !== 'dark') holder.remove(ct)
      })
      holder.add(color)
      nowColor = color
    }
  }

  /**
   * 改变时间主题。
   */
  function changeTheme() {
    isDark = !isDark
    localStorage.setItem('isDark', `${isDark}`)
    applyTheme()
  }

  return { getTheme, applyTheme, changeTheme }
})
