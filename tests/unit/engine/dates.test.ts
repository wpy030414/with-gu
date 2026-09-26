import { describe, expect, it } from 'vitest'

import {
  daysBetween,
  daysTogether,
  formatChineseDate,
  toIsoDate,
  toLocalDate,
} from '@/engine/dates'

describe('toLocalDate', () => {
  it('按本地时区构造，而不是字符串解析', () => {
    const date = toLocalDate({ year: 2024, month: 9 })
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(8) // 0-based
    expect(date.getDate()).toBe(1)
  })

  it('这是本模块存在的理由：UTC 解析会把 2024-09 在负时区变成 8 月', () => {
    // 若实现写成 new Date('2024-09')，在 UTC-5 会得到 2024-08-31 19:00 ——
    // 整个章节错位一个月。本地构造则无论时区都稳定落在 9 月。
    const local = toLocalDate({ year: 2024, month: 9 })
    expect(local.getMonth()).toBe(8)
    expect(local.getDate()).toBe(1)
  })

  it('省略 day 时取当月 1 号', () => {
    expect(toLocalDate({ year: 2026, month: 2 }).getDate()).toBe(1)
  })

  it('带 day 时精确定位', () => {
    const date = toLocalDate({ year: 2026, month: 3, day: 8 })
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(8)
  })
})

describe('toIsoDate', () => {
  it('月与日补零', () => {
    expect(toIsoDate({ year: 2026, month: 3, day: 8 })).toBe('2026-03-08')
    expect(toIsoDate({ year: 2026, month: 10, day: 5 })).toBe('2026-10-05')
  })

  it('无 day 时只到月', () => {
    expect(toIsoDate({ year: 2024, month: 9 })).toBe('2024-09')
  })

  it('年份补到四位', () => {
    expect(toIsoDate({ year: 999, month: 1, day: 1 })).toBe('0999-01-01')
  })
})

describe('formatChineseDate', () => {
  it('有日与无日两种形态', () => {
    expect(formatChineseDate({ year: 2026, month: 3, day: 8 })).toBe('2026 年 3 月 8 日')
    expect(formatChineseDate({ year: 2024, month: 9 })).toBe('2024 年 9 月')
  })
})

describe('daysBetween', () => {
  it('同一日返回 0（忽略时分秒）', () => {
    expect(daysBetween(new Date(2026, 2, 8, 0, 0), new Date(2026, 2, 8, 23, 59))).toBe(0)
  })

  it('相邻日返回 1', () => {
    expect(daysBetween(new Date(2026, 2, 8), new Date(2026, 2, 9))).toBe(1)
  })

  it('跨月与跨年', () => {
    expect(daysBetween(new Date(2026, 2, 20), new Date(2026, 3, 20))).toBe(31)
    expect(daysBetween(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(1)
  })

  it('闰年二月按 29 天算', () => {
    // 2024 是闰年
    expect(daysBetween(new Date(2024, 1, 1), new Date(2024, 2, 1))).toBe(29)
    // 2026 不是
    expect(daysBetween(new Date(2026, 1, 1), new Date(2026, 2, 1))).toBe(28)
  })

  it('逆序返回负数', () => {
    expect(daysBetween(new Date(2026, 2, 9), new Date(2026, 2, 8))).toBe(-1)
  })

  it('夏令时切换不会造成 ±1 天的误差', () => {
    // 用本地日历日折算到 UTC 再相减，因此不受 23/25 小时的那一天影响
    const march = daysBetween(new Date(2026, 2, 1), new Date(2026, 2, 31))
    expect(march).toBe(30)
  })
})

describe('daysTogether', () => {
  const anchor = { year: 2026, month: 3, day: 8 } as const

  it('起始当天记作第 1 天', () => {
    expect(daysTogether(anchor, new Date(2026, 2, 8))).toBe(1)
  })

  it('次日为第 2 天', () => {
    expect(daysTogether(anchor, new Date(2026, 2, 9))).toBe(2)
  })

  it('跨月推进正确', () => {
    expect(daysTogether(anchor, new Date(2026, 3, 7))).toBe(31)
  })

  it('一天中的任何时刻都算作同一天', () => {
    expect(daysTogether(anchor, new Date(2026, 2, 8, 23, 59, 59))).toBe(1)
  })
})
