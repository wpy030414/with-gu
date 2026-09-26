import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { COMMAND_HELP, fortuneCooldownNotice, unknownCommand } from '@/content/commands'
import { drawFortune, FORTUNE_COOLDOWN_MS, isOminous } from '@/content/fortune'
import { hash1d, seedFromString } from '@/engine/rng'

import styles from './TerminalOutput.module.css'

/** 《杏仁鹿与咕猫猫一生一世专属许可证》——
    直接 ?raw 引入仓库根的 LICENSE.md，单一内容源，零重复 */
import licenseText from '../../../LICENSE.md?raw'

const STORAGE_KEY = 'with-gu:fortune-at'
const FORTUNE_SEED = seedFromString('fortune')

export interface SessionEntry {
  id: number
  command: string
  node: ReactNode
}

interface SessionApi {
  entries: readonly SessionEntry[]
  input: string
  setInput: (value: string) => void
  /** 跑一行命令（`clear` 之类的内部状态变更也走这里） */
  run: (raw: string) => void
}

const SessionContext = createContext<SessionApi | null>(null)

/** 冷却剩余毫秒数；读不到或不可用时返回 0（不阻塞使用） */
function cooldownRemaining(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0

    const at = Number(raw)
    if (!Number.isFinite(at)) return 0

    return Math.max(0, at + FORTUNE_COOLDOWN_MS - Date.now())
  } catch {
    return 0
  }
}

function markFortuneDrawn(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
  } catch {
    /* 隐私模式下写不了 —— 不影响抽签本身 */
  }
}

function formatRemaining(ms: number): string {
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.ceil((ms % 3_600_000) / 60_000)
  return hours > 0 ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`
}

export interface TerminalSessionProps {
  children: ReactNode
}

/**
 * 终端会话
 *
 * 命令历史与输入框**不在同一个 DOM 位置**：历史属于屏幕内容（随正文滚动），
 * 输入行常驻窗口底部。真终端就是这样分工的，所以这层会话状态必须提到
 * 窗口之上，由 `TerminalOutput`（屏幕内）与 `TerminalPrompt`（底栏）分头消费。
 */
export function TerminalSession({ children }: TerminalSessionProps) {
  const [entries, setEntries] = useState<SessionEntry[]>([])
  const [input, setInput] = useState('')
  const nextId = useRef(0)

  const push = useCallback((command: string, node: ReactNode) => {
    nextId.current += 1
    const id = nextId.current
    setEntries((previous) => [...previous, { id, command, node }])
  }, [])

  const run = useCallback(
    (raw: string) => {
      const command = raw.trim()
      if (command === '') return

      if (command === 'clear') {
        setEntries([])
        return
      }

      if (command === 'help') {
        push(command, <span className={styles.hint}>{COMMAND_HELP.join('\n')}</span>)
        return
      }

      if (command === 'cat LICENSE' || command === 'cat license') {
        push(
          command,
          <pre className={styles.license} data-testid="license-output">
            {licenseText.trimEnd()}
          </pre>,
        )
        return
      }

      if (command === 'fortune') {
        const remaining = cooldownRemaining()

        if (remaining > 0) {
          push(
            command,
            <span className={styles.hint}>
              {fortuneCooldownNotice(formatRemaining(remaining))}
            </span>,
          )
          return
        }

        const fortune = drawFortune(hash1d(Date.now(), FORTUNE_SEED))
        markFortuneDrawn()

        push(
          command,
          <span className={isOminous(fortune) ? styles.ominous : styles.plain}>
            {[`【${fortune.rank}】`, ...fortune.poem, '', fortune.note].join('\n')}
          </span>,
        )
        return
      }

      push(command, <span className={styles.hint}>{unknownCommand(command)}</span>)
    },
    [push],
  )

  const api = useMemo<SessionApi>(() => ({ entries, input, setInput, run }), [entries, input, run])

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>
}

/** 会话状态。不在 `TerminalSession` 内调用时抛错 —— 这是装配错误，不是运行时分支 */
export function useTerminalSession(): SessionApi {
  const session = useContext(SessionContext)

  if (!session) {
    throw new Error('useTerminalSession 必须在 <TerminalSession> 内使用')
  }

  return session
}
