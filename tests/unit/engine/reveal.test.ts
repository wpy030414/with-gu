import { describe, expect, it } from 'vitest'

import {
  REVEAL_MODES,
  countDecoded,
  decodeProgressAt,
  decodedMask,
  isFullyDecoded,
  type DecodeOptions,
  type RevealMode,
} from '@/engine/reveal'
import { hash2d } from '@/engine/rng'

const COLS = 20
const ROWS = 10
const TOTAL = COLS * ROWS
const DURATION = 1000
const SEED = 20260308

function options(overrides: Partial<DecodeOptions> = {}): DecodeOptions {
  return {
    cols: COLS,
    rows: ROWS,
    mode: 'dissolve',
    seed: SEED,
    durationMs: DURATION,
    ...overrides,
  }
}

describe('decodeProgressAt', () => {
  it('恒落在 [0, 1]', () => {
    for (const mode of REVEAL_MODES) {
      for (let i = 0; i < TOTAL; i++) {
        const p = decodeProgressAt(i, COLS, ROWS, mode, SEED)
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    }
  })

  it('wave：第 0 列最早，最后一列最晚', () => {
    const firstCol = decodeProgressAt(0, COLS, ROWS, 'wave', SEED)
    const lastCol = decodeProgressAt(COLS - 1, COLS, ROWS, 'wave', SEED)
    expect(firstCol).toBe(0)
    expect(lastCol).toBe(1)
  })

  it('rain：第 0 行最早，最后一行最晚', () => {
    expect(decodeProgressAt(0, COLS, ROWS, 'rain', SEED)).toBe(0)
    expect(decodeProgressAt((ROWS - 1) * COLS, COLS, ROWS, 'rain', SEED)).toBe(1)
  })

  it('typewriter：严格按阅读顺序递增', () => {
    let previous = -1
    for (let i = 0; i < TOTAL; i++) {
      const p = decodeProgressAt(i, COLS, ROWS, 'typewriter', SEED)
      expect(p).toBeGreaterThan(previous)
      previous = p
    }
  })

  it('dissolve：与 hash2d 一致，且不随顺序单调', () => {
    for (const i of [0, 7, 33, 199]) {
      expect(decodeProgressAt(i, COLS, ROWS, 'dissolve', SEED)).toBe(
        hash2d(i % COLS, Math.floor(i / COLS), SEED),
      )
    }

    // 若误写成顺序展开，整条序列就会单调 —— 这里专门守住它不是
    const samples = Array.from({ length: 12 }, (_, i) =>
      decodeProgressAt(i, COLS, ROWS, 'dissolve', SEED),
    )
    const sorted = samples.toSorted((a, b) => a - b)
    expect(samples).not.toEqual(sorted)
  })

  it('退化尺寸（单列/单行/单格）不产生 NaN 或除零', () => {
    for (const mode of REVEAL_MODES) {
      expect(Number.isNaN(decodeProgressAt(0, 1, 10, mode, SEED))).toBe(false)
      expect(Number.isNaN(decodeProgressAt(0, 10, 1, mode, SEED))).toBe(false)
      expect(Number.isNaN(decodeProgressAt(0, 1, 1, mode, SEED))).toBe(false)
    }
    expect(decodeProgressAt(0, 0, 0, 'wave', SEED)).toBe(0)
  })
})

describe('decodedMask', () => {
  it('elapsed = 0 时只有第一个单位已解码（解码从 t=0 即刻开始）', () => {
    const mask = decodedMask(0, options({ mode: 'wave' }))
    // 第 0 列（所有行）在 t=0 全部就位
    expect(countDecoded(mask)).toBe(ROWS)

    const typewriter = decodedMask(0, options({ mode: 'typewriter' }))
    expect(countDecoded(typewriter)).toBe(1)
  })

  it('elapsed ≥ durationMs 时全部解码完成', () => {
    for (const mode of REVEAL_MODES) {
      expect(isFullyDecoded(decodedMask(DURATION, options({ mode })))).toBe(true)
      // 超出时长应当幂等，而不是溢出
      expect(isFullyDecoded(decodedMask(DURATION * 10, options({ mode })))).toBe(true)
    }
  })

  it('单调性：时间只增 ⇒ 已解码集合只增不减', () => {
    for (const mode of REVEAL_MODES) {
      let previous = -1
      for (let t = 0; t <= DURATION + 200; t += 25) {
        const count = countDecoded(decodedMask(t, options({ mode })))
        expect(count).toBeGreaterThanOrEqual(previous)
        previous = count
      }
      expect(previous).toBe(TOTAL)
    }
  })

  it('掩码长度恒等于 rows × cols', () => {
    expect(decodedMask(500, options()).length).toBe(TOTAL)
    expect(decodedMask(500, options({ cols: 3, rows: 4 })).length).toBe(12)
    expect(decodedMask(500, options({ cols: 0, rows: 0 })).length).toBe(0)
  })

  it('durationMs ≤ 0 视为立即完成（避免除零与空转）', () => {
    expect(isFullyDecoded(decodedMask(0, options({ durationMs: 0 })))).toBe(true)
    expect(isFullyDecoded(decodedMask(0, options({ durationMs: -5 })))).toBe(true)
  })

  it('同一输入永远得到同一掩码（可复现）', () => {
    const a = decodedMask(321, options({ mode: 'dissolve' }))
    const b = decodedMask(321, options({ mode: 'dissolve' }))
    expect(Array.from(a)).toEqual(Array.from(b))
  })

  it('不同种子产出不同的 dissolve 顺序', () => {
    const a = decodedMask(500, options({ mode: 'dissolve', seed: 1 }))
    const b = decodedMask(500, options({ mode: 'dissolve', seed: 2 }))
    expect(Array.from(a)).not.toEqual(Array.from(b))
  })
})

describe('countDecoded / isFullyDecoded', () => {
  it('空掩码视为已完成（无处可解码）', () => {
    expect(countDecoded(new Uint8Array(0))).toBe(0)
    expect(isFullyDecoded(new Uint8Array(0))).toBe(true)
  })

  it('正确计数', () => {
    expect(countDecoded(Uint8Array.from([1, 1, 0, 1]))).toBe(3)
    expect(isFullyDecoded(Uint8Array.from([1, 1, 0, 1]))).toBe(false)
    expect(isFullyDecoded(Uint8Array.from([1, 1, 1]))).toBe(true)
  })
})

describe('四种模式的解码节奏差异', () => {
  it('同一时刻，各模式已解码的格数各不相同（否则模式就没意义了）', () => {
    const counts = REVEAL_MODES.map((mode: RevealMode) =>
      countDecoded(decodedMask(DURATION / 2, options({ mode }))),
    )
    const distinct = new Set(counts)
    expect(distinct.size).toBeGreaterThan(1)
  })
})
