import { MILESTONES } from '@/content/timeline'

import { MilestoneCard } from './MilestoneCard'
import styles from './TimelineSection.module.css'

export interface TimelineSectionProps {
  pool?: string
}

/** 屏幕上敲的那条命令 —— 纯装饰，读屏不必念出路径 */
const COMMAND = 'gu@with-gu:~$ cat timeline.log'

export function TimelineSection({ pool }: TimelineSectionProps) {
  return (
    <section className={styles.section} aria-label="时间线">
      <p className={styles.command} aria-hidden="true">
        {COMMAND}
      </p>

      <h1 className={styles.heading}>
        <span>Timeline · 2024 — 2026</span>
        <span className={styles.leader} aria-hidden="true" />
        <span className={styles.count}>{MILESTONES.length} records</span>
      </h1>

      {/* 语义化有序列表 —— 屏幕阅读器能完整朗读整条时间线。
          视觉上它不再是七张卡片，而是同一台终端里连续的七段输出
          （见 MilestoneCard 的样式）。 */}
      <ol className={styles.list}>
        {MILESTONES.map((milestone, index) => (
          <MilestoneCard key={milestone.id} milestone={milestone} index={index} pool={pool} />
        ))}
      </ol>
    </section>
  )
}
