/**
 * 解码调度 —— 整个随机字符动画的心脏
 *
 * 核心洞见：**「哪些格子已解码」是数据，不是几何。**
 * 四种揭开顺序（wave / rain / dissolve / typewriter）退化成同一个纯函数，
 * 于是渲染层完全不需要知道顺序是什么。
 */

import { hash2d } from './rng'

/** 揭开顺序 */
export type RevealMode =
  /** 从左到右，如打字机逐列推进 */
  | 'wave'
  /** 从上到下，如瀑布灌注 */
  | 'rain'
  /** 随机顺序，如显影 */
  | 'dissolve'
  /** 阅读顺序逐字输出 */
  | 'typewriter'

export const REVEAL_MODES: readonly RevealMode[] = ['wave', 'rain', 'dissolve', 'typewriter']

/**
 * 某个格子的归一化解码进度 `[0, 1]`。
 *
 * `index` 是**阅读顺序**下标（`row * cols + col`）。
 * 乘上总时长即得该格何时开始解码。
 *
 * 这个函数是纯的、无分配的、对同一输入永远返回同一结果 ——
 * 单调性（时间只增 ⇒ 已解码集合只增）由它保证。
 */
export function decodeProgressAt(
  index: number,
  cols: number,
  rows: number,
  mode: RevealMode,
  seed: number,
): number {
  if (cols <= 0 || rows <= 0) return 0

  const total = cols * rows
  const col = index % cols
  const row = Math.floor(index / cols)

  switch (mode) {
    case 'wave':
      return cols === 1 ? 0 : col / (cols - 1)

    case 'rain':
      return rows === 1 ? 0 : row / (rows - 1)

    case 'typewriter':
      return total === 1 ? 0 : index / (total - 1)

    case 'dissolve':
      return hash2d(col, row, seed)
  }
}

export interface DecodeOptions {
  readonly cols: number
  readonly rows: number
  readonly mode: RevealMode
  readonly seed: number
  /** 全部解码完成所需时长 */
  readonly durationMs: number
}

/**
 * 已推进 `elapsed` 毫秒时，每个格子的解码状态。
 *
 * 返回 `Uint8Array`，1 = 已解码，0 = 仍是乱码。
 * 因为每个格子的解码时刻不依赖 `elapsed`，所以**单调性天然成立** ——
 * 时间只增，掩码只增不减。
 */
export function decodedMask(elapsed: number, options: DecodeOptions): Uint8Array {
  const { cols, rows, mode, seed, durationMs } = options
  const total = Math.max(0, cols * rows)
  const mask = new Uint8Array(total)

  if (total === 0) return mask

  // 时长非正 ⇒ 视为「立即完成」，避免除零与空转
  if (durationMs <= 0) {
    mask.fill(1)
    return mask
  }

  for (let i = 0; i < total; i++) {
    const at = decodeProgressAt(i, cols, rows, mode, seed) * durationMs
    if (elapsed >= at) mask[i] = 1
  }

  return mask
}

/** 已解码格数 —— 供导演判断「是否已完成」 */
export function countDecoded(mask: Uint8Array): number {
  let count = 0
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === 1) count++
  }
  return count
}

/** 是否全部解码完成 */
export function isFullyDecoded(mask: Uint8Array): boolean {
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== 1) return false
  }
  return true
}
