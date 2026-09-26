import { useTerminalSession } from './TerminalSession'
import styles from './TerminalPrompt.module.css'

/**
 * 命令行提示符
 *
 * 常驻窗口底部（不在滚动的内容流里）—— 真终端里提示符永远等在最后一行，
 * 无论上面滚到了哪里。
 */
export function TerminalPrompt() {
  const { input, setInput, run } = useTerminalSession()

  return (
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
  )
}
