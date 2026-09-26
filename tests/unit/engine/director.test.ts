import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MAX_ACTIVE_ACTORS,
  MAX_DELTA_MS,
  NOISE_FRAME_MS,
  computeDelta,
  director,
  type AnimationActor,
} from '@/engine/director'

/* --------------------------- 测试用假演员 --------------------------- */

interface FakeActorOptions {
  id: string
  priority?: number
  visible?: boolean
  /** 第 n 次 tick 后返回 false（模拟完成） */
  stopAfter?: number
}

function makeActor(options: FakeActorOptions) {
  const ticks: number[] = []
  let settleCount = 0

  const actor: AnimationActor = {
    id: options.id,
    priority: options.priority ?? 0,
    visible: options.visible ?? true,

    tick(dt) {
      ticks.push(dt)
      return options.stopAfter === undefined || ticks.length < options.stopAfter
    },

    settle() {
      settleCount++
    },
  }

  return { actor, ticks, settleCount: () => settleCount }
}

/* --------------------------- rAF 与可见性控制 --------------------------- */

let rafCallbacks: FrameRequestCallback[] = []

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    value: hidden,
  })
}

/** 取出导演最近一次排入的帧回调 */
function latestFrame(): FrameRequestCallback {
  const cb = rafCallbacks.at(-1)
  if (!cb) throw new Error('导演没有排入 rAF 回调')
  return cb
}

beforeEach(() => {
  director.reset()
  rafCallbacks = []
  setHidden(false)

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafCallbacks.push(cb)
    return rafCallbacks.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    /* 测试里不需要真的取消 */
  })
})

afterEach(() => {
  director.reset()
  vi.unstubAllGlobals()
  setHidden(false)
})

/* -------------------------------- 用例 -------------------------------- */

describe('computeDelta', () => {
  it('正常帧返回真实增量', () => {
    expect(computeDelta(1016, 1000)).toBe(16)
  })

  it('巨量增量被 clamp —— 这是「回到前台瞬间跳到终态」的唯一防线', () => {
    // 后台挂起 30 秒后回来
    expect(computeDelta(31_000, 1000)).toBe(MAX_DELTA_MS)
    expect(computeDelta(31_000, 1000)).toBeLessThan(1000)
  })

  it('时间戳倒退（时钟回拨）返回 0 而非负数', () => {
    expect(computeDelta(900, 1000)).toBe(0)
  })
})

describe('优先级预算', () => {
  it('每帧只推进优先级最高的 3 个，其余原地保留进度', () => {
    const actors = [
      makeActor({ id: 'a', priority: 5 }),
      makeActor({ id: 'b', priority: 4 }),
      makeActor({ id: 'c', priority: 3 }),
      makeActor({ id: 'd', priority: 2 }),
      makeActor({ id: 'e', priority: 1 }),
    ]
    for (const m of actors) director.register(m.actor)

    director.advance(16)

    expect(actors[0]?.ticks).toHaveLength(1)
    expect(actors[1]?.ticks).toHaveLength(1)
    expect(actors[2]?.ticks).toHaveLength(1)
    // 被暂停的演员这帧完全没被推进 —— 它们的 elapsed 留在自己身上
    expect(actors[3]?.ticks).toHaveLength(0)
    expect(actors[4]?.ticks).toHaveLength(0)
  })

  it('预算上限是 MAX_ACTIVE_ACTORS —— 把口号变成可执行的约束', () => {
    const actors = Array.from({ length: 10 }, (_, i) =>
      makeActor({ id: `a${i}`, priority: i }),
    )
    for (const m of actors) director.register(m.actor)

    director.advance(16)

    const tickedCount = actors.filter((m) => m.ticks.length > 0).length
    expect(tickedCount).toBe(MAX_ACTIVE_ACTORS)
    expect(MAX_ACTIVE_ACTORS).toBe(3)
  })

  it('高位演员完成后，腾出的预算立刻让给下一位', () => {
    const a = makeActor({ id: 'a', priority: 5, stopAfter: 1 })
    const b = makeActor({ id: 'b', priority: 4 })
    const c = makeActor({ id: 'c', priority: 3 })
    const d = makeActor({ id: 'd', priority: 2 })

    for (const m of [a, b, c, d]) director.register(m.actor)

    director.advance(16)
    expect(d.ticks).toHaveLength(0)

    director.advance(16)
    // a 已退出活跃集合，d 补位
    expect(a.ticks).toHaveLength(1)
    expect(d.ticks).toHaveLength(1)
  })

  it('不可见的演员完全不参与推进', () => {
    const visible = makeActor({ id: 'visible', priority: 1 })
    const hidden = makeActor({ id: 'hidden', priority: 9, visible: false })

    director.register(visible.actor)
    director.register(hidden.actor)
    director.advance(16)

    expect(visible.ticks).toHaveLength(1)
    expect(hidden.ticks).toHaveLength(0)
  })
})

describe('时间与可见性', () => {
  it('后台标签页期间不推进任何演员', () => {
    const a = makeActor({ id: 'a' })
    director.register(a.actor)

    setHidden(true)
    latestFrame()(1000)
    latestFrame()(31_000)

    expect(a.ticks).toHaveLength(0)
  })

  it('回到前台后的第一帧增量被 clamp，动画不会瞬间跳到终态', () => {
    const a = makeActor({ id: 'a' })
    director.register(a.actor)

    setHidden(true)
    latestFrame()(1000)
    latestFrame()(31_000)

    setHidden(false)
    latestFrame()(31_016)

    const lastTick = a.ticks.at(-1)
    expect(lastTick).toBeDefined()
    expect(lastTick).toBeLessThanOrEqual(MAX_DELTA_MS)
  })

  it('乱码帧号按累积时间推进，而非按帧数', () => {
    const a = makeActor({ id: 'a' })
    director.register(a.actor)

    expect(director.currentNoiseFrame).toBe(0)

    director.advance(NOISE_FRAME_MS - 1)
    expect(director.currentNoiseFrame).toBe(0)

    director.advance(1)
    expect(director.currentNoiseFrame).toBe(1)

    director.advance(NOISE_FRAME_MS * 3)
    expect(director.currentNoiseFrame).toBe(4)
  })
})

describe('减弱动态效果', () => {
  it('开启后不启动任何循环，而是直接给终态', () => {
    director.setReducedMotion(true)

    const a = makeActor({ id: 'a' })
    director.register(a.actor)
    director.advance(16)

    expect(a.ticks).toHaveLength(0)
    expect(a.settleCount()).toBe(1)
    expect(director.isRunning).toBe(false)
  })

  it('运行中切换设置会立刻结算全部演员并停表', () => {
    const a = makeActor({ id: 'a' })
    const b = makeActor({ id: 'b' })
    director.register(a.actor)
    director.register(b.actor)

    director.setReducedMotion(true)

    expect(a.settleCount()).toBe(1)
    expect(b.settleCount()).toBe(1)
    expect(director.isRunning).toBe(false)
  })

  it('关闭后演员重新参与推进', () => {
    director.setReducedMotion(true)
    director.setReducedMotion(false)

    const a = makeActor({ id: 'a' })
    director.register(a.actor)
    director.advance(16)

    expect(a.ticks).toHaveLength(1)
  })
})

describe('注册表生命周期', () => {
  it('注销后不再被推进（StrictMode 的 mount→cleanup→mount 会立刻暴露泄漏）', () => {
    const a = makeActor({ id: 'a' })
    director.register(a.actor)
    director.unregister('a')

    expect(director.activeActorCount).toBe(0)

    director.advance(16)
    expect(a.ticks).toHaveLength(0)
  })

  it('全部演员注销后导演自动停表', () => {
    const a = makeActor({ id: 'a' })
    director.register(a.actor)
    expect(director.isRunning).toBe(true)

    director.unregister('a')
    expect(director.isRunning).toBe(false)
  })

  it('settleAll 让全部演员跳到终态', () => {
    const a = makeActor({ id: 'a' })
    const b = makeActor({ id: 'b' })
    director.register(a.actor)
    director.register(b.actor)

    director.settleAll()

    expect(a.settleCount()).toBe(1)
    expect(b.settleCount()).toBe(1)
  })

  it('setVisible 能唤醒已停表的导演', () => {
    const a = makeActor({ id: 'a', visible: false })
    director.register(a.actor)

    director.advance(16)
    expect(director.isRunning).toBe(false)

    director.setVisible('a', true)
    expect(director.isRunning).toBe(true)
  })
})
