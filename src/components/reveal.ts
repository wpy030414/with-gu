import type { CSSProperties } from 'react'

import type { RevealStep } from '@/engine/pacing'

/**
 * 把一行的时间轴摊成行内 CSS 变量。
 *
 * 时长、步数、起点必须**一起**传：在 CSS 里写死其中任何一项，
 * 都会和另外两项对不上 —— 短行揭得太慢、长行跳着走、行间挤在一起。
 * 时间轴由 `engine/pacing` 统一排，这里只负责把数字递给样式表。
 */
export function revealVars(step: RevealStep): CSSProperties {
  return {
    '--line-dur': `${step.durationMs}ms`,
    '--line-steps': step.steps,
    '--line-delay': `${step.delayMs}ms`,
  } as CSSProperties
}
