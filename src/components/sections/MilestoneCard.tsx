import { getArt } from '@/art/milestones'
import { formatChineseDate, toIsoDate } from '@/engine/dates'
import { seedFromString } from '@/engine/rng'
import type { Milestone } from '@/content/timeline'
import { AsciiArt } from '@/components/fx/AsciiArt'
import { Narration } from '@/components/fx/Narration'
import { useInView } from '@/hooks/useInView'

import styles from './MilestoneCard.module.css'

export interface MilestoneCardProps {
  milestone: Milestone
  /** 序号，用于决定导演优先级（越靠前越优先） */
  index: number
  pool?: string
}

/**
 * 时间线节点
 *
 * 视觉上是**终端输出里的一段**，不是一张卡片：没有边框、没有背景块，
 * 由一行 `cat` 命令开启，节点之间用一条虚线分隔。语义上仍是
 * `<ol>` 里的一个 `<li>`（屏幕阅读器与搜索引擎都照旧）。
 */
export function MilestoneCard({ milestone, index, pool }: MilestoneCardProps) {
  const { ref, inView } = useInView<HTMLLIElement>({
    rootMargin: '0px 0px -20% 0px',
    threshold: 0.1,
  })

  const art = getArt(milestone.art)

  const dateLabel = milestone.untilDate
    ? `${formatChineseDate(milestone.date)} — ${formatChineseDate(milestone.untilDate)}`
    : formatChineseDate(milestone.date)

  return (
    <li
      ref={ref}
      className={styles.card}
      data-accent={milestone.accent ?? 'default'}
      data-milestone={milestone.id}
    >
      {/* 屏幕上敲的那条命令。id 已在下面的 MILESTONE_xx 里给了读屏用户，
          这里再念一遍路径只是噪音 */}
      <p className={styles.command} aria-hidden="true">{`cat milestones/${milestone.id}.log`}</p>

      <header className={styles.meta}>
        <span className={styles.code}>{milestone.code}</span>
        <span className={styles.leader} aria-hidden="true" />
        <span className={styles.tag}>{milestone.tag}</span>
      </header>

      <time className={styles.date} dateTime={toIsoDate(milestone.date)}>
        {dateLabel}
      </time>

      <h2 className={styles.title}>{milestone.title}</h2>

      <div className={styles.art}>
        <AsciiArt
          id={`art-${milestone.id}`}
          art={art}
          mode={milestone.reveal}
          durationMs={milestone.durationMs}
          seed={seedFromString(milestone.id)}
          pool={pool}
          priority={100 - index}
          label={`${milestone.title} 的字符画`}
        />
      </div>

      <Narration lines={milestone.lines} visible={inView} />
    </li>
  )
}
