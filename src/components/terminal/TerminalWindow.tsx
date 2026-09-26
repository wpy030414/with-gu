import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import styles from './TerminalWindow.module.css'

/**
 * 终端窗口外壳
 *
 * 正片（时间线 / 尾声 / 命令行）整体活在**一个**窗口里：标题栏与命令行
 * 常驻，内容在窗口内部的屏幕上滚动。这是「读一台终端」与
 * 「读一个用了终端配色的网页」的分界线 —— 后者是七张各带边框的卡片
 * 铺在页面上，前者只有一个窗口（见 ADR-014）。
 *
 * 窗口是 `position: fixed` 的：它脱离文档流，于是**页面本身不再滚动**，
 * 滚动全部发生在内部屏幕上。这也顺带解决了「边框跟着内容滚走」
 * 的沉浸感问题。
 *
 * 首屏（BootScreen）刻意不吃这层外壳 —— 开机时屏幕还没开机，
 * 开机序列本身就是「窗口尚未出现的黑屏」，见 PRD 的功能关系图。
 */

interface ScreenApi {
  /** 把屏幕滚到底部 —— 新的命令输出总是出现在最下方 */
  scrollToBottom: () => void
}

const ScreenContext = createContext<ScreenApi | null>(null)

/**
 * 取当前窗口的屏幕控制句柄。
 *
 * 不在窗口里调用时返回 null 而不是抛错：命令行组件在理论上可以被
 * 单独渲染（单测里就是），硬性依赖会让它无法独立存在。
 */
export function useTerminalScreen(): ScreenApi | null {
  return useContext(ScreenContext)
}

export interface TerminalWindowProps {
  /** 标题栏正文，例如 `gu@with-gu: ~/timeline` */
  title: string
  /** 标题栏右侧的会话信息（编码、尺寸一类），纯装饰 */
  meta?: string
  /** 常驻底部的命令行 */
  prompt: ReactNode
  /** 屏幕内容 —— 时间线、尾声、命令输出 */
  children: ReactNode
}

export function TerminalWindow({ title, meta, prompt, children }: TerminalWindowProps) {
  const screenRef = useRef<HTMLDivElement>(null)
  const [settled, setSettled] = useState(false)

  const api = useMemo<ScreenApi>(
    () => ({
      scrollToBottom: () => {
        const screen = screenRef.current
        if (!screen) return

        screen.scrollTop = screen.scrollHeight
      },
    }),
    [],
  )

  /* 入场动画的可观测状态。
     `opacity` 未落定的那一帧里，axe 会把整窗文字当成半透明色去算对比度
     （实测前景 #ffab2e 被算成 #463010，判 serious）。测试要等的是**状态**，
     不是时间 —— 所以这里像 AsciiArt 一样把「动画收势」暴露成属性。 */
  const handleAnimationEnd = useCallback((event: React.AnimationEvent<HTMLDivElement>) => {
    // 子元素的动画也会冒泡上来，只有窗口自己的那次才算数
    if (event.target !== event.currentTarget) return
    setSettled(true)
  }, [])

  return (
    <div
      className={styles.window}
      data-terminal-window
      data-enter-state={settled ? 'done' : 'pending'}
      onAnimationEnd={handleAnimationEnd}
    >
      <header className={styles.titlebar}>
        <span className={styles.lights} aria-hidden="true">
          <span className={styles.light} />
          <span className={styles.light} />
          <span className={styles.light} />
        </span>

        <span className={styles.title}>{title}</span>

        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </header>

      <div
        ref={screenRef}
        className={styles.screen}
        data-terminal-screen
        /* 屏幕自己就是那个滚动区域，必须可键盘聚焦 ——
           否则键盘用户根本滚不动它（axe 的 scrollable-region-focusable）。 */
        role="region"
        aria-label="终端屏幕"
        tabIndex={0}
      >
        <ScreenContext.Provider value={api}>{children}</ScreenContext.Provider>
      </div>

      <div className={styles.promptbar}>{prompt}</div>
    </div>
  )
}
