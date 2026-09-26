import { MILESTONES } from '@/content/timeline'

import { MilestoneCard } from './MilestoneCard'
import styles from './TimelineSection.module.css'

export interface TimelineSectionProps {
  pool?: string
}

export function TimelineSection({ pool }: TimelineSectionProps) {
  return (
    <section className={styles.section} aria-label="时间线">
      <h1 className={styles.heading}>Timeline · 2024 — 2026</h1>

      {/* 语义化有序列表 —— 屏幕阅读器能完整朗读整条时间线 */}
      <ol className={styles.list}>
        {MILESTONES.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
            pool={pool}
          />
        ))}
      </ol>
    </section>
  )
}
