/**
 * 随机字符集
 *
 * ⚠️ 全部字符必须是**半角等宽**的。CJK、全角标点、emoji 一律禁止 ——
 * 它们占 2 列，会让整个栅格错位。
 *
 * 方块元素与制表符理论上属于「东亚宽度 = 1」的区段，但**并非所有字体都
 * 覆盖它们**。字体缺失时会回落到系统字体，列宽随之改变。
 * 因此 `resolvePool` 提供运行时的降级保护（见下）。
 */

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const PUNCT = '!@#$%^&*()_+-=[]{}|;:,.<>/?~'

/** 方块元素：视觉密度最高，噪点层的主力 */
const BLOCKS = '░▒▓█▚▞▙▟'

/** 制表符与框线：终端味道最足 */
const BOX = '─│┌┐└┘├┤┬┴┼╭╮╰╯'

/** 纯 ASCII 池 —— 任何等宽字体都保证覆盖，作为最终兜底 */
export const ASCII_POOL = UPPER + LOWER + DIGITS + PUNCT

/** 默认池：ASCII + 方块 + 制表符 */
export const DEFAULT_POOL = UPPER + LOWER + DIGITS + PUNCT + BLOCKS + BOX

/** 生成器画线用的方向字符（保证存在，单独导出便于取用） */
export const LINE_CHARS = {
  dash: '-',
  underscore: '_',
  rail: '=',
  head: '>',
  dot: '.',
  bar: '|',
  tick: '^',
  block: '█',
  light: '░',
} as const

/**
 * 从池中按归一化随机数 `r ∈ [0,1)` 取一个字符。
 *
 * 用 `charAt` 而非下标访问 —— 后者在 `noUncheckedIndexedAccess` 下
 * 是 `string | undefined`，而 `charAt` 越界返回空串，语义更明确。
 */
export function pickChar(pool: string, r: number): string {
  const n = pool.length
  if (n === 0) return ' '
  const i = Math.min(n - 1, Math.max(0, Math.floor(r * n)))
  return pool.charAt(i)
}

/**
 * 根据实测宽度决定用哪个池。
 *
 * 在字体就绪后量一次：若「扩展字符」的 advance 与纯 ASCII 不等宽，
 * 说明字体缺字或回落了 —— 此时**宁可朴素，不可错位**，降级为 ASCII_POOL。
 *
 * @param asciiWidth    一个纯 ASCII 样本的实测宽度
 * @param extendedWidth 同样长度的「扩展字符」样本实测宽度
 */
export function resolvePool(asciiWidth: number, extendedWidth: number): string {
  if (asciiWidth <= 0 || extendedWidth <= 0) return ASCII_POOL

  // 亚像素舍入允许 1% 误差
  const ratio = extendedWidth / asciiWidth
  return Math.abs(ratio - 1) < 0.01 ? DEFAULT_POOL : ASCII_POOL
}
