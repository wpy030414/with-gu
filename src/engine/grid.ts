/**
 * ASCII 栅格化
 *
 * 引擎的坐标系统：一副字符画被解析成 `rows × cols` 的等宽栅格。
 * 逐格解码、噪声层绘制、画外中文标注的定位，全部基于这套坐标。
 */

export interface AsciiGrid {
  /** 补齐后的行 —— 每行的显示宽度都等于 `cols` */
  readonly lines: readonly string[]
  readonly rows: number
  readonly cols: number
  /** 拼接后的文本，行间以 `\n` 分隔，可直接喂给 `<pre>` */
  readonly text: string
}

/**
 * 东亚全角字符判定 —— 这些码位在等宽排版中占 **2 列**。
 *
 * 注意：emoji 也在其列。它们宽度为 2，且部分平台渲染为彩色位图，
 * 因此**禁止进入栅格**（`hasFullWidthChar` 就是用来在测试里守住这条线的）。
 */
export function isFullWidth(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) || // 谚文字母
    (codePoint >= 0x2e80 && codePoint <= 0x303e) || // CJK 部首、标点
    (codePoint >= 0x3041 && codePoint <= 0x33ff) || // 假名、CJK 兼容
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK 扩展 A
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK 统一表意文字
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) || // 彝文
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // 谚文音节
    (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK 兼容表意
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) || // CJK 兼容形式
    (codePoint >= 0xff00 && codePoint <= 0xff60) || // 全角形式
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) || // emoji
    (codePoint >= 0x20000 && codePoint <= 0x3fffd) // CJK 扩展 B 及以后
  )
}

/** 字符串的显示宽度（以半角列为单位） */
export function displayWidth(text: string): number {
  let width = 0
  for (const ch of text) {
    width += isFullWidth(ch.codePointAt(0) ?? 0) ? 2 : 1
  }
  return width
}

/** 是否含全角字符 —— 用于在测试里守住「字符画内零中文」 */
export function hasFullWidthChar(text: string): boolean {
  for (const ch of text) {
    if (isFullWidth(ch.codePointAt(0) ?? 0)) return true
  }
  return false
}

/**
 * 剥掉所有非空行共有的最小缩进。
 *
 * 字符画以模板字符串书写时会被代码缩进带上一层前导空格，
 * 这里统一剥离**公共**部分 —— 相对缩进（画内部的层次）原样保留。
 */
function stripCommonIndent(lines: readonly string[]): string[] {
  let minIndent = Number.POSITIVE_INFINITY

  for (const line of lines) {
    if (line.trim() === '') continue
    const indent = line.length - line.trimStart().length
    if (indent < minIndent) minIndent = indent
  }

  if (!Number.isFinite(minIndent) || minIndent === 0) return [...lines]

  return lines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent)))
}

/**
 * 把一段字符画解析成栅格。
 *
 * 处理顺序：统一换行 → 剥离公共缩进 → 去掉首尾空行 → 逐行补齐到等宽。
 *
 * ⚠️ 栅格的「格」与「字符」是 **1:1** 的，这一点只在字符画为纯半角时成立。
 * 混入全角字符时补齐宽度依然正确（`displayWidth` 是宽度感知的），
 * 但逐格索引会错位 —— 所以有 `hasFullWidthChar` 在测试里守住这条线。
 */
export function buildGrid(art: string): AsciiGrid {
  const normalised = art
    .replace(/\r\n?/g, '\n')
    // 制表符的宽度依上下文而定，不能进栅格
    .replace(/\t/g, '  ')

  const stripped = stripCommonIndent(normalised.split('\n'))

  while (stripped.length > 0 && (stripped[0] ?? '').trim() === '') stripped.shift()
  while (stripped.length > 0 && (stripped[stripped.length - 1] ?? '').trim() === '') stripped.pop()

  const content = stripped.length > 0 ? stripped : ['']

  const cols = content.reduce((max, line) => Math.max(max, displayWidth(line)), 0)

  const lines = content.map(
    (line) => line + ' '.repeat(Math.max(0, cols - displayWidth(line))),
  )

  return { lines, rows: lines.length, cols, text: lines.join('\n') }
}

/**
 * 把「显示列号」换算成该行内的字符下标。
 *
 * 供画外中文标注层定位使用：标注锚在第 N 列时，用它在行内找到插入点。
 */
export function columnToIndex(line: string, column: number): number {
  let width = 0
  let index = 0

  for (const ch of line) {
    if (width >= column) return index
    width += isFullWidth(ch.codePointAt(0) ?? 0) ? 2 : 1
    index += ch.length
  }

  return line.length
}
