import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setReducedMotion } from '../../helpers/dom'
import { TYPING_PER_CHAR_MS } from '@/engine/pacing'
import { useCommandTyping } from '@/hooks/useCommandTyping'

const TEXT = 'cat x.log'
const TYPING_MS = TEXT.length * TYPING_PER_CHAR_MS

interface HarnessProps {
  started: boolean
  text?: string
}

function Harness({ started, text = TEXT }: HarnessProps) {
  const { phase, typingMs, steps } = useCommandTyping({ text, started })

  return <div data-testid="root" data-phase={phase} data-typing-ms={typingMs} data-steps={steps} />
}

const root = () => screen.getByTestId('root')
const phase = () => root().getAttribute('data-phase')

/** 推进到打字结束（多给 1ms 避免边界） */
function finishTyping() {
  act(() => {
    vi.advanceTimersByTime(TYPING_MS + 1)
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('命令行打字', () => {
  it('还没进入视口时停在 idle —— 不是「载入好了但没显示」', () => {
    render(<Harness started={false} />)

    expect(phase()).toBe('idle')
  })

  it('开始之后先进入 typing，敲满时长才轮到 output', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Harness started={false} />)

    rerender(<Harness started />)
    expect(phase()).toBe('typing')

    // 差一点点还不能交卷
    act(() => {
      vi.advanceTimersByTime(TYPING_MS - 1)
    })
    expect(phase()).toBe('typing')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(phase()).toBe('output')
  })

  it('把字符数与时长交给 CSS，逐字揭开才对得上', () => {
    vi.useFakeTimers()
    render(<Harness started />)

    expect(root()).toHaveAttribute('data-steps', String(TEXT.length))
    expect(root()).toHaveAttribute('data-typing-ms', String(TYPING_MS))
  })

  it('减弱动态效果下打字时长为 0，但阶段照走', () => {
    vi.useFakeTimers()
    setReducedMotion(true)

    render(<Harness started />)
    expect(root()).toHaveAttribute('data-typing-ms', '0')

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(phase()).toBe('output')
  })
})

describe('视口边缘的抖动', () => {
  /**
   * 回归用例。
   *
   * `started` 来自 IntersectionObserver，而元素贴着 rootMargin 那条线时
   * 会**反复进出** —— 这不是理论推演，`nanjing` 节点在 E2E 里就这么卡住过。
   *
   * 如果时钟直接挂在 `started` 上，每次抖动都会 `clearTimeout` + 重设；
   * 只要抖动周期短于打字时长，这一行就永远敲不完，
   * 而「敲完才输出」意味着**整个节点的标题与字符画永不出现**。
   */
  it('来回进出不会让这一行永远敲不完', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Harness started={false} />)

    /* 每轮「进 → 推进一点 → 出 → 推进一点」。
       单轮推进 2T/5，**小于**打字时长 T；十轮累计 4T。
       时钟若挂在 `started` 上，每轮都被清零，此刻仍是 typing；
       单向的时钟则早就交卷了 —— 这正是本用例要区分的那条线。 */
    for (let i = 0; i < 10; i++) {
      rerender(<Harness started />)
      act(() => {
        vi.advanceTimersByTime(TYPING_MS / 5)
      })
      rerender(<Harness started={false} />)
      act(() => {
        vi.advanceTimersByTime(TYPING_MS / 5)
      })
    }

    expect(phase()).toBe('output')
  })

  it('已经开始过的节点，之后一直不进入视口也照样敲完', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Harness started />)

    finishTyping()
    expect(phase()).toBe('output')

    // 滚走再滚回来：不重播
    rerender(<Harness started={false} />)
    expect(phase()).toBe('output')
  })
})
