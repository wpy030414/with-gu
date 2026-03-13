/**
 * 文章
 */
export interface Article {
  /** 标识码 */
  id: string
  /** 标题 */
  title: string
  /** 起笔日期 */
  date: Date
  /** 分类 */
  category: '主题长文章' | '随笔杂谈' | '评论' | '技术参考'
  /** Markdown 正文 */
  body: string
}
