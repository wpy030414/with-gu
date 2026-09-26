import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { director } from '@/engine/director'
import type { RevealMode } from '@/engine/reveal'
import { useCharAnimation } from '@/hooks/useCharAnimation'

const ART = 'AB\nCD'

interface HarnessProps {
  play?: boolean
  reducedMotion?: boolean
  mode?: RevealMode
  durationMs?: number
}

function Harness({
  play = true,
  reducedMotion = false,
  mode = 'wave',
  durationMs = 100,
}: HarnessProps) {
  const { brightRef, noiseRef, settled } = useCharAnimation({
    art: ART,
    mode,
    durationMs,
    play,
    reducedMotion,
    id: 'harness',
  })

  return (
    <div data-testid="root" data-reveal-state={settled ? 'done' : 'running'}>
      <pre ref={brightRef} data-testid="bright" />
      <pre ref={noiseRef} data-testid="noise" />
    </div>
  )
}

const bright = () => screen.getByTestId('bright').textContent ?? ''
const noise = () => screen.getByTestId('noise').textContent ?? ''

/** 已解码格数 —— 空格与换行不算 */
function decodedCount(text: string): number {
  return [...text].filter((ch) => ch !== ' ' && ch !== '\n').length
}

beforeEach(() => {
  director.reset()
  vi.stubGlobal('requestAnimationFrame', () => 1)
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  director.reset()
  vi.unstubAllGlobals()
})

describe('首帧', () => {
  it('同步写入，不留空白（useLayoutEffect 的意义）', () => {
    render(<Harness />)

    // wave 模式下 t=0 时第 0 列已解码
    expect(bright()).toBe('A \nC ')
    expect(decodedCount(bright())).toBe(2)
  })

  it('暗层首帧就画出乱码，且只画在未解码格', () => {
    render(<Harness />)

    const cells = [...noise()].filter((ch) => ch !== '\n')
    expect(cells[0]).toBe(' ') // 已解码
    expect(cells[1]).not.toBe(' ') // 未解码
    expect(cells[2]).toBe(' ') // 已解码
    expect(cells[3]).not.toBe(' ') // 未解码
  })

  it('两层行结构一致', () => {
    render(<Harness />)
    expect(bright().split('\n')).toHaveLength(2)
    expect(noise().split('\n')).toHaveLength(2)
  })
})

describe('推进', () => {
  it('推进满时长后全部解码，暗层清空', () => {
    render(<Harness />)

    act(() => {
      director.advance(100)
    })

    expect(bright()).toBe('AB\nCD')
    // 暗层整体清空而非写满空格：清节点比写空格更省，grid 叠放下也不影响容器高度
    expect(noise()).toBe('')
    expect(screen.getByTestId('root')).toHaveAttribute('data-reveal-state', 'done')
  })

  it('亮层已解码格数只增不减 —— 单调性是这个设计成立的前提', () => {
    render(<Harness mode="dissolve" durationMs={1000} />)

    let previous = -1
    for (let i = 0; i < 20; i++) {
      act(() => {
        director.advance(50)
      })

      const count = decodedCount(bright())
      expect(count).toBeGreaterThanOrEqual(previous)
      previous = count
    }

    expect(bright()).toBe('AB\nCD')
  })

  it('完成前一直处于 running', () => {
    render(<Harness durationMs={1000} />)

    act(() => {
      director.advance(500)
    })

    expect(screen.getByTestId('root')).toHaveAttribute('data-reveal-state', 'running')
  })
})

describe('减弱动态效果', () => {
  it('首帧即终态，且不注册任何演员（不留持续循环）', () => {
    render(<Harness reducedMotion />)

    expect(bright()).toBe('AB\nCD')
    expect(noise()).toBe('')
    expect(screen.getByTestId('root')).toHaveAttribute('data-reveal-state', 'done')
    expect(director.activeActorCount).toBe(0)
  })

  it('推进也不会改变任何东西', () => {
    render(<Harness reducedMotion />)
    const before = bright()

    act(() => {
      director.advance(500)
    })

    expect(bright()).toBe(before)
  })
})

describe('可见性', () => {
  it('不可见时不推进', () => {
    render(<Harness play={false} />)
    const before = bright()

    act(() => {
      director.advance(500)
    })

    expect(bright()).toBe(before)
  })

  it('离开视口暂停但保留进度，回来后从原处续上而不是重播', () => {
    const { rerender } = render(<Harness play durationMs={100} />)

    act(() => {
      director.advance(50)
    })
    const midway = bright()
    expect(midway).toBe('A \nC ') // wave 下第 1 列 50ms 时才解码

    rerender(<Harness play={false} durationMs={100} />)
    act(() => {
      director.advance(500)
    })
    expect(bright()).toBe(midway) // 暂停期间纹丝不动

    rerender(<Harness play durationMs={100} />)
    act(() => {
      director.advance(50)
    })
    expect(bright()).toBe('AB\nCD') // 从 50 续到 100，而不是从头再来
  })
})

describe('生命周期', () => {
  it('挂载时注册演员', () => {
    render(<Harness />)
    expect(director.activeActorCount).toBe(1)
  })

  it('卸载时从注册表移除 —— StrictMode 会立刻暴露泄漏', () => {
    const { unmount } = render(<Harness />)
    expect(director.activeActorCount).toBe(1)

    unmount()
    expect(director.activeActorCount).toBe(0)
  })

  it('StrictMode 的双调用不会留下重复注册', () => {
    const { unmount } = render(<Harness />)
    unmount()

    // mount → cleanup → mount 之后必须仍是干净的 0
    expect(director.activeActorCount).toBe(0)
  })
})
