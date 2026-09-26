/**
 * 全局动画导演
 *
 * 为什么需要它：如果每个组件各自 `requestAnimationFrame`，那么
 * 「同屏最多 3 个活跃循环」就只是一句**口号** —— 没有任何执行者。
 * 导演把唯一的 rAF、优先级预算、可见性、降级策略全部收归一处。
 *
 * 三条职责边界：
 *
 * 1. **唯一 rAF**。全局只有这一个循环，空闲时自动停止。
 * 2. **预算**。每帧只推进优先级最高的至多 `MAX_ACTIVE_ACTORS` 个演员；
 *    其余的**保留各自进度**（elapsed 属于演员而非导演），只是这帧不推进。
 * 3. **时间**。累积 delta 并 clamp —— 后台标签页的 rAF 会完全停止，
 *    用 `now - startTime` 会在回到前台时把动画瞬间推到终态。
 */

/** 同屏同时推进的动画上限 */
export const MAX_ACTIVE_ACTORS = 3

/**
 * 单帧最大步进。
 *
 * 这个数只为一件事存在：后台标签页的 rAF 会完全停止，回来后第一帧的 delta
 * 可能是几十秒 —— 必须截断，否则动画会「瞬间跳到终态」。
 *
 * 但它有个副作用：**它同时决定了动画在慢机器上的墙上时长**。
 * 60Hz 的帧长是 16ms，取 50ms 意味着低于 20fps 就会被截断，
 * 而那些被截掉的时长不会补回来 —— 2.6s 的动画在一台 10fps 的机器上要跑 5.2s，
 * 在一台卡顿的 CI 容器里可能更久。这正是「本地全绿、CI 全红」这类
 * 环境相关故障的温床，所以阈值必须给足余量。
 *
 * 取 200ms：只有低于 5fps 才会被截断，而此刻任何行为都已经是降级的了。
 * 真正处理挂起的是 `visibilitychange` 重置时间基准（见构造函数），
 * 这里只是第二道防线，因此给得起这个宽松度。
 */
export const MAX_DELTA_MS = 200

/** 乱码换帧间隔 —— 每 2~3 帧变一次就够了，静止的乱码看起来像卡住了 */
export const NOISE_FRAME_MS = 50

/**
 * 由相邻两帧的时间戳算出可用的增量。
 *
 * 抽成纯函数是刻意的：这是「回到前台瞬间跳到终态」这个必然发生的 bug
 * 的唯一防线，必须能被单独断言，而不是埋在 rAF 回调里。
 */
export function computeDelta(now: number, lastTime: number): number {
  return Math.min(MAX_DELTA_MS, Math.max(0, now - lastTime))
}

/** 画质档位：低端机 / 省电模式下由导演统一降级，不分散到各组件判断 */
export type Quality = 'high' | 'low'

export interface AnimationActor {
  /** 稳定标识，用于注册表去重 */
  readonly id: string
  /** 数值越大越先获得推进预算 */
  readonly priority: number

  /** 由 IntersectionObserver 等外部逻辑维护 */
  visible: boolean

  /**
   * 推进一帧。
   *
   * @param dtMs      本帧增量（已 clamp，恒为正且 ≤ MAX_DELTA_MS）
   * @param noiseFrame 乱码帧序号 —— 全体演员共用，保证噪点同步
   * @returns 是否仍需继续推进；返回 false 即从活跃集合退出
   */
  tick(dtMs: number, noiseFrame: number): boolean

  /** 立即跳到终态（减弱动态效果、跳过动画、回看时使用） */
  settle(): void
}

class Director {
  private readonly actors = new Map<string, AnimationActor>()
  private readonly abort = new AbortController()

  private rafId: number | null = null
  private lastTime = 0
  private noiseFrame = 0
  private noiseAccum = 0

  private reducedMotion = false
  private quality: Quality = 'high'

  constructor() {
    // 回到前台时重置时间基准，否则第一帧仍是巨量 delta
    document.addEventListener('visibilitychange', this.handleVisibilityChange, {
      signal: this.abort.signal,
    })
  }

  private handleVisibilityChange = (): void => {
    this.lastTime = performance.now()
  }

  /* ------------------------------ 注册表 ------------------------------ */

  register(actor: AnimationActor): void {
    this.actors.set(actor.id, actor)

    // 减弱动态效果下不启动任何循环，直接给终态
    if (this.reducedMotion) {
      actor.settle()
      return
    }

    this.ensureRunning()
  }

  unregister(id: string): void {
    this.actors.delete(id)
    if (this.actors.size === 0) this.stop()
  }

  setVisible(id: string, visible: boolean): void {
    const actor = this.actors.get(id)
    if (!actor || actor.visible === visible) return

    actor.visible = visible
    if (visible) this.ensureRunning()
  }

  /** 让某个演员立即跳到终态 */
  settle(id: string): void {
    const actor = this.actors.get(id)
    if (actor) actor.settle()
  }

  /** 让全部演员跳到终态，并停掉循环 */
  settleAll(): void {
    for (const actor of this.actors.values()) actor.settle()
    this.stop()
  }

  /* ------------------------------ 降级 ------------------------------ */

  setReducedMotion(reduced: boolean): void {
    if (this.reducedMotion === reduced) return
    this.reducedMotion = reduced

    if (reduced) {
      this.settleAll()
    } else {
      this.ensureRunning()
    }
  }

  setQuality(quality: Quality): void {
    this.quality = quality
  }

  get currentQuality(): Quality {
    return this.quality
  }

  /* ------------------------------ 循环 ------------------------------ */

  private ensureRunning(): void {
    if (this.rafId !== null || this.reducedMotion) return
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
  }

  private stop(): void {
    if (this.rafId === null) return
    cancelAnimationFrame(this.rafId)
    this.rafId = null
  }

  private loop = (now: number): void => {
    this.rafId = requestAnimationFrame(this.loop)

    if (document.hidden) {
      // rAF 通常已经停了，这里再兜一层，避免回来时算出巨量 delta
      this.lastTime = now
      return
    }

    const dt = computeDelta(now, this.lastTime)
    this.lastTime = now
    this.advance(dt)
  }

  /**
   * 推进一帧 —— 公开是为了让单测注入手动时钟，不必依赖真实 rAF。
   * 「跑 60 帧」在测试里就是循环调 60 次，完全确定。
   */
  advance(dtMs: number): void {
    if (this.reducedMotion) return

    // 按阈值扣减而非清零：否则推进节奏会随帧长缓慢漂移
    this.noiseAccum += dtMs
    if (this.noiseAccum >= NOISE_FRAME_MS) {
      const steps = Math.floor(this.noiseAccum / NOISE_FRAME_MS)
      this.noiseFrame += steps
      this.noiseAccum -= steps * NOISE_FRAME_MS
    }

    const runnable = Array.from(this.actors.values()).filter((a) => a.visible)

    if (runnable.length === 0) {
      this.stop()
      return
    }

    // 优先级高的先推进；同优先级保持注册顺序（Map 保序）
    runnable.sort((a, b) => b.priority - a.priority)

    const budget = Math.min(MAX_ACTIVE_ACTORS, runnable.length)

    for (let i = 0; i < budget; i++) {
      const actor = runnable[i]
      if (!actor) continue

      const keepRunning = actor.tick(dtMs, this.noiseFrame)
      if (!keepRunning) {
        // 完成的演员退出活跃集合，但保留在注册表里等待卸载
        actor.visible = false
      }
    }
  }

  /* ------------------------------ 供测试与调试 ------------------------------ */

  get activeActorCount(): number {
    return this.actors.size
  }

  get currentNoiseFrame(): number {
    return this.noiseFrame
  }

  get isRunning(): boolean {
    return this.rafId !== null
  }

  /** 测试收尾用 —— 清空注册表并停表 */
  reset(): void {
    this.stop()
    this.actors.clear()
    this.noiseFrame = 0
    this.noiseAccum = 0
    this.reducedMotion = false
    this.quality = 'high'
  }
}

/** 全局唯一实例 */
export const director = new Director()
