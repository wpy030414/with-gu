import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { DEFAULT_POOL } from '@/engine/charset'
import { director, type AnimationActor } from '@/engine/director'
import { buildGrid } from '@/engine/grid'
import { renderBrightLayer, renderNoiseLayer } from '@/engine/render'
import { countDecoded, decodedMask, isFullyDecoded, type RevealMode } from '@/engine/reveal'
import { seedFromString } from '@/engine/rng'

export interface UseCharAnimationOptions {
  /** 字符画原文 */
  art: string
  /** 揭开顺序 */
  mode?: RevealMode
  /** 全部解码完成所需时长（毫秒） */
  durationMs?: number
  /** 种子；默认由 art 内容派生，保证同一幅画永远同一顺序 */
  seed?: number
  /** 是否推进（通常来自 useInView）。离开视口只是暂停，进度保留 */
  play: boolean
  /** 系统「减弱动态效果」 */
  reducedMotion: boolean
  /** 字符池，来自实测（见 engine/measure.ts） */
  pool?: string
  /** 导演优先级 */
  priority?: number
  /** 唯一 id —— 重复注册会覆盖同 id 的旧演员 */
  id: string
}

export interface UseCharAnimationResult {
  /** 亮层：已解码的目标字符。**唯一带辉光的一层** */
  brightRef: React.RefObject<HTMLPreElement | null>
  /** 暗层：只在未解码格作画的乱码。无辉光，面积随解码推进递减至零 */
  noiseRef: React.RefObject<HTMLPreElement | null>
  /** 是否已完成 —— 用于 `data-reveal-state`，E2E 靠它等待而不靠时间 */
  settled: boolean
}

/**
 * 随机字符解码动画
 *
 * 三层协作，各司其职：
 *
 * - **本 hook** 持有进度（`elapsed`）与两层 DOM 的写入；
 * - **导演** 决定何时推进、何时暂停（唯一 rAF + 优先级预算）；
 * - **引擎纯函数** 决定这一帧该显示什么。
 *
 * 几条不能破的规矩（都对应真实会发生的 bug）：
 *
 * 1. `<pre>` 元素**永远不传 children** —— React 只 diff 它管理的 DOM，
 *    我们直接改 `textContent`，一旦 React 也去写就会互相覆盖。
 * 2. 可变状态放 `useRef` / 闭包，**绝不每帧 setState**（等于每帧重渲染）。
 *    唯一的 setState 是完成时的 `setSettled(true)`，一辈子只跑一次。
 * 3. 每帧守卫 `isConnected` —— 对已卸载节点写 `textContent` **不抛错**，
 *    是静默空转：白烧 CPU、画面空白且无声。
 * 4. effect 依赖只放**原始值或 memo 化的稳定引用**，否则每次渲染都重启循环，
 *    表现为动画反复重置。
 */
export function useCharAnimation(options: UseCharAnimationOptions): UseCharAnimationResult {
  const {
    art,
    mode = 'dissolve',
    durationMs = 2400,
    play,
    reducedMotion,
    pool = DEFAULT_POOL,
    priority = 0,
    id,
  } = options

  // useMemo 保证引用稳定：art 不变则 grid/seed 不变，effect 不会被无谓重启
  const grid = useMemo(() => buildGrid(art), [art])
  const seed = useMemo(() => options.seed ?? seedFromString(art), [options.seed, art])

  const brightRef = useRef<HTMLPreElement>(null)
  const noiseRef = useRef<HTMLPreElement>(null)

  // 惰性初始化：减弱动态效果下从第一帧起就是终态，
  // 于是首帧的 DOM 写入无需再同步 setState（那会多触发一轮渲染）
  const [settled, setSettled] = useState(() => reducedMotion)

  const decodeOptions = useMemo(
    () => ({ cols: grid.cols, rows: grid.rows, mode, seed, durationMs }),
    [grid.cols, grid.rows, mode, seed, durationMs],
  )

  /**
   * 首帧同步写入。
   * 用 useLayoutEffect 而非 useEffect：后者会让浏览器先画一帧空白再补上，
   * 在纪念站的首屏是看得见的闪烁。
   */
  useLayoutEffect(() => {
    const bright = brightRef.current
    const noise = noiseRef.current
    if (!bright || !noise) return

    if (reducedMotion) {
      // 减弱动态效果：首帧即终态，不做任何循环。
      // settled 由 useState 的惰性初始化覆盖，这里不 setState
      bright.textContent = renderBrightLayer(grid, decodedMask(durationMs, decodeOptions))
      noise.textContent = ''
      return
    }

    // 起始帧（t=0）。settled 默认即为 false，同样不需要同步写回
    const mask = decodedMask(0, decodeOptions)
    bright.textContent = renderBrightLayer(grid, mask)
    noise.textContent = renderNoiseLayer(grid, mask, pool, 0, seed)
  }, [grid, decodeOptions, durationMs, pool, seed, reducedMotion])

  /** 注册演员 —— 进度与推进逻辑都在这里 */
  useEffect(() => {
    if (reducedMotion) return

    const bright = brightRef.current
    const noise = noiseRef.current
    if (!bright || !noise || grid.cols === 0) return

    let elapsed = 0
    let lastDecodedCount = -1
    let finished = false

    const actor: AnimationActor = {
      id,
      priority,
      visible: false,

      tick(dt, noiseFrame) {
        // 卸载后写入不会抛错 —— 必须自己发现并退出
        if (finished || !bright.isConnected || !noise.isConnected) return false

        elapsed += dt
        const mask = decodedMask(elapsed, decodeOptions)

        // 亮层是**单调递增**的：只在真的解码了新格子时重写。
        // 这正是把重绘从 60Hz 降到十几 Hz、让辉光成本可接受的关键。
        const decoded = countDecoded(mask)
        if (decoded !== lastDecodedCount) {
          lastDecodedCount = decoded
          bright.textContent = renderBrightLayer(grid, mask)
        }

        noise.textContent = renderNoiseLayer(grid, mask, pool, noiseFrame, seed)

        if (isFullyDecoded(mask)) {
          finished = true
          noise.textContent = ''
          setSettled(true)
          return false
        }

        return true
      },

      settle() {
        const mask = decodedMask(durationMs, decodeOptions)
        bright.textContent = renderBrightLayer(grid, mask)
        noise.textContent = ''
        finished = true
        setSettled(true)
      },
    }

    director.register(actor)

    // StrictMode 下会 mount → cleanup → mount。
    // cleanup 必须完全对称，否则注册表泄漏会被立刻暴露 —— 这是免费的泄漏检测。
    return () => {
      director.unregister(id)
    }
  }, [id, priority, grid, decodeOptions, durationMs, pool, seed, reducedMotion])

  /** 可见性联动。进度留在演员身上，所以离开视口只是暂停，不会重播 */
  useEffect(() => {
    if (reducedMotion) return
    director.setVisible(id, play)
  }, [id, play, reducedMotion])

  return { brightRef, noiseRef, settled }
}
