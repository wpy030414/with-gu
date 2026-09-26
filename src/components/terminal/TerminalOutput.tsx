import { useEffect, useRef } from 'react'

import { useTerminalScreen } from './TerminalWindow'
import { useTerminalSession } from './TerminalSession'
import styles from './TerminalOutput.module.css'

/**
 * 命令历史输出
 *
 * 渲染在**屏幕内容流的末尾**（时间线与尾声之下），而不是窗口底部的
 * 固定面板里 —— 真终端里命令输出就是屏幕内容的一部分，会随滚动离开视野。
 * 底部常驻的只有提示符，见 `TerminalPrompt`。
 */
export function TerminalOutput() {
  const { entries } = useTerminalSession()
  const screen = useTerminalScreen()

  const previousCount = useRef(entries.length)

  // 新输出总是要落在视野里。只在**变多**时滚动：
  // `clear` 之后为空，不该再把屏幕拉到底。
  useEffect(() => {
    if (entries.length > previousCount.current) {
      screen?.scrollToBottom()
    }

    previousCount.current = entries.length
  }, [entries.length, screen])

  if (entries.length === 0) return null

  return (
    /* aria-live：命令是用户主动发起的，输出必须能被读屏播报 ——
       否则对屏幕阅读器用户来说，敲回车之后什么都没有发生 */
    <div className={styles.output} aria-live="polite" aria-label="命令输出">
      {entries.map((entry) => (
        <div key={entry.id}>
          <p className={styles.echo}>{entry.command}</p>
          {entry.node}
        </div>
      ))}
    </div>
  )
}
