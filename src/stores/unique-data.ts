import { option } from '@/app.option'

import { defineStore } from 'pinia'
import type { Article } from '@/types/Article'

export const useUniqueDataStore = defineStore('unique-store', () => {
  /** 数据源 */
  const dataSource = option.dataSource

  /** 自述缓存 */
  let readmeCache: Article

  /**
   * 获取自述。
   */
  async function getReadme() {
    if (!readmeCache) readmeCache = await (await fetch(dataSource + 'readme.json')).json()

    return readmeCache
  }

  /** 赞助页缓存 */
  let sponsorshipCache: Article

  /**
   * 获取自述。
   */
  async function getSponsorship() {
    if (!sponsorshipCache)
      sponsorshipCache = await (await fetch(dataSource + 'sponsorship.json')).json()

    return sponsorshipCache
  }

  return { getReadme, getSponsorship }
})
