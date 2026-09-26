/**
 * 分层渲染
 *
 * 「两级亮度」被降维成「两个绘制层」：
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ <pre>   上层：已解码格填**目标字符**，其余空格   │  ← 单调递增，10–20Hz，有辉光
 *   │ canvas  下层：只在**未解码**格画乱码，其余空着   │  ← 每帧变，面积递减，无辉光
 *   └──────────────────────────────────────────────┘
 *
 * 两点必须守住：
 *
 * 1. **互补划分**。两层非空格集恰好互补，而不是两层都画满靠 z-order 叠。
 *    字符之间有空隙，画满的话乱码会从字形缝隙里透出来 ——
 *    dissolve 看起来是「脏」而不是「亮」，这个错误很微妙且极难 debug。
 *
 * 2. **内容留在真实文本里**。亮的成品字符走 `<pre>`，可选中、可被屏幕
 *    阅读器和搜索引擎读到；只有乱码才进 canvas。
 */

import { pickChar } from './charset'
import type { AsciiGrid } from './grid'
import { hash2d } from './rng'

/**
 * 逐格映射。
 *
 * 栅格的「格」与文本的「字符」是 1:1 的（仅对纯半角成立，见 grid.ts 的说明）。
 * 换行符不占格、原样透传 —— 两层输出的行结构因此必然一致，无需对齐处理。
 */
function mapCells(
  grid: AsciiGrid,
  mask: Uint8Array,
  decide: (char: string, cell: number, decoded: boolean) => string,
): string {
  const { text } = grid
  const out: string[] = []
  let cell = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i)

    if (ch === '\n') {
      out.push('\n')
      continue
    }

    out.push(decide(ch, cell, mask[cell] === 1))
    cell++
  }

  return out.join('')
}

/** 亮层：已解码格填目标字符，其余填空格 */
export function renderBrightLayer(grid: AsciiGrid, mask: Uint8Array): string {
  return mapCells(grid, mask, (char, _cell, decoded) => (decoded ? char : ' '))
}

/**
 * 暗层：只在未解码格画乱码，已解码格留空。
 *
 * `frameSeed` 每 2–3 帧变一次，让乱码「骚动」起来 ——
 * 完全静止的乱码看起来像卡住了，而不是像在解码。
 */
export function renderNoiseLayer(
  grid: AsciiGrid,
  mask: Uint8Array,
  pool: string,
  frameSeed: number,
  seed: number,
): string {
  return mapCells(grid, mask, (_char, cell, decoded) =>
    decoded ? ' ' : pickChar(pool, hash2d(cell, frameSeed, seed)),
  )
}

export interface Frame {
  readonly bright: string
  readonly noise: string
}

/** 一次算出该帧的两层 —— 测试与调试用的便利函数 */
export function renderFrame(
  grid: AsciiGrid,
  mask: Uint8Array,
  pool: string,
  frameSeed: number,
  seed: number,
): Frame {
  return {
    bright: renderBrightLayer(grid, mask),
    noise: renderNoiseLayer(grid, mask, pool, frameSeed, seed),
  }
}
