/**
 * 时间线 —— 全站唯一的剧情数据源
 *
 * 内容与表现彻底分离：改文案不需要碰任何组件或动画代码。
 *
 * 关于 2026-10-05 的南京之行：其实现实中尚未到来，
 * 站主明确要求**一律按「已发生」渲染**，不做倒计时或待办态。
 */

import type { ArtKey } from '@/art/milestones'
import type { CalendarDate } from '@/engine/dates'
import type { RevealMode } from '@/engine/reveal'

export interface Milestone {
  /** DOM id，也是导演注册用的前缀 */
  readonly id: string
  /** 终端里显示的编号 */
  readonly code: string
  /** 右侧的英文标签 */
  readonly tag: string
  /** 起始日期 */
  readonly date: CalendarDate
  /** 若是一个区间，在此给出结束日期 */
  readonly untilDate?: CalendarDate
  readonly title: string
  /** 叙述 —— 逐行打字机输出 */
  readonly lines: readonly string[]
  /** 对应的字符画 */
  readonly art: ArtKey
  /** 揭开顺序 */
  readonly reveal: RevealMode
  /** 全部解码完成所需时长（毫秒） */
  readonly durationMs: number
  /** 强调色：告警红用于打赏与车祸 */
  readonly accent?: 'alert' | 'bright'
}

/** 表白日 —— 全站唯一的纪念日锚点 */
export const TOGETHER_ANCHOR: CalendarDate = { year: 2026, month: 3, day: 8 }

/** 尾声 */
export const EPILOGUE = {
  closing: '未来不可知，但我满心期待。',
} as const

export const MILESTONES = [
  {
    id: 'first-contact',
    code: 'MILESTONE_01',
    tag: 'FIRST_CONTACT',
    date: { year: 2024, month: 9 },
    title: '门可罗雀的直播间',
    lines: [
      '我在 bilibili 开着一个没什么人来的直播间，',
      '像往常一样，默默地玩着明日方舟。',
      '她走了进来。',
      '——那是第一个给我打赏的人。',
    ],
    art: 'liveRoom',
    reveal: 'rain',
    durationMs: 3200,
  },
  {
    id: 'commission',
    code: 'MILESTONE_02',
    tag: 'COMMISSION',
    date: { year: 2024, month: 9 },
    untilDate: { year: 2026, month: 2 },
    title: '她把账号交给了我',
    lines: [
      '熟识之后，她把游戏账号放心地交给我代练。',
      '每一次结账，她都给我定价之外的钱。',
      '我说不用这么多，她说：拿着。',
      '——我倍感温暖。',
    ],
    art: 'commission',
    reveal: 'typewriter',
    durationMs: 3000,
    accent: 'bright',
  },
  {
    id: 'closer',
    code: 'MILESTONE_03',
    tag: 'WECHAT',
    date: { year: 2026, month: 2 },
    title: '她主动出击',
    lines: [
      '那天在微信上，她先开了口：',
      '「我们能不能做更进一步的朋友？」',
      '从那一刻起，我们的交流不再限于游戏。',
    ],
    art: 'chat',
    reveal: 'wave',
    durationMs: 2800,
  },
  {
    id: 'confession',
    code: 'MILESTONE_04',
    tag: 'CONFESSION',
    date: { year: 2026, month: 3, day: 8 },
    title: '第一个正式的女朋友',
    lines: [
      '她再次出击。',
      '这一次，是直接的告白。',
      '我接受了。',
      '我的第一个正式的女朋友——不再虚席。',
    ],
    art: 'heart',
    reveal: 'dissolve',
    durationMs: 4000,
    accent: 'bright',
  },
  {
    id: 'meeting',
    code: 'MILESTONE_05',
    tag: 'RAIL',
    date: { year: 2026, month: 3, day: 20 },
    title: '宁波 → 合肥',
    lines: [
      '她向公司请了长假。',
      '一个人，偷偷地，坐上了从宁波开往合肥的高铁。',
      '来找我。',
      '我们同居了。',
    ],
    art: 'train',
    reveal: 'wave',
    durationMs: 3600,
  },
  {
    id: 'incident',
    code: 'MILESTONE_06',
    tag: 'INCIDENT',
    date: { year: 2026, month: 5, day: 12 },
    title: '医院里的那些天',
    lines: ['我遭遇了车祸。', '她守在病房里，照料我全部的日常起居。', '所有的辛苦，我都看在眼里。'],
    art: 'ecg',
    reveal: 'rain',
    durationMs: 3400,
    accent: 'alert',
  },
  {
    id: 'nanjing',
    code: 'MILESTONE_07',
    tag: 'TRAVEL',
    date: { year: 2026, month: 10, day: 5 },
    title: '来之不易的时光',
    lines: ['我们第一次一起出门旅游。', '目的地是南京。', '来之不易的时光，每一秒都珍惜。'],
    art: 'nanjing',
    reveal: 'dissolve',
    durationMs: 3800,
  },
] as const satisfies readonly Milestone[]

export type MilestoneId = (typeof MILESTONES)[number]['id']
