/**
 * 程序化字符画生成器
 *
 * 全部是**显式传入参数的纯函数** —— 没有隐藏时钟、没有 `Math.random()`，
 * 因此可以单测、可以在 E2E 里复现。
 */

import { hash2d } from './rng'

/**
 * 星空
 *
 * 三级亮度用不同字符表示，让画面有纵深而不是均匀的噪点。
 */
export function starfield(cols: number, rows: number, seed: number, density = 0.02): string {
  const lines: string[] = []

  for (let y = 0; y < rows; y++) {
    let line = ''

    for (let x = 0; x < cols; x++) {
      const r = hash2d(x, y, seed)

      if (r < density * 0.1) line += '*'
      else if (r < density * 0.4) line += '+'
      else if (r < density) line += '.'
      else line += ' '
    }

    lines.push(line)
  }

  return lines.join('\n')
}

/**
 * 行程进度条，如 `[======>    ]`
 */
export function rail(progress: number, width: number): string {
  const inner = Math.max(1, Math.floor(width))
  const clamped = Math.min(1, Math.max(0, progress))
  const filled = Math.round(clamped * inner)

  const body =
    filled >= inner
      ? '='.repeat(inner)
      : `${'='.repeat(filled)}>${' '.repeat(Math.max(0, inner - filled - 1))}`

  return `[${body}]`
}
