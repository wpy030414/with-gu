/**
 * 确定性随机 —— 引擎内**禁止使用 `Math.random()`**
 *
 * 不是为了性能（每帧几千次调用可以忽略），而是为了**可复现**：
 * 截图基线、bug 复现、E2E 断言全都依赖「同一种子必然同一结果」。
 */

/** MurmurHash3 的 32 位雪崩终结器 —— 保证低位充分混合 */
function fmix32(h: number): number {
  let x = h
  x ^= x >>> 16
  x = Math.imul(x, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return x >>> 0
}

/**
 * 二维整数 hash → [0, 1)
 *
 * 无任何对象分配，O(1)。逐格计算解码时刻时每帧要调用数千次，
 * 这条约束是刻意的。
 */
export function hash2d(x: number, y: number, seed: number): number {
  let h = seed >>> 0
  h = Math.imul(h ^ (x | 0), 0x9e3779b1)
  h = Math.imul(h ^ (y | 0), 0x85ebca6b)
  return fmix32(h) / 4294967296
}

/** 一维版本，用于逐字符顺序取随机 */
export function hash1d(x: number, seed: number): number {
  let h = seed >>> 0
  h = Math.imul(h ^ (x | 0), 0x9e3779b1)
  return fmix32(h) / 4294967296
}

/**
 * mulberry32 —— 公开领域的 32 位种子化 PRNG。
 *
 * 用于需要「连续取数」的场合（如生成噪声瓦片）；
 * 逐格独立取样请用 `hash2d`，那是无分配且可随机访问的。
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 把任意字符串折成一个 32 位种子 —— 便于用「节点 id」当种子 */
export function seedFromString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
