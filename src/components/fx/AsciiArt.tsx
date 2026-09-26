import { memo, useMemo } from 'react'

import { buildGrid } from '@/engine/grid'
import type { RevealMode } from '@/engine/reveal'
import { useCharAnimation } from '@/hooks/useCharAnimation'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useMediaQuery'

import styles from './AsciiArt.module.css'

export interface AsciiArtProps {
  art: string
  /** 揭开顺序 */
  mode?: RevealMode
  durationMs?: number
  seed?: number
  /** 实测得出的字符池（见 engine/measure.ts） */
  pool?: string
  priority?: number
  /** 导演注册用的唯一 id */
  id: string
  /** 无障碍描述。传了才有 role="img"；纯装饰则省略 */
  label?: string
}

/**
 * 字符画
 *
 * 两层 `<pre>` 叠放，**互补划分**：亮层放已解码的目标字符，
 * 暗层只放未解码格的乱码 —— 而不是两层都画满再靠 z-order 叠
 * （那样乱码会从字形缝隙透出来，看起来是「脏」而不是「亮」）。
 *
 * 进视口才开始推进，离开则暂停且保留进度（见 director 的预算说明）。
 */
function AsciiArtImpl({
  art,
  mode = 'dissolve',
  durationMs = 2400,
  seed,
  pool,
  priority = 0,
  id,
  label,
}: AsciiArtProps) {
  const reducedMotion = useReducedMotion()
  const { ref, inView } = useInView<HTMLDivElement>()

  const { brightRef, noiseRef, settled } = useCharAnimation({
    art,
    mode,
    durationMs,
    seed,
    play: inView,
    reducedMotion,
    pool,
    priority,
    id,
  })

  const grid = useMemo(() => buildGrid(art), [art])

  return (
    <div
      ref={ref}
      className={styles.stack}
      data-reveal-state={settled ? 'done' : 'running'}
      style={
        {
          '--art-cols': grid.cols,
          '--art-rows': grid.rows,
        } as React.CSSProperties
      }
      role="img"
      aria-label={label ?? '字符画'}
      /* 字符画宽于容器时会在内部横向滚动。
         滚动区域必须可键盘聚焦，否则键盘用户根本看不到超出的部分
         （axe 的 scrollable-region-focusable）。 */
      tabIndex={0}
    >
      {/* 两个 <pre> 都不传 children —— React 只 diff 它管理的 DOM，
          我们直接改 textContent，一旦 React 也去写就会互相覆盖 */}
      <pre ref={brightRef} className={styles.bright} aria-hidden="true" />
      <pre ref={noiseRef} className={styles.noise} aria-hidden="true" />
    </div>
  )
}

export const AsciiArt = memo(AsciiArtImpl)
