import { ASCII_POOL, DEFAULT_POOL, resolvePool } from './charset'

/**
 * 等宽栅格度量
 *
 * 两件事必须**在字体就绪之后**才能做对：
 *
 * 1. 量出单个半角字符的 advance 宽度（供画外标注层定位用）。
 * 2. 判断字体是否真的覆盖了方块/制表符 —— 缺字时它们会回落到系统字体，
 *    列宽随之改变，整个栅格就错位了。
 *
 * FOUT 期间量到的都是**回退字体**的宽度，所以测量必须门控在
 * `document.fonts.ready` 之后。
 */

export interface CellMetrics {
  /** 单个半角字符的 advance 宽度（px） */
  readonly cellWidth: number
  /** 行盒高度（px） */
  readonly cellHeight: number
  /** 实测后决定的字符池 */
  readonly pool: string
}

const SAMPLE = 64

/**
 * 测量失败时的保守取值。
 * 字符池取纯 ASCII —— **宁可朴素，不可错位**。
 */
const FALLBACK: CellMetrics = {
  cellWidth: 9.6,
  cellHeight: 20,
  pool: ASCII_POOL,
}

let cached: CellMetrics | null = null

function createProbe(text: string): HTMLSpanElement {
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.position = 'absolute'
  probe.style.left = '-9999px'
  probe.style.top = '0'
  probe.style.whiteSpace = 'pre'
  probe.style.pointerEvents = 'none'
  probe.style.fontFamily = 'var(--font-mono)'
  probe.style.fontSize = 'var(--cell-size)'
  probe.style.lineHeight = 'var(--cell-line-height)'
  // 连字会改变字宽，测量时必须与实际渲染一致地关掉
  probe.style.fontVariantLigatures = 'none'
  probe.style.fontFeatureSettings = '"liga" 0, "clig" 0, "dlig" 0, "calt" 0'
  probe.textContent = text
  return probe
}

export async function measureCellMetrics(): Promise<CellMetrics> {
  if (cached) return cached

  if (typeof document === 'undefined' || !document.body) return FALLBACK

  const asciiProbe = createProbe('M'.repeat(SAMPLE))
  const extendedProbe = createProbe('░'.repeat(SAMPLE))

  document.body.append(asciiProbe, extendedProbe)

  try {
    // 字体未就绪时量到的是回退字体的宽度 —— 必须等
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (fonts && typeof fonts.ready?.then === 'function') {
      await fonts.ready
    }

    const asciiRect = asciiProbe.getBoundingClientRect()
    const extendedRect = extendedProbe.getBoundingClientRect()

    const asciiWidth = asciiRect.width / SAMPLE
    const extendedWidth = extendedRect.width / SAMPLE

    cached = {
      cellWidth: asciiWidth > 0 ? asciiWidth : FALLBACK.cellWidth,
      cellHeight: asciiRect.height > 0 ? asciiRect.height : FALLBACK.cellHeight,
      pool: resolvePool(asciiWidth, extendedWidth),
    }

    return cached
  } catch {
    return FALLBACK
  } finally {
    asciiProbe.remove()
    extendedProbe.remove()
  }
}

/** 同步取用已测得的度量；尚未测量过则返回保守默认值 */
export function currentCellMetrics(): CellMetrics {
  return cached ?? FALLBACK
}

/** 默认字符池 —— 未测量时使用 */
export const FALLBACK_POOL = DEFAULT_POOL

/** 测试用：清掉缓存 */
export function resetCellMetrics(): void {
  cached = null
}
