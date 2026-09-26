import { describe, expect, it } from 'vitest'

import {
  buildGrid,
  columnToIndex,
  displayWidth,
  hasFullWidthChar,
  isFullWidth,
} from '@/engine/grid'

describe('东亚宽度判定', () => {
  it('半角字符占 1 列', () => {
    expect(displayWidth('a')).toBe(1)
    expect(displayWidth('ab')).toBe(2)
    expect(displayWidth('~!@#')).toBe(4)
    expect(displayWidth('░▒▓█')).toBe(4)
  })

  it('全角字符占 2 列', () => {
    expect(displayWidth('中')).toBe(2)
    expect(displayWidth('中文')).toBe(4)
    expect(displayWidth('a中')).toBe(3)
    expect(displayWidth('咕鹿小屋')).toBe(8)
  })

  it('emoji 也按 2 列计（正因如此禁止进栅格）', () => {
    expect(isFullWidth('🐑'.codePointAt(0) ?? 0)).toBe(true)
  })

  it('hasFullWidthChar 能识别混排', () => {
    expect(hasFullWidthChar('pure ascii')).toBe(false)
    expect(hasFullWidthChar('mixed 中文')).toBe(true)
    expect(hasFullWidthChar('')).toBe(false)
  })
})

describe('buildGrid', () => {
  it('剥离模板字符串带来的公共缩进，但保留相对层次', () => {
    const art = `
      +-----+
      |  X  |
      |     |
        |_|
    `
    const grid = buildGrid(art)
    expect(grid.lines).toEqual(['+-----+', '|  X  |', '|     |', '  |_|  '])
    expect(grid.rows).toBe(4)
    expect(grid.cols).toBe(7)
  })

  it('逐行补齐到等宽', () => {
    const grid = buildGrid('ab\nabcd\nabc')
    expect(grid.cols).toBe(4)
    expect(grid.lines).toEqual(['ab  ', 'abcd', 'abc '])
  })

  it('补齐全角行时按显示宽度而非字符数', () => {
    const grid = buildGrid('中\naaaa')
    expect(grid.cols).toBe(4)

    const first = grid.lines[0] ?? ''
    expect(displayWidth(first)).toBe(4)
    expect(first).toBe('中  ')
  })

  it('去掉首尾整行为空的行；画内空行保留但同样补齐到等宽', () => {
    const grid = buildGrid('\n\na\n\nb\n\n')
    // 补齐对空行同样生效 —— 每行长度必须恒等于 cols，这是栅格的前提
    expect(grid.lines).toEqual(['a', ' ', 'b'])
    expect(grid.rows).toBe(3)
    expect(grid.cols).toBe(1)
  })

  it('统一换行符：CRLF 与 CR 都归一成 LF', () => {
    expect(buildGrid('a\r\nb').lines).toEqual(['a', 'b'])
    expect(buildGrid('a\rb').lines).toEqual(['a', 'b'])
  })

  it('制表符展开为两个空格（制表符宽度依上下文而变，不能进栅格）', () => {
    const grid = buildGrid('a\tb')
    expect(grid.lines).toEqual(['a  b'])
    expect(grid.cols).toBe(4)
  })

  it('空输入不产生崩溃，返回 1×0 的空栅格', () => {
    const grid = buildGrid('')
    expect(grid.rows).toBe(1)
    expect(grid.cols).toBe(0)
    expect(grid.text).toBe('')
  })

  it('text 是各行以 \\n 拼接，可直接喂给 <pre>', () => {
    const grid = buildGrid('ab\ncd')
    expect(grid.text).toBe('ab\ncd')
    expect(grid.text.split('\n')).toHaveLength(grid.rows)
  })

  it('每行的字符数恒等于 cols —— 这是逐格索引成立的前提', () => {
    const grid = buildGrid('a\nbbb\ncc')
    for (const line of grid.lines) {
      expect(line).toHaveLength(grid.cols)
      expect(displayWidth(line)).toBe(grid.cols)
    }
  })
})

describe('columnToIndex', () => {
  it('把显示列号换算成行内字符下标', () => {
    const line = 'ab中d'

    expect(columnToIndex(line, 0)).toBe(0)
    expect(columnToIndex(line, 2)).toBe(2) // 「中」的起点
    expect(columnToIndex(line, 3)).toBe(3) // 「中」之后是 d
    expect(columnToIndex(line, 4)).toBe(3) // 第 4 列正好是 d 的起点
  })

  it('超出行宽时返回行尾', () => {
    expect(columnToIndex('ab中d', 99)).toBe(4)
    expect(columnToIndex('', 3)).toBe(0)
  })
})
