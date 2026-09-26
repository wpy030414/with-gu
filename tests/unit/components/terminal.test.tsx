import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { TerminalOutput } from '@/components/terminal/TerminalOutput'
import { TerminalPrompt } from '@/components/terminal/TerminalPrompt'
import { TerminalSession } from '@/components/terminal/TerminalSession'

/**
 * 命令行会话
 *
 * 这一段逻辑此前完全靠 E2E 覆盖，而它在重构中被搬过家
 * （页脚组件 → 会话 context + 屏幕输出 + 常驻提示符），
 * 搬家最容易掉的就是「命令还在不在」这件事 —— 所以在这里钉住。
 *
 * 不渲染 TerminalWindow：`useTerminalScreen` 在窗口之外返回 null，
 * 这正是它刻意不做硬依赖的原因（见 TerminalWindow.tsx）。
 */
function setup() {
  render(
    <TerminalSession>
      <TerminalOutput />
      <TerminalPrompt />
    </TerminalSession>,
  )
}

async function typeCommand(command: string) {
  const user = userEvent.setup()
  const input = screen.getByLabelText('gu@with-gu:~$')

  await user.type(input, `${command}{Enter}`)

  return input
}

beforeEach(() => {
  localStorage.clear()
})

describe('终端会话', () => {
  it('初始没有任何输出 —— 屏幕上只有正文', () => {
    setup()

    expect(screen.queryByLabelText('命令输出')).not.toBeInTheDocument()
  })

  it('空输入不产生输出', async () => {
    setup()
    await typeCommand('   ')

    expect(screen.queryByLabelText('命令输出')).not.toBeInTheDocument()
  })

  it('help 列出全部可用命令', async () => {
    setup()
    await typeCommand('help')

    const output = screen.getByLabelText('命令输出')
    expect(output).toHaveTextContent('可用命令：')
    expect(output).toHaveTextContent('cat LICENSE')
    expect(output).toHaveTextContent('fortune')
    expect(output).toHaveTextContent('clear')
  })

  it('未知命令给出提示而不是静默失败', async () => {
    setup()
    await typeCommand('rm -rf /')

    expect(screen.getByLabelText('命令输出')).toHaveTextContent('未知命令：rm -rf /')
  })

  it('提交后输入框清空 —— 命令跑过了，提示符应该等下一行', async () => {
    setup()
    const input = await typeCommand('help')

    expect(input).toHaveValue('')
  })

  it('cat LICENSE 输出许可证全文', async () => {
    setup()
    await typeCommand('cat LICENSE')

    expect(screen.getByTestId('license-output')).toHaveTextContent(
      '杏仁鹿与咕猫猫一生一世专属许可证',
    )
  })

  it('clear 清空屏幕上的输出，但不清空输入框的可用性', async () => {
    setup()
    await typeCommand('help')
    expect(screen.getByLabelText('命令输出')).toBeInTheDocument()

    await typeCommand('clear')
    expect(screen.queryByLabelText('命令输出')).not.toBeInTheDocument()
  })

  it('fortune 先给出签文，冷却期内再抽只给提示', async () => {
    setup()

    await typeCommand('fortune')
    expect(screen.getByLabelText('命令输出')).toHaveTextContent(/【(大吉|中吉|小吉|末吉|凶)】/)

    await typeCommand('fortune')
    expect(screen.getByLabelText('命令输出')).toHaveTextContent('签筒尚在冷却')
  })

  it('多次命令按顺序累积，不互相覆盖', async () => {
    setup()

    await typeCommand('help')
    await typeCommand('rm -rf /')

    const output = screen.getByLabelText('命令输出')
    expect(output).toHaveTextContent('可用命令：')
    expect(output).toHaveTextContent('未知命令：rm -rf /')
  })
})
