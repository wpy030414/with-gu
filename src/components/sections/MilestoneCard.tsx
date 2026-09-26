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
      <header className={styles.header}>
        <span className={styles.code}>{milestone.code}</span>
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
