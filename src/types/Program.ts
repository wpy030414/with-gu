/**
 * 节目
 */
export interface Program {
  /** 名称 */
  name: string
  /** 译名 */
  translatedName?: string
  /** 原始歌手 */
  originalSinger: string
  /** 发行日期 */
  releaseDate: Date
  /** 链接 */
  urls: Map<string, string>
}
