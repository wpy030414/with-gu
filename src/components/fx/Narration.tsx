import styles from './Narration.module.css'

export interface NarrationProps {
  lines: readonly string[]
  /** 进入视口后置 true，才开始逐行揭开 */
  visible: boolean
}

/**
 * 叙述文本
 *
 * 完整文本始终在 DOM 中（`clip-path` 只做视觉揭开），
 * 因此屏幕阅读器与搜索引擎都能拿到全文。
 */
export function Narration({ lines, visible }: NarrationProps) {
  return (
    <p className={styles.lines} data-visible={visible}>
      {lines.map((line, index) => (
        <span
          key={line}
          className={styles.line}
          style={{ '--line-index': index } as React.CSSProperties}
        >
          {line}
        </span>
      ))}
    </p>
  )
}
