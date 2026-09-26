import { describe, expect, it } from 'vitest'

import {
  ASCII_POOL,
  DEFAULT_POOL,
  LINE_CHARS,
  pickChar,
  resolvePool,
} from '@/engine/charset'
import { displayWidth, hasFullWidthChar } from '@/engine/grid'

describe('字符池', () => {
  it('纯 ASCII 池里全部是半角字符', () => {
    expect(hasFullWidthChar(ASCII_POOL)).toBe(false)
    expect(displayWidth(ASCII_POOL)).toBe(ASCII_POOL.length)
  })

  it('默认池里全部是半角字符（方块与制表符都是 1 列）', () => {
    expect(hasFullWidthChar(DEFAULT_POOL)).toBe(false)
  })

  it('默认池是 ASCII 池的超集', () => {
    for (const ch of ASCII_POOL) {
      expect(DEFAULT_POOL).toContain(ch)
    }
    expect(DEFAULT_POOL.length).toBeGreaterThan(ASCII_POOL.length)
  })

  it('画线字符全部存在且为半角', () => {
    for (const ch of Object.values(LINE_CHARS)) {
      expect(ch).toHaveLength(1)
      expect(hasFullWidthChar(ch)).toBe(false)
    }
  })
})

describe('pickChar', () => {
  it('r=0 取首字符，r→1 取末字符', () => {
    expect(pickChar('abc', 0)).toBe('a')
    expect(pickChar('abc', 0.999999)).toBe('c')
  })

  it('越界与空池都返回空格而非 undefined', () => {
    expect(pickChar('abc', 1)).toBe('c')
    expect(pickChar('abc', 5)).toBe('c')
    expect(pickChar('abc', -3)).toBe('a')
    expect(pickChar('', 0.5)).toBe(' ')
  })

  it('永远不会返回空串（否则栅格会塌陷）', () => {
    for (let i = 0; i < 200; i++) {
      expect(pickChar(DEFAULT_POOL, i / 200)).toHaveLength(1)
    }
  })

  it('能取遍池中每一个字符', () => {
    // 池内无重复字符 —— 否则下面的覆盖率断言会失真
    expect(new Set(DEFAULT_POOL).size).toBe(DEFAULT_POOL.length)

    // 取样点取每格中点而非边界：i/n 在浮点下可能落到 i-1，属舍入而非缺陷
    const seen = new Set<string>()
    for (let i = 0; i < DEFAULT_POOL.length; i++) {
      seen.add(pickChar(DEFAULT_POOL, (i + 0.5) / DEFAULT_POOL.length))
    }
    expect(seen.size).toBe(DEFAULT_POOL.length)
  })
})

describe('resolvePool 降级保护', () => {
  it('扩展字符等宽时采用默认池', () => {
    expect(resolvePool(640, 640)).toBe(DEFAULT_POOL)
  })

  it('亚像素舍入（1% 内）仍视为等宽', () => {
    expect(resolvePool(640, 643)).toBe(DEFAULT_POOL)
  })

  it('字体缺字导致宽度不符时降级为纯 ASCII —— 宁可朴素，不可错位', () => {
    expect(resolvePool(640, 1280)).toBe(ASCII_POOL)
    expect(resolvePool(640, 320)).toBe(ASCII_POOL)
  })

  it('测量失败（0 或负）时保守降级', () => {
    expect(resolvePool(0, 640)).toBe(ASCII_POOL)
    expect(resolvePool(640, 0)).toBe(ASCII_POOL)
    expect(resolvePool(-1, -1)).toBe(ASCII_POOL)
  })
})
