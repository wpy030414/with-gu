import { describe, expect, it } from 'vitest'

import { hash1d, hash2d, mulberry32, seedFromString } from '@/engine/rng'

describe('hash2d', () => {
  it('在同一坐标与种子下永远返回同一结果（可复现）', () => {
    expect(hash2d(3, 7, 42)).toBe(hash2d(3, 7, 42))
    expect(hash2d(3, 7, 42)).not.toBe(hash2d(7, 3, 42))
  })

  it('恒落在 [0, 1)', () => {
    for (let x = 0; x < 40; x++) {
      for (let y = 0; y < 40; y++) {
        const v = hash2d(x, y, 1234)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
    }
  })

  it('分布足够均匀（卡方检验，df=9，p=0.001 临界值 27.88）', () => {
    const buckets = Array.from({ length: 10 }, () => 0)
    const samples = 2000

    for (let i = 0; i < samples; i++) {
      const v = hash2d(i % 50, Math.floor(i / 50), 0xc0ffee)
      const bucket = Math.min(9, Math.floor(v * 10))
      buckets[bucket] = (buckets[bucket] ?? 0) + 1
    }

    const expected = samples / 10
    const chiSquare = buckets.reduce(
      (sum, observed) => sum + (observed - expected) ** 2 / expected,
      0,
    )

    expect(chiSquare).toBeLessThan(27.88)
  })

  it('坐标轴互换会得到不同结果（不会退化成对称）', () => {
    // 若 hash 对 x/y 处理相同，dissolve 会在对角线附近出现可见规律
    const collisions = Array.from({ length: 100 }, (_, i) => i)
      // i=0 时两边同为 hash2d(0,0,seed)，是自反而非规律，排除
      .filter((i) => i > 0)
      .filter((i) => hash2d(i, 0, 9) === hash2d(0, i, 9))
    expect(collisions).toHaveLength(0)
  })
})

describe('hash1d', () => {
  it('与 hash2d 的 y=0 形式不等价（避免与二维用法撞车）', () => {
    const a = hash1d(5, 77)
    const b = hash2d(5, 0, 77)
    expect(a).not.toBe(b)
  })
})

describe('mulberry32', () => {
  it('同一种子产出同一序列', () => {
    const a = mulberry32(20260926)
    const b = mulberry32(20260926)
    const seqA = Array.from({ length: 8 }, () => a())
    const seqB = Array.from({ length: 8 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('不同种子产出不同序列', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
  })

  it('恒落在 [0, 1)', () => {
    const rand = mulberry32(7)
    for (let i = 0; i < 500; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('seedFromString', () => {
  it('同一字符串稳定，不同字符串区分', () => {
    expect(seedFromString('first-contact')).toBe(seedFromString('first-contact'))
    expect(seedFromString('a')).not.toBe(seedFromString('b'))
  })

  it('返回 32 位无符号整数', () => {
    const seed = seedFromString('咕鹿小屋')
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
    expect(seed).toBeLessThanOrEqual(0xffffffff)
  })
})
