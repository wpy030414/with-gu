import { planLines } from '@/engine/pacing'
import { revealVars } from '@/components/reveal'

import styles from './Narration.module.css'

export interface NarrationProps {
  lines: readonly string[]
  /** 进入输出阶段后置 true，才开始逐行揭开 */
  visible: boolean
}

/**
 * 叙述文本
 *
 * 完整文本始终在 DOM 中（`clip-path` 只做视觉揭开），
 * 因此屏幕阅读器与搜索引擎都能拿到全文。
 *
 * 逐行的节奏与命令行是**同一把尺子**（engine/pacing）：每字同样 30ms，
 * 前一行刷完下一行才起步 —— 输出读起来像终端在往下打，而不是整块浮现。
 */
export function Narration({ lines, visible }: NarrationProps) {
  return (
    <p className={styles.lines} data-visible={visible}>
      {planLines(lines).map(({ text, step }) => (
        <span key={text} className={styles.line} style={revealVars(step)}>
          {text}
        </span>
      ))}
    </p>
  )
}
