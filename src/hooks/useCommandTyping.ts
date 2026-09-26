import { useEffect, useState } from 'react'

import { useReducedMotion } from './useMediaQuery'

/**
 * 每个字符的敲击间隔。
 *
 * 这不是「人打字的速度」—— 人手打字 100ms 以上一个字，那样一段命令行要敲三秒，
 * 读的人早就滚走了。要的是**终端回显**的节奏：让眼睛看得见它是被敲出来的，
 * 而不是「啪」地贴上去。再快就分辨不出来了。
 */
export const TYPING_PER_CHAR_MS = 30

/**
 * 一段会话的三个阶段：
 *
 * - `idle`   还没滚到，什么也没发生
 * - `typing` 命令正在被敲出来
 * - `output` 命令敲完了，轮到输出
 */
export type TypingPhase = 'idle' | 'typing' | 'output'

export interface UseCommandTypingOptions {
  /** 要敲出来的命令行正文（不含提示符） */
  readonly text: string
  /** 元素是否已进入视口 —— 滚到了才开始敲 */
  readonly started: boolean
}

export interface UseCommandTypingResult {
  readonly phase: TypingPhase
  /** 打字动画时长（毫秒）。减弱动态效果下为 0，即瞬间完成 */
  readonly typingMs: number
  /** 字符数 —— CSS 用 `steps()` 逐字揭开时需要 */
  readonly steps: number
}

/**
 * 命令行打字
 *
 * 把「先输入命令、再输出结果」这件事变成一个可观测的阶段，
 * 让 CSS 与字符画引擎都能挂在同一个时间轴上。
 *
 * 两条刻意的选择：
 *
 * 1. **滚动不到就不开始**。`idle` 是真实存在的阶段 —— 不是「已经载入好但没显示」。
 * 2. **敲完才轮到输出**，且用定时器而不是 `animationend` 来宣告这件事。
 *    动画一旦因任何原因没跑（元素被跳过渲染、动画被禁），事件就永远不来，
 *    整个节点会卡在打字态，**标题与字符画永不出现**。时间轴是单向的，
 *    没有这个单点故障。
 *
 * 减弱动态效果下 `typingMs` 为 0：阶段照走，只是瞬间到位 ——
 * 内容完整可读，不是「跳过内容」。
 */
export function useCommandTyping({
  text,
  started,
}: UseCommandTypingOptions): UseCommandTypingResult {
  const reducedMotion = useReducedMotion()
  const typingMs = reducedMotion ? 0 : text.length * TYPING_PER_CHAR_MS

  /**
   * 「已经开过口」是**单向**的。
   *
   * 不能直接拿 `started` 当时钟的开关：IntersectionObserver 会在元素贴着
   * 视口边缘时反复进出（rootMargin 那条 -20% 的线就是抖动源），
   * 计时器随之反复 `clearTimeout` + 重设 —— 只要抖动比打字时长短，
   * 这一行就**永远敲不完**，字符画也就永远等不到 `armed`。
   * E2E 里 `nanjing` 节点就卡在这个死循环上，卡足 20 秒。
   *
   * 在渲染期派生而不是放进 effect：这是 React 认可的「随 prop 调整 state」，
   * 同一次渲染里就会重来，不会多提交一帧；放进 effect 则要多渲染一轮。
   */
  const [startedOnce, setStartedOnce] = useState(false)
  if (started && !startedOnce) setStartedOnce(true)

  /** 命令是否已经敲完。同样只置真 */
  const [done, setDone] = useState(false)

  const phase: TypingPhase = done ? 'output' : startedOnce ? 'typing' : 'idle'

  // 敲完才轮到输出。用定时器而不是 animationend：
  // 动画一旦因任何原因没跑（元素被跳过渲染、动画被禁），事件就永远不来，
  // 整个节点会卡在打字态、标题与字符画永不出现。时间轴是单向的，没有这个单点故障。
  useEffect(() => {
    if (phase !== 'typing') return

    const timer = setTimeout(() => setDone(true), typingMs)

    return () => clearTimeout(timer)
  }, [phase, typingMs])

  return { phase, typingMs, steps: text.length }
}
