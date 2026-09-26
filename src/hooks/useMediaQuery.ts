import { useSyncExternalStore } from 'react'

/**
 * 读取媒体查询 —— 用 `useSyncExternalStore` 保证**首帧就是正确值**。
 *
 * 为什么不用 `useEffect` + `useState`：那样浏览器会先按「动画开启」画一帧，
 * 对开了「减弱动态效果」的用户来说就是闪一次乱码 ——
 * 对一个纪念站而言，这是很糟的第一印象。
 *
 * `getServerSnapshot` 返回 `false`：当前是纯 CSR，用不到；
 * 但一旦将来做构建期预渲染（SEO/分享预览），这个口子必须有。
 * 现在写好，届时零改动。
 */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
export const REDUCED_TRANSPARENCY_QUERY = '(prefers-reduced-transparency: reduce)'

interface MediaQueryStore {
  subscribe: (onStoreChange: () => void) => () => void
  getSnapshot: () => boolean
}

/** 每个查询只建一个 store 与一条监听 —— 组件再多也不会重复订阅 */
const stores = new Map<string, MediaQueryStore>()

const noopStore: MediaQueryStore = {
  subscribe: () => () => {},
  getSnapshot: () => false,
}

function getStore(query: string): MediaQueryStore {
  if (typeof window === 'undefined' || !window.matchMedia) return noopStore

  const cached = stores.get(query)
  if (cached) return cached

  const mql = window.matchMedia(query)

  const store: MediaQueryStore = {
    subscribe(onStoreChange) {
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    // 返回布尔原始值 —— 天然满足 useSyncExternalStore 对快照稳定性的要求
    getSnapshot: () => mql.matches,
  }

  stores.set(query, store)
  return store
}

export function useMediaQuery(query: string): boolean {
  const store = getStore(query)
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => false)
}

/** 系统是否开启了「减弱动态效果」 */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY)
}

/** 系统是否要求降低透明度（用于收掉辉光） */
export function useReducedTransparency(): boolean {
  return useMediaQuery(REDUCED_TRANSPARENCY_QUERY)
}
