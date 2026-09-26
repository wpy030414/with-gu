/**
 * 御神签 —— 旧站 `Shrine.vue` 的终端化重塑
 *
 * 原实现是 5 根签筒 + 扇形物理旋转 + localStorage 8 小时冷却。
 * 这里保留「大小中末 + 吉凶」的骨架与冷却机制，
 * 但呈现改为终端风格的字符签筒与解码动画。
 */

export type FortuneRank = '大吉' | '中吉' | '小吉' | '末吉' | '凶'

export interface Fortune {
  readonly rank: FortuneRank
  /** 签文 */
  readonly poem: readonly string[]
  /** 解语 */
  readonly note: string
  /** 抽中的概率权重 */
  readonly weight: number
}

export const FORTUNES: readonly Fortune[] = [
  {
    rank: '大吉',
    poem: ['风雪夜归人', '灯下有人等', '一屋两人', '三餐四季'],
    note: '诸事顺遂。想见的人，此刻正在想你。',
    weight: 12,
  },
  {
    rank: '中吉',
    poem: ['路远不可测', '同行即坦途', '莫问前程', '且看今朝'],
    note: '平稳向前。不必急于给未来一个答案。',
    weight: 26,
  },
  {
    rank: '小吉',
    poem: ['细雨湿衣看不见', '闲花落地听无声', '小事留心', '自有回响'],
    note: '细处有喜。留意那些不起眼的瞬间。',
    weight: 30,
  },
  {
    rank: '末吉',
    poem: ['山重水复', '柳暗花明', '缓行一步', '天自会亮'],
    note: '略需耐心。慢一点，并不会错过什么。',
    weight: 22,
  },
  {
    rank: '凶',
    poem: ['夜路难行', '灯要自己点', '若有人在侧', '不必怕'],
    note: '诸事宜谨。但身边有人，凶亦无妨。',
    weight: 10,
  },
] as const

const TOTAL_WEIGHT = FORTUNES.reduce((sum, fortune) => sum + fortune.weight, 0)

/**
 * 按权重抽一支签。
 *
 * `r` 是 `[0, 1)` 的归一化随机数 —— 由调用方从种子化 PRNG 取得，
 * 这样抽签结果可复现，测试也不依赖 `Math.random()`。
 */
export function drawFortune(r: number): Fortune {
  let threshold = Math.min(0.999999, Math.max(0, r)) * TOTAL_WEIGHT

  for (const fortune of FORTUNES) {
    threshold -= fortune.weight
    if (threshold < 0) return fortune
  }

  return FORTUNES[FORTUNES.length - 1] ?? FORTUNES[0]!
}

/** 凶签要不要改用告警色 —— 旧站大凶时会把卡片翻成主题红 */
export function isOminous(fortune: Fortune): boolean {
  return fortune.rank === '凶'
}

/** 冷却时长：8 小时，与旧站一致 */
export const FORTUNE_COOLDOWN_MS = 8 * 60 * 60 * 1000
