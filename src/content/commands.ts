/**
 * 页脚微终端的文案
 *
 * 按 AGENTS.md 的全局规则 1，命令说明这类**剧情文案**不进组件，
 * 一律落在 `content/` —— 与 `timeline.ts`、`fortune.ts` 同一个理由：
 * 改文案时只翻一个目录，不必在 JSX 里大海捞针。
 */

/** 命令说明的逐行文本（等宽对齐，缩进即排版） */
export const COMMAND_HELP: readonly string[] = [
  '可用命令：',
  '  help          显示这份帮助',
  '  cat LICENSE   查阅《杏仁鹿与咕猫猫一生一世专属许可证》',
  '  fortune       抽一支御神签（含冷却）',
  '  clear         清屏',
]

/** 未知命令的提示 —— 绝不静默失败，否则输入框像是坏的 */
export function unknownCommand(command: string): string {
  return `未知命令：${command}\n输入 help 查看可用命令。`
}

/** 御神签冷却中 */
export function fortuneCooldownNotice(remaining: string): string {
  return `签筒尚在冷却，还请 ${remaining} 后再来。`
}

/**
 * 命令行提示符。
 *
 * 与 `styles/tokens.css` 的 `--shell-prompt` 是**同一个值**，必须一起改 ——
 * CSS 的 `content` 读不到 JS 常量，反之亦然，只能两边各留一份。
 * 用户身份与窗口标题的 `user -- -zsh` 保持一致。
 */
export const SHELL_PROMPT = 'user@with-gu:~$'
