import { useCallback, useRef, useState, type ReactNode } from 'react'

import { drawFortune, FORTUNE_COOLDOWN_MS, isOminous } from '@/content/fortune'
import { hash1d, seedFromString } from '@/engine/rng'

import styles from './TerminalFooter.module.css'

/** 《杏仁鹿与咕猫猫一生一世专属许可证》——
    直接 ?raw 引入仓库根的 LICENSE.md，单一内容源，零重复 */
import licenseText from '../../../LICENSE.md?raw'

const STORAGE_KEY = 'with-gu:fortune-at'
const FORTUNE_SEED = seedFromString('fortune')

interface Entry {
  id: number
  command: string
  node: ReactNode
}

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

export interface TerminalFooterProps {
  pool?: string
}

export function TerminalFooter(_props: TerminalFooterProps) {
  const [entries, setEntries] = useState<Entry[]>([])
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
        push(
          command,
          <span className={styles.hint}>
            {[
              '可用命令：',
              '  help          显示这份帮助',
              '  cat LICENSE   查阅《杏仁鹿与咕猫猫一生一世专属许可证》',
              '  fortune       抽一支御神签（含冷却）',
              '  clear         清屏',
            ].join('\n')}
          </span>,
        )
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
              签筒尚在冷却，还请 {formatRemaining(remaining)} 后再来。
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

      push(
        command,
        <span className={styles.hint}>
          {`未知命令：${command}\n输入 help 查看可用命令。`}
        </span>,
      )
    },
    [push],
  )

  return (
    <footer className={styles.footer} aria-label="终端彩蛋">
      <div className={styles.output}>
        {entries.map((entry) => (
          <div key={entry.id}>
            <p className={styles.echo}>{entry.command}</p>
            {entry.node}
          </div>
        ))}
      </div>

      <form
        className={styles.prompt}
        onSubmit={(event) => {
          event.preventDefault()
          run(input)
          setInput('')
        }}
      >
        <label className={styles.label} htmlFor="terminal-input">
          gu@with-gu:~$
        </label>
        <input
          id="terminal-input"
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="help"
          autoComplete="off"
          spellCheck={false}
          aria-describedby="terminal-hint"
        />
        <span id="terminal-hint" className="sr-only">
          输入 help 查看可用命令
        </span>
      </form>
    </footer>
  )
}
