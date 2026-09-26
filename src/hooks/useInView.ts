import { useEffect, useRef, useState } from 'react'

export interface UseInViewOptions {
  /** 根边距 —— 默认提前触发，让动画在元素真正进入视野前就开始 */
  rootMargin?: string
  threshold?: number
}

export interface UseInViewResult<T extends Element> {
  ref: React.RefObject<T | null>
  inView: boolean
}

/**
 * 元素是否（曾）进入视口。
 *
 * 注意这里**不做**「离开即重置」：动画进度保存在导演的演员身上，
 * 离开视口只是暂停推进，进度原样保留 —— 于是来回滚动不会重播，
 * 也不会突然跳到终态（见 engine/director.ts 的预算说明）。
 */
export function useInView<T extends Element>(
  options: UseInViewOptions = {},
): UseInViewResult<T> {
  const { rootMargin = '0px 0px -15% 0px', threshold = 0.15 } = options

  const ref = useRef<T>(null)

  // 惰性初始化而非在 effect 里同步 setState —— 后者会多触发一轮渲染。
  // 旧浏览器没有 IntersectionObserver 时直接视为可见。
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting)
        }
      },
      { rootMargin, threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return { ref, inView }
}
