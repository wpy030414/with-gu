import { useEffect, useState } from 'react'

import { getArt } from '@/art/milestones'
import { formatChineseDate, toIsoDate } from '@/engine/dates'
import { planLine, totalMs } from '@/engine/pacing'
import { seedFromString } from '@/engine/rng'
import type { Milestone } from '@/content/timeline'
import { AsciiArt } from '@/components/fx/AsciiArt'
import { Narration } from '@/components/fx/Narration'
import { revealVars } from '@/components/reveal'
import { useCommandTyping } from '@/hooks/useCommandTyping'
import { useInView } from '@/hooks/useInView'
import { useReducedMotion } from '@/hooks/useMediaQuery'

import styles from './MilestoneCard.module.css'

export interface MilestoneCardProps {
  milestone: Milestone
  /** 序号，用于决定导演优先级（越靠前越优先） */
  index: number
  pool?: string
  /**
   * 上一条会话是否已交付完毕。默认 true。
   *
   * 只有**首屏那个节点**会收到 false —— 进入窗口时屏幕应当什么也没有，
   * 先让 `cat timeline.log` 敲完、把标题吐出来，才轮到第一条节点开口。
   * 其余的节点不靠这个串行：它们由滚动驱动，用户滚到才触发，本来就是依次的。
   */
  ready?: boolean
}

/**
 * 时间线节点
 *
 * 视觉上是**终端输出里的一段**，不是一张卡片：没有边框、没有背景块，
 * 由一行 `cat` 命令开启，节点之间用虚线分隔。语义上仍是
 * `<ol>` 里的一个 `<li>`（屏幕阅读器与搜索引擎都照旧）。
 *
 * 而且这一段是**滚动驱动的**：滚到之前什么也没有（`idle`），滚到了才先敲命令
 * （`typing`），敲完才吐结果（`output`）—— 三种状态都挂在 `data-phase` 上，
 * E2E 等这个属性而不是等时间。
 */
export function MilestoneCard({ milestone, index, pool, ready = true }: MilestoneCardProps) {
  const { ref, inView } = useInView<HTMLLIElement>({
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.1,
  })

  const command = `cat milestones/${milestone.id}.log`
  const { phase, typingMs, steps } = useCommandTyping({
    text: command,
    started: inView && ready,
  })

  const reducedMotion = useReducedMotion()

  const art = getArt(milestone.art)

  const dateLabel = milestone.untilDate
    ? `${formatChineseDate(milestone.date)} — ${formatChineseDate(milestone.untilDate)}`
    : formatChineseDate(milestone.date)

  /* 输出的三行走的是**和输入同一把尺子**（engine/pacing）：
     每字同样 30ms，前一行刷完下一行才起步。行内的 `[ ` / `@ ` 这些记号由
     CSS 的伪元素加上，所以这里把它们也算进列宽，免得时长对不上。 */
  const metaStep = planLine(`${milestone.code} [ ${milestone.tag} ]`)
  const dateStep = planLine(`@ ${dateLabel}`, metaStep.endMs)
  const titleStep = planLine(milestone.title, dateStep.endMs)

  /* 字符画要等文本把话说完才整块进场 —— 它不做流式，
     一出现就是满屏乱码再解码，抢在标题前面出来会像两个东西在吵架。 */
  const textOutputMs = reducedMotion ? 0 : totalMs(titleStep)
  const [artReady, setArtReady] = useState(false)

  useEffect(() => {
    if (phase !== 'output') return

    const timer = setTimeout(() => setArtReady(true), textOutputMs)

    return () => clearTimeout(timer)
  }, [phase, textOutputMs])

  return (
    <li
      ref={ref}
      className={styles.card}
      data-accent={milestone.accent ?? 'default'}
      data-milestone={milestone.id}
      data-phase={phase}
      data-art={artReady ? 'ready' : 'pending'}
      style={{ '--typing-dur': `${typingMs}ms`, '--typing-steps': steps } as React.CSSProperties}
    >
      {/* 屏幕上敲的那条命令。id 已在下面的 MILESTONE_xx 里给了读屏用户，
          这里再念一遍路径只是噪音 */}
      <p className={styles.command} aria-hidden="true">
        <span className={styles.typed}>
          {command}
          <span className={styles.caret} />
        </span>
      </p>

      {/* 结果区。整块完整地留在 DOM 里（读屏与检索都不受影响），
          视觉上由 clip-path 揭开 —— 于是它**始终占着布局**，
          揭开过程不会引发 CLS 或滚动锚定跳变 */}
      <div className={styles.result}>
        <header className={styles.meta} style={revealVars(metaStep)}>
          <span className={styles.code}>{milestone.code}</span>
          <span className={styles.leader} aria-hidden="true" />
          <span className={styles.tag}>{milestone.tag}</span>
        </header>

        <time
          className={styles.date}
          dateTime={toIsoDate(milestone.date)}
          style={revealVars(dateStep)}
        >
          {dateLabel}
        </time>

        <h2 className={styles.title} style={revealVars(titleStep)}>
          {milestone.title}
        </h2>

        <div className={styles.art}>
          <AsciiArt
            id={`art-${milestone.id}`}
            art={art}
            mode={milestone.reveal}
            durationMs={milestone.durationMs}
            seed={seedFromString(milestone.id)}
            pool={pool}
            priority={100 - index}
            armed={artReady}
            label={`${milestone.title} 的字符画`}
          />
        </div>

        <Narration lines={milestone.lines} visible={phase === 'output'} />
      </div>
    </li>
  )
}
