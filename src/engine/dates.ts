/**
 * 日期计算 —— 时间线站的核心数据层
 *
 * ⚠️ **绝不使用 `new Date('2024-09')` 这类字符串解析。**
 * 它按 UTC 解释：东八区看着没问题，但在 UTC-5 会显示成 8 月 31 日 ——
 * 整个章节错位一个月。一律走结构化的 `CalendarDate` + 显式本地时间构造。
 */

export interface CalendarDate {
  readonly year: number
  /** 1–12 */
  readonly month: number
  /** 省略表示该月内不确定具体哪一天 */
  readonly day?: number
}

/** 按**本地时区**构造 —— 刻意不走字符串解析 */
export function toLocalDate(date: CalendarDate): Date {
  return new Date(date.year, date.month - 1, date.day ?? 1)
}

/** ISO 8601 片段，供 `<time datetime>` 使用 */
export function toIsoDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, '0')
  const month = String(date.month).padStart(2, '0')

  if (date.day === undefined) return `${year}-${month}`

  return `${year}-${month}-${String(date.day).padStart(2, '0')}`
}

/** 中文显示，如「2026 年 3 月 8 日」或「2024 年 9 月」 */
export function formatChineseDate(date: CalendarDate): string {
  const base = `${date.year} 年 ${date.month} 月`
  return date.day === undefined ? base : `${base} ${date.day} 日`
}

/**
 * 两个日期相差的整天数。
 *
 * 先把本地日历日折算到 UTC 再相减 —— 这样夏令时切换那天的
 * 23/25 小时不会让结果少算或多算一天。
 */
export function daysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((end - start) / 86_400_000)
}

/**
 * 「在一起第 N 天」—— 起始当天记作第 1 天。
 */
export function daysTogether(anchor: CalendarDate, now: Date): number {
  return daysBetween(toLocalDate(anchor), now) + 1
}
