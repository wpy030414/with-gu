import { MILESTONES } from '@/content/timeline'
import { planLine } from '@/engine/pacing'
import { revealVars } from '@/components/reveal'
import { useCommandTyping } from '@/hooks/useCommandTyping'
import { useInView } from '@/hooks/useInView'

import { MilestoneCard } from './MilestoneCard'
import styles from './TimelineSection.module.css'

export interface TimelineSectionProps {
  pool?: string
}

/** 屏幕上敲的那条命令 —— 纯装饰，读屏不必念出路径 */
const COMMAND = 'cat timeline.log'

export function TimelineSection({ pool }: TimelineSectionProps) {
  /* threshold 必须是 0：这个 section 比视口高得多，
     `intersectionRatio` 永远到不了 0.15，用默认值它永远不会「进入视口」 */
  const { ref, inView } = useInView<HTMLElement>({ rootMargin: '0px', threshold: 0 })
  const { phase, typingMs, steps } = useCommandTyping({ text: COMMAND, started: inView })

  /* 进入窗口时屏幕应当**什么也没有**：先让 `cat timeline.log` 敲完、
     把标题吐出来，才轮到第一条节点开口。这半秒的先后就是「终端刚醒来」
     与「版面早就摆好了」的分界线。 */
  const settled = phase === 'output'

  // 标题刷出的节奏与命令行同尺 —— 它也是「输出」的一部分
  const headingStep = planLine(`Timeline · 2024 — 2026 ${MILESTONES.length} records`)

  return (
    <section
      ref={ref}
      className={styles.section}
      data-section="timeline"
      data-phase={phase}
      aria-label="时间线"
      style={{ '--typing-dur': `${typingMs}ms`, '--typing-steps': steps } as React.CSSProperties}
    >
      <p className={styles.command} aria-hidden="true">
        <span className={styles.typed}>
          {COMMAND}
          <span className={styles.caret} />
        </span>
      </p>

      <h1 className={styles.heading} style={revealVars(headingStep)}>
        <span>Timeline · 2024 — 2026</span>
        <span className={styles.leader} aria-hidden="true" />
        <span className={styles.count}>{MILESTONES.length} records</span>
      </h1>

      {/* 语义化有序列表 —— 屏幕阅读器能完整朗读整条时间线。
          视觉上它不再是七张卡片，而是同一台终端里连续的七段输出
          （见 MilestoneCard） */}
      <ol className={styles.list}>
        {MILESTONES.map((milestone, index) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            index={index}
            pool={pool}
            ready={index === 0 ? settled : true}
          />
        ))}
      </ol>
    </section>
  )
}
