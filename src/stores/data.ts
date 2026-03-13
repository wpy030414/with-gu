import { option } from '@/app.option'

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Article } from '@/types/Article'
import type { Picture } from '@/types/Picture'
import type { Project } from '@/types/Project'
import type { Collection } from '@/types/Collection'
import type { Program } from '@/types/Program'

export const useDataStore = defineStore('data', () => {
  /** 数据源 */
  const dataSource = option.dataSource

  /**
   * 获取分页数据。
   *
   * @param unpagedData 未分页的数据
   * @param pageNum 页数。从 1 开始计算
   * @param pageSize 页容量。必须是正整数
   */
  function getPagedData<T>(unpagedData: T[], pageNum: number, pageSize: number) {
    if (pageNum % 1 != 0 || pageNum < 1 || pageSize % 1 != 0 || pageSize < 1)
      throw new Error('Invalid parameter(s)! ')
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize > unpagedData.length ? unpagedData.length : start + pageSize
    return unpagedData.slice(start, end)
  }

  /** 是否未初始化 */
  const isUninitialized = ref(new Map([['articles', true]]))

  /** 是否已初始化 */
  const isInitialized = ref(
    new Map([
      ['articles', false],
      ['pictures', false],
      ['projects', false],
      ['collections', false],
      ['programs', false],
    ]),
  )

  /** 文章缓存 */
  const articlesCache = ref<Article[]>([])

  /**
   * 获取文章信息。
   *
   * @param pageNum 页数。
   * @param pageSize 页容量。
   */
  async function getArticles(
    pageNum?: number,
    pageSize?: number,
  ): Promise<{ data: Article[]; totalSize: number }> {
    if (!isInitialized.value.get('articles')) {
      isUninitialized.value.set('articles', false)

      type ArticleRawEx = {
        date: {
          $date: string
        }
      }
      const raws: (Article | ArticleRawEx)[] = await (
        await fetch(dataSource + 'articles.json')
      ).json()
      raws.forEach((r) => {
        r.date = new Date((r as ArticleRawEx).date.$date)
        articlesCache.value.push(r as Article)
      })

      isInitialized.value.set('articles', true)
    }

    if (pageNum && pageSize)
      return {
        data: getPagedData(articlesCache.value, pageNum, pageSize),
        totalSize: articlesCache.value.length,
      }
    return {
      data: articlesCache.value,
      totalSize: articlesCache.value.length,
    }
  }

  /** 照片缓存 */
  const picturesCache = ref<Picture[]>([])

  /**
   * 获取图片信息。
   *
   * @param pageNum 页数。
   * @param pageSize 页容量。
   */
  async function getPictures(
    pageNum?: number,
    pageSize?: number,
  ): Promise<{ data: Picture[]; totalSize: number }> {
    if (!isInitialized.value.get('pictures')) {
      while (!isInitialized.value.get('articles') && !isUninitialized.value.get('articles'))
        await new Promise((resolve) => setTimeout(resolve, 100))

      ;(await getArticles()).data.forEach((a) => {
        const raws = a.body.match(/!\[.*?\]\(.+?\)/g)
        if (raws)
          raws.forEach((p) => {
            picturesCache.value.push({
              id: a.id,
              date: new Date(a.date),
              url: (p.match(/!\[.*?\]\((.+?)\)/) as RegExpMatchArray)[1]!,
            })
          })
      })

      isInitialized.value.set('pictures', true)
    }

    if (pageNum && pageSize)
      return {
        data: getPagedData(picturesCache.value, pageNum, pageSize),
        totalSize: picturesCache.value.length,
      }
    return { data: picturesCache.value, totalSize: picturesCache.value.length }
  }

  /** 项目缓存 */
  const projectsCache = ref<Project[]>([])

  /**
   * 获取项目信息。
   *
   * @param pageNum 页数。
   * @param pageSize 页容量。
   */
  async function getProjects(
    pageNum?: number,
    pageSize?: number,
  ): Promise<{ data: Project[]; totalSize: number }> {
    if (!isInitialized.value.get('projects')) {
      projectsCache.value = await (await fetch(dataSource + 'projects.json')).json()

      isInitialized.value.set('projects', true)
    }

    if (pageNum && pageSize)
      return {
        data: getPagedData(projectsCache.value, pageNum, pageSize),
        totalSize: projectsCache.value.length,
      }
    return { data: projectsCache.value, totalSize: projectsCache.value.length }
  }

  /** 收藏缓存 */
  const collectionsCache = ref<Collection[]>([])

  /**
   * 获取收藏信息。
   */
  async function getCollections(): Promise<Collection[]> {
    if (!isInitialized.value.get('collections')) {
      isInitialized.value.set('collections', true)

      collectionsCache.value = await (await fetch(dataSource + 'collections.json')).json()
    }

    return collectionsCache.value
  }

  /** 节目缓存 */
  const programsCache = ref<Program[]>([])

  /**
   * 获取节目信息。
   */
  async function getPrograms(): Promise<Program[]> {
    if (!isInitialized.value.get('programs')) {
      isInitialized.value.set('programs', true)

      type ProgramRawEx = {
        releaseDate: {
          $date: string
        }
        urls: [string, string][]
      }
      const raws: (Program | ProgramRawEx)[] = await (
        await fetch(dataSource + 'programs.json')
      ).json()
      raws.forEach((r) => {
        r.releaseDate = new Date((r as ProgramRawEx).releaseDate.$date)
        r.urls = new Map((r as ProgramRawEx).urls)
        programsCache.value.push(r as Program)
      })
    }

    return programsCache.value
  }

  return {
    getArticles,
    getPictures,
    getProjects,
    getCollections,
    getPrograms,
  }
})
