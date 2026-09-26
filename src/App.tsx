import { useEffect, useState } from 'react'

import { CrtOverlay } from '@/components/crt/CrtOverlay'
import { BootScreen } from '@/components/sections/BootScreen'
import { Epilogue } from '@/components/sections/Epilogue'
import { TimelineSection } from '@/components/sections/TimelineSection'
import { TerminalOutput } from '@/components/terminal/TerminalOutput'
import { TerminalPrompt } from '@/components/terminal/TerminalPrompt'
import { TerminalSession } from '@/components/terminal/TerminalSession'
import { TerminalWindow } from '@/components/terminal/TerminalWindow'
import { DEFAULT_POOL } from '@/engine/charset'
import { director } from '@/engine/director'
import { measureCellMetrics } from '@/engine/measure'
import { useReducedMotion } from '@/hooks/useMediaQuery'

export default function App() {
  const reducedMotion = useReducedMotion()

  const [entered, setEntered] = useState(false)
  const [pool, setPool] = useState<string>(DEFAULT_POOL)

  /**
   * 字体就绪后实测栅格与字符池。
   *
   * 必须门控在 `document.fonts.ready` 之后 —— FOUT 期间量到的是回退字体的宽度，
   * 浏览器各处的等宽字体 advance 并不相同，据此得出的结论是错的。
   * `measureCellMetrics` 内部已处理这件事，并在字体缺字时降级为纯 ASCII 池。
   */
  useEffect(() => {
    let cancelled = false

    void measureCellMetrics().then((metrics) => {
      if (cancelled) return

      setPool(metrics.pool)

      /* 实测结果挂到 <html> 上，作为可观测的诊断信号：
         字符画是否降级为纯 ASCII 取决于**这台机器**装了什么字体，
         而这正是「本地全绿、CI 全红」那类故障的源头。
         有了这个属性，Playwright 的 trace、真机 DevTools 都能一眼看出
         问题机器落在哪一侧，不必再靠猜。 */
      document.documentElement.dataset.charPool =
        metrics.pool === DEFAULT_POOL ? 'default' : 'ascii'
    })

    return () => {
      cancelled = true
    }
  }, [])

  /** 降级策略由导演统一执行，不分散到各组件里各自判断 */
  useEffect(() => {
    director.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  return (
    <>
      <CrtOverlay />

      {entered ? (
        /* 正片整体活在**一个终端窗口**里：标题栏与命令行常驻，
           时间线、尾声、命令输出都在窗口内部的屏幕上滚动。
           首屏不吃这层外壳 —— 开机时窗口还没出现（见 ADR-014）。 */
        <TerminalSession>
          <TerminalWindow title="user -- -zsh" meta="UTF-8 · 80×24" prompt={<TerminalPrompt />}>
            <a className="sr-only" href="#terminal-input">
              跳到命令行
            </a>

            <main id="timeline">
              <TimelineSection pool={pool} />
              <Epilogue pool={pool} />
            </main>

            <TerminalOutput />
          </TerminalWindow>
        </TerminalSession>
      ) : (
        <BootScreen pool={pool} onEnter={() => setEntered(true)} />
      )}
    </>
  )
}
