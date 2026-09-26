import { describe, expect, it } from 'vitest'

import { ART } from '@/art/milestones'
import { hasFullWidthChar, normalizedArtLines } from '@/engine/grid'

const entries = Object.entries(ART) as Array<[string, string]>

/* ------------------------------------------------------------------ *
 * 最高优先级的不变量：绝不能出现全角字符
 * 全角 = 2 列，会让整幅画的列语义当场失效
 * ------------------------------------------------------------------ */

describe('纯半角约束', () => {
  it.each(entries)('%s 不含全角字符', (_name, art) => {
    expect(hasFullWidthChar(art)).toBe(false)
  })

  it.each(entries)('%s 不含制表符（宽度依上下文而变）', (_name, art) => {
    expect(art).not.toContain('\t')
  })

  it.each(entries)('%s 仅含可打印 ASCII 与换行', (_name, art) => {
    for (const ch of art) {
      const cp = ch.codePointAt(0) ?? 0
      const printableAscii = cp >= 0x20 && cp <= 0x7e
      expect(printableAscii || ch === '\n').toBe(true)
    }
  })
})

/* ------------------------------------------------------------------ *
 * 边框对齐
 *
 * 这是手工字符画最容易**悄悄**坏掉的地方 —— 行尾空格不可见也无害，
 * 所以不校验总宽；只要求同一组框线（`+---+` / `|...|`）宽度一致。
 * ------------------------------------------------------------------ */

/**
 * 框线判定。
 *
 * `|(?!\|)` 这个否定预查很关键：城墙的垛口行以 `||` 起笔，
 * 若不排除，它会被误判成框线而让测试假阳性。
 */
function isFrameLine(line: string): boolean {
  return /^\+-+\+$/.test(line) || /^\|(?!\|).*\|$/.test(line)
}

describe('边框对齐', () => {
  it.each(entries)('%s 的框线宽度一致', (_name, art) => {
    const frameLines = normalizedArtLines(art).filter(isFrameLine)

    if (frameLines.length < 2) return

    const widths = new Set(frameLines.map((line) => line.length))
    expect([...widths]).toHaveLength(1)
  })

  it.each(entries)('%s 的框线左缘对齐到同一列', (_name, art) => {
    const frameLines = normalizedArtLines(art).filter(isFrameLine)

    if (frameLines.length < 2) return

    // 所有框线必须从同一列起笔（缩进相同的视觉块才会整齐）
    const indents = new Set(frameLines.map((line) => line.length - line.trimStart().length))
    expect([...indents]).toHaveLength(1)
  })

  it.each(entries)('%s 不为空且结构完整', (_name, art) => {
    const lines = normalizedArtLines(art)
    expect(lines.length).toBeGreaterThanOrEqual(5)
    expect(lines.some((line) => /[^ ]/.test(line))).toBe(true)
  })
})

/* ------------------------------------------------------------------ *
 * 心形左右对称 —— 这是全站唯一一处明确的对称声明，值得单独守住
 * ------------------------------------------------------------------ */

describe('心形对称', () => {
  it('每一行都以上边界的中心列为轴左右对称', () => {
    const lines = normalizedArtLines(ART.heart).filter((line) => line.includes('#'))
    expect(lines.length).toBeGreaterThan(10)

    const width = Math.max(...lines.map((line) => line.length))

    for (const line of lines) {
      const leading = line.length - line.trimStart().length
      const trailing = line.length - line.trimEnd().length

      // 补齐到 width 之后，左右留白必须相等
      expect(leading).toBe(trailing + (width - line.length))
    }
  })

  it('最宽的一行靠近上缘，并在下方收束成一点', () => {
    // 心形的特征就是「上宽下尖」，最宽处本就靠上，不在正中 ——
    // 若哪一天它跑到了正中，说明形状被改坏了
    const lines = normalizedArtLines(ART.heart).filter((line) => line.includes('#'))
    const width = Math.max(...lines.map((line) => line.length))
    const widestIndex = lines.findIndex((line) => line.length === width)

    expect(widestIndex).toBeGreaterThan(0)
    expect(widestIndex).toBeLessThan(lines.length / 2)

    // 末行必须只有一个字符，即心尖
    const tip = lines[lines.length - 1] ?? ''
    expect(tip.trim()).toBe('#')
  })
})
