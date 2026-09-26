import { useEffect, useState } from 'react'

import { daysTogether, type CalendarDate } from '@/engine/dates'

/**
 * 在一起的天数，实时推进。
 *
 * 这里的 effect 只做一件事：**订阅时钟**这个外部系统。
 * state 存的是「当下这一刻」，天数由它派生 ——
 * 而不是在 effect 里反向去同步一个天数 state（那会引发级联渲染）。
 *
 * 每 60 秒醒一次就够：这个数字的粒度是天，秒级刷新毫无意义，
 * 但完全静止又会让页面像一张截图。
 */
export function useElapsedDays(anchor: CalendarDate, intervalMs = 60_000): number {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])

  return daysTogether(anchor, now)
}
