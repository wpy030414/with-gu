import { vi } from 'vitest'

/* ==================================================================
 * jsdom 缺失的浏览器 API —— 统一在此补齐
 *
 * 下面这些 API 在 jsdom 里全部是 undefined，import 期就会炸：
 *   window.matchMedia / IntersectionObserver / ResizeObserver /
 *   requestIdleCallback / document.fonts / canvas.getContext('2d')
 *
 * 同时导出「手动触发」辅助函数，让测试保持确定性，
 * 不依赖任何真实时序。
 * ================================================================== */

/* ----------------------------- matchMedia ----------------------------- */

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const QUICK_MOTION_QUERY = '(prefers-reduced-transparency: reduce)'

const mediaState = new Map<string, boolean>()
const queryLists = new Map<string, MockMediaQueryList>()

class MockMediaQueryList extends EventTarget {
  readonly media: string
  onchange: ((ev: MediaQueryListEvent) => void) | null = null

  constructor(media: string) {
    super()
    this.media = media
  }

  get matches(): boolean {
    return mediaState.get(this.media) ?? false
  }
}

/** 修改某个媒体查询的匹配状态并派发 change —— 用于测「运行中切换设置」 */
export function setMediaQuery(query: string, matches: boolean): void {
  mediaState.set(query, matches)
  const mql = queryLists.get(query)
  if (!mql) return
  mql.dispatchEvent(Object.assign(new Event('change'), { matches, media: query }))
}

/** 切换系统「减弱动态效果」 */
export function setReducedMotion(matches: boolean): void {
  setMediaQuery(REDUCED_MOTION_QUERY, matches)
}

window.matchMedia = ((query: string): MediaQueryList => {
  let mql = queryLists.get(query)
  if (!mql) {
    mql = new MockMediaQueryList(query)
    queryLists.set(query, mql)
  }
  return mql as unknown as MediaQueryList
}) as typeof window.matchMedia

// 默认：系统未开启减弱动态效果
mediaState.set(REDUCED_MOTION_QUERY, false)
mediaState.set(QUICK_MOTION_QUERY, false)

/* ------------------------- IntersectionObserver ------------------------- */

interface MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements: Set<Element>
  observe: (el: Element) => void
  unobserve: (el: Element) => void
  disconnect: () => void
  takeRecords: () => IntersectionObserverEntry[]
}

/** 当前存活的所有 observer —— 测试用它断言「卸载时已 disconnect」 */
export const intersectionObservers = new Set<MockIntersectionObserver>()

class MockIntersectionObserverImpl implements MockIntersectionObserver {
  callback: IntersectionObserverCallback
  elements = new Set<Element>()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    intersectionObservers.add(this)
  }

  observe(el: Element): void {
    this.elements.add(el)
  }

  unobserve(el: Element): void {
    this.elements.delete(el)
  }

  disconnect(): void {
    this.elements.clear()
    intersectionObservers.delete(this)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

window.IntersectionObserver =
  MockIntersectionObserverImpl as unknown as typeof IntersectionObserver

/** 手动让某个元素「进入/离开视口」 */
export function triggerIntersection(el: Element, isIntersecting: boolean): void {
  const entry = {
    target: el,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: el.getBoundingClientRect(),
    intersectionRect: el.getBoundingClientRect(),
    rootBounds: null,
    time: 0,
  } as unknown as IntersectionObserverEntry

  // 先快照再遍历：回调里可能 disconnect 并从集合中删除自己
  for (const obs of Array.from(intersectionObservers)) {
    if (obs.elements.has(el)) {
      obs.callback([entry], obs as unknown as IntersectionObserver)
    }
  }
}

/* --------------------------- ResizeObserver --------------------------- */

interface MockResizeObserver {
  callback: ResizeObserverCallback
  targets: Set<Element>
  observe: (target: Element) => void
  unobserve: (target: Element) => void
  disconnect: () => void
}

/** 当前存活的 ResizeObserver —— 测试用它断言「卸载时已 disconnect」 */
export const resizeObservers = new Set<MockResizeObserver>()

class MockResizeObserverImpl implements MockResizeObserver {
  callback: ResizeObserverCallback
  targets = new Set<Element>()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObservers.add(this)
  }

  observe(target: Element): void {
    this.targets.add(target)
  }

  unobserve(target: Element): void {
    this.targets.delete(target)
  }

  disconnect(): void {
    this.targets.clear()
    resizeObservers.delete(this)
  }
}

window.ResizeObserver = MockResizeObserverImpl as unknown as typeof ResizeObserver

/** 手动触发一次尺寸变化 */
export function triggerResize(target: Element, width: number, height: number): void {
  const entry = {
    target,
    contentRect: { width, height },
    borderBoxSize: [],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  } as unknown as ResizeObserverEntry

  // 先快照再遍历：回调里可能 disconnect 并从集合中删除自己
  for (const obs of Array.from(resizeObservers)) {
    if (obs.targets.has(target)) {
      obs.callback([entry], obs as unknown as ResizeObserver)
    }
  }
}

/* ------------------------- requestIdleCallback ------------------------- */

window.requestIdleCallback ??= ((cb: IdleRequestCallback) =>
  setTimeout(
    () =>
      cb({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline),
    0,
  )) as typeof window.requestIdleCallback

window.cancelIdleCallback ??= ((id: number) => clearTimeout(id)) as typeof window.cancelIdleCallback

/* ---------------------------- document.fonts ---------------------------- */

if (!document.fonts) {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: {
      ready: Promise.resolve(),
      load: vi.fn(() => Promise.resolve([])),
      check: vi.fn(() => true),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    },
  })
}

/* ------------------------- canvas 2d context ------------------------- */

export interface Recording2DContext {
  calls: string[]
  drawImage: ReturnType<typeof vi.fn>
  fillText: ReturnType<typeof vi.fn>
  clearRect: ReturnType<typeof vi.fn>
  fillRect: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
  restore: ReturnType<typeof vi.fn>
  measureText: ReturnType<typeof vi.fn>
  readonly ctx: CanvasRenderingContext2D
}

/**
 * 当前创建过的所有 2D 上下文。
 *
 * jsdom 不实现 canvas，`getContext` 直接返回 null。
 * 这里不模拟像素，而是**记录绘制指令** —— 断言「发出了哪些调用」
 * 才是确定性的画布测试方式。
 */
export const canvasContexts: Recording2DContext[] = []

/** 取最近一次创建的 2D 上下文 */
export function latestCanvasContext(): Recording2DContext | undefined {
  return canvasContexts[canvasContexts.length - 1]
}

function createRecordingContext(canvas: HTMLCanvasElement): Recording2DContext {
  const calls: string[] = []

  const record =
    (name: string) =>
    (...args: unknown[]): void => {
      calls.push(name)
      void args
      void canvas
    }

  const ctx = {
    canvas,
    calls,
    drawImage: vi.fn(record('drawImage')),
    fillText: vi.fn(record('fillText')),
    clearRect: vi.fn(record('clearRect')),
    fillRect: vi.fn(record('fillRect')),
    save: vi.fn(record('save')),
    restore: vi.fn(record('restore')),
    measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
    beginPath: vi.fn(record('beginPath')),
    closePath: vi.fn(record('closePath')),
    fill: vi.fn(record('fill')),
    stroke: vi.fn(record('stroke')),
    setTransform: vi.fn(record('setTransform')),
    globalAlpha: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '',
    textBaseline: 'top',
    imageSmoothingEnabled: true,
  }

  const recording = ctx as unknown as Recording2DContext
  canvasContexts.push(recording)
  return recording
}

HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
): unknown {
  return contextId === '2d' ? createRecordingContext(this).ctx : null
} as typeof HTMLCanvasElement.prototype.getContext

/** 清空记录 —— 在 beforeEach 里调用 */
export function resetDomMocks(): void {
  canvasContexts.length = 0
  intersectionObservers.clear()
  resizeObservers.clear()
  setReducedMotion(false)
}
