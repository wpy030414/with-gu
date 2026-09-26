import { describe, expect, it } from 'vitest'

import { LINE_GAP_MS, TYPING_PER_CHAR_MS, planLine, planLines, totalMs } from '@/engine/pacing'

/**
 * 节奏
 *
 * 这一层是「这一段要刷多久」的**唯一**答案：命令行的打字时长、结果行的
 * 揭开速度、字符画什么时候进场，全都从这里取数。它算错了不会有任何报错，
 * 只会让输出要么快得看不清、要么慢得人走掉。
 */
describe('一行的时长', () => {
  it('由列宽决定，不是字符数', () => {
    const ascii = planLine('cat x.log')
    expect(ascii.steps).toBe(9)
    expect(ascii.durationMs).toBe(9 * TYPING_PER_CHAR_MS)

    // 中文在等宽排版里占两列。若按字符数算，中文行会看着快一倍 ——
    // 一步蹦出两个字，正是「输出比输入快」的那种突兀感
    const chinese = planLine('门可罗雀的直播间')
    expect(chinese.steps).toBe(16)
    expect(chinese.durationMs).toBe(16 * TYPING_PER_CHAR_MS)
  })

  it('绝不给出 0 步 —— steps(0) 落到 CSS 里是无效值', () => {
    expect(planLine('').steps).toBe(1)
  })

  it('起点是给定的偏移，终点还要多留一段行间停顿', () => {
    const step = planLine('abc', 500)

    expect(step.delayMs).toBe(500)
    expect(step.endMs).toBe(500 + step.durationMs + LINE_GAP_MS)
    expect(totalMs(step)).toBe(500 + step.durationMs)
  })
})

describe('整段的时间轴', () => {
  it('前一行刷完，下一行才起步 —— 行间留着停顿', () => {
    const delays = planLines(['abc', 'de', 'f']).map((planned) => planned.step.delayMs)

    expect(delays).toEqual([
      0,
      3 * TYPING_PER_CHAR_MS + LINE_GAP_MS,
      (3 + 2) * TYPING_PER_CHAR_MS + 2 * LINE_GAP_MS,
    ])
  })

  it('原文与时间轴一一对应，顺序不变', () => {
    const planned = planLines(['第一行', 'second line'])

    expect(planned.map((item) => item.text)).toEqual(['第一行', 'second line'])
    expect(planned.map((item) => item.step.steps)).toEqual([6, 11])
  })

  it('空数组不炸', () => {
    expect(planLines([])).toEqual([])
  })
})
