import { describe, expect, it } from 'vitest'

import { DEFAULT_POOL } from '@/engine/charset'
import { buildGrid } from '@/engine/grid'
import { renderBrightLayer, renderFrame, renderNoiseLayer } from '@/engine/render'

const SEED = 20260308
const POOL = DEFAULT_POOL

const grid = buildGrid('AB\nCD')

/** 把带换行的输出摊平成逐格数组 */
function cells(text: string): string[] {
  return [...text].filter((ch) => ch !== '\n')
}

describe('renderBrightLayer', () => {
  it('全部解码时原样输出字符画', () => {
    const mask = Uint8Array.from([1, 1, 1, 1])
    expect(renderBrightLayer(grid, mask)).toBe('AB\nCD')
  })

  it('未解码格填空格，已解码格填目标字符', () => {
    const mask = Uint8Array.from([1, 0, 0, 0])
    expect(renderBrightLayer(grid, mask)).toBe('A \n  ')
  })

  it('保持行结构不变 —— 行数与列数恒定，揭示过程绝不改变布局', () => {
    for (const mask of [
      Uint8Array.from([0, 0, 0, 0]),
      Uint8Array.from([1, 0, 1, 0]),
      Uint8Array.from([1, 1, 1, 1]),
    ]) {
      const out = renderBrightLayer(grid, mask)
      const lines = out.split('\n')
      expect(lines).toHaveLength(grid.rows)
      for (const line of lines) {
        expect(line).toHaveLength(grid.cols)
      }
    }
  })

  it('未解码格的输出里没有任何乱码 —— 乱码只属于暗层', () => {
    const mask = Uint8Array.from([1, 0, 1, 0])
    const out = renderBrightLayer(grid, mask)
    const blanks = cells(out).filter((ch) => ch === ' ')
    expect(blanks).toHaveLength(2)
  })
})

describe('renderNoiseLayer', () => {
  it('只在未解码格作画，已解码格留空', () => {
    const mask = Uint8Array.from([1, 1, 0, 0])
    const out = cells(renderNoiseLayer(grid, mask, POOL, 0, SEED))

    expect(out[0]).toBe(' ')
    expect(out[1]).toBe(' ')
    expect(out[2]).not.toBe(' ')
    expect(out[3]).not.toBe(' ')
  })

  it('产出全部来自字符池', () => {
    const mask = new Uint8Array(4) // 全未解码
    const out = cells(renderNoiseLayer(grid, mask, POOL, 5, SEED))
    for (const ch of out) {
      expect(POOL).toContain(ch)
    }
  })

  it('为空池降级为空格而非塌陷', () => {
    const mask = new Uint8Array(4)
    expect(cells(renderNoiseLayer(grid, mask, '', 0, SEED))).toEqual([' ', ' ', ' ', ' '])
  })

  it('保持行结构不变', () => {
    const mask = new Uint8Array(4)
    const lines = renderNoiseLayer(grid, mask, POOL, 3, SEED).split('\n')
    expect(lines).toHaveLength(grid.rows)
    for (const line of lines) {
      expect(line).toHaveLength(grid.cols)
    }
  })

  it('同一帧种子下可复现', () => {
    const mask = new Uint8Array(4)
    expect(renderNoiseLayer(grid, mask, POOL, 7, SEED)).toBe(
      renderNoiseLayer(grid, mask, POOL, 7, SEED),
    )
  })

  it('帧种子变化时乱码跟着变 —— 静止的乱码看起来像卡住了', () => {
    const mask = new Uint8Array(64)
    const bigGrid = buildGrid('A'.repeat(64))

    expect(renderNoiseLayer(bigGrid, mask, POOL, 0, SEED)).not.toBe(
      renderNoiseLayer(bigGrid, mask, POOL, 1, SEED),
    )
  })
})

describe('两层的不变量', () => {
  const masks = [
    new Uint8Array(4),
    Uint8Array.from([1, 0, 0, 1]),
    Uint8Array.from([0, 1, 1, 0]),
    Uint8Array.from([1, 1, 1, 1]),
  ]

  it('绝不在同一格同时作画 —— 否则乱码会从字形缝隙透出来', () => {
    for (const mask of masks) {
      for (let frameSeed = 0; frameSeed < 5; frameSeed++) {
        const bright = cells(renderBrightLayer(grid, mask))
        const noise = cells(renderNoiseLayer(grid, mask, POOL, frameSeed, SEED))

        for (let i = 0; i < bright.length; i++) {
          const bothDrawn = bright[i] !== ' ' && noise[i] !== ' '
          expect(bothDrawn).toBe(false)
        }
      }
    }
  })

  it('两层的行结构完全一致 —— 换行符原样透传，无需额外对齐', () => {
    for (const mask of masks) {
      const brightLines = renderBrightLayer(grid, mask).split('\n')
      const noiseLines = renderNoiseLayer(grid, mask, POOL, 0, SEED).split('\n')
      expect(brightLines).toHaveLength(noiseLines.length)
      brightLines.forEach((line, i) => {
        expect(line).toHaveLength((noiseLines[i] ?? '').length)
      })
    }
  })
})

describe('renderFrame', () => {
  it('一次产出互补的两层', () => {
    const mask = Uint8Array.from([1, 0, 0, 0])
    const frame = renderFrame(grid, mask, POOL, 2, SEED)

    expect(frame.bright).toBe('A \n  ')
    expect(frame.bright).toBe(renderBrightLayer(grid, mask))
    expect(frame.noise).toBe(renderNoiseLayer(grid, mask, POOL, 2, SEED))
  })

  it('完全解码后暗层只剩空白 —— 噪声面积归零，与设计描述一致', () => {
    const mask = Uint8Array.from([1, 1, 1, 1])
    const frame = renderFrame(grid, mask, POOL, 0, SEED)
    expect(frame.noise).toBe('  \n  ')
    expect(frame.bright).toBe('AB\nCD')
  })
})
