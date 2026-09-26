import { displayWidth } from './grid'

/**
 * 节奏
 *
 * 输入与输出共用**一把尺子**：命令是逐字敲出来的，结果是逐字刷出来的，
 * 两者都是每个字符 `TYPING_PER_CHAR_MS`。这个数取自「终端回显」而不是
 * 「人手打字」—— 人手 100ms 以上一个字，一段命令行要敲三秒，读的人早滚走了。
 * 快于 30ms 就分辨不出它是被敲出来的还是「啪」地贴上去的。
 *
 * 这一层刻意做成纯函数（零 DOM、零 React），因为它是**唯一**能回答
 * 「这一段要刷多久」的地方 —— 字符画什么时候进场、E2E 观察到什么状态，
 * 全都指望它算出来的数，不能埋在组件的 JSX 里各算各的。
 */

/** 每个字符的推进间隔（毫秒） */
export const TYPING_PER_CHAR_MS = 30

/** 行与行之间的停顿 —— 比字符间隔大，读的人才知道一行结束了 */
export const LINE_GAP_MS = 90

export interface RevealStep {
  /** 揭开要分几步 —— 直接喂给 CSS 的 `steps()`，一步一个字符 */
  readonly steps: number
  /** 这一行刷完要多久 */
  readonly durationMs: number
  /** 从整段开头算起，这一行什么时候开始 */
  readonly delayMs: number
  /** 下一行可以从这里起步（本行结束 + 行间停顿） */
  readonly endMs: number
}

/**
 * 给一行排出揭开时间轴。
 *
 * 步数用**列宽**而不是字符数：中文在等宽排版里占两列，
 * 按字符数算会让中文行看着快一倍（一步蹦出两个字）。
 * 口径与 `engine/grid.ts` 一致。
 */
export function planLine(text: string, offsetMs = 0): RevealStep {
  const steps = Math.max(1, displayWidth(text))
  const durationMs = steps * TYPING_PER_CHAR_MS

  return {
    steps,
    durationMs,
    delayMs: offsetMs,
    endMs: offsetMs + durationMs + LINE_GAP_MS,
  }
}

/** 整段刷完需要多久 —— 字符画要等它，别提前抢戏 */
export function totalMs(step: RevealStep): number {
  return step.delayMs + step.durationMs
}

export interface PlannedLine {
  readonly text: string
  readonly step: RevealStep
}

/**
 * 给一串行排出「前一行刷完，下一行接着刷」的整条时间轴。
 *
 * 累积游标留在这里而不是组件的渲染体里：那属于编排，不属于表现 ——
 * 而且渲染期改外部变量会被 lint 拦下（它确实不该那么写）。
 */
export function planLines(lines: readonly string[]): readonly PlannedLine[] {
  const planned: PlannedLine[] = []
  let offset = 0

  for (const text of lines) {
    const step = planLine(text, offset)
    planned.push({ text, step })
    offset = step.endMs
  }

  return planned
}
