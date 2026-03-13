/**
 *  收藏
 */
export interface Collection {
  /** 分类 */
  category: 'figure' | 'e-product'
  /** 名称 */
  name: string
  /** 副标题 */
  subtitle: Date
  /** 描述 */
  description: string
  /** 图片 */
  picture: {
    url: string
  }
  /** 详情 */
  detail: {
    url: string
  }
}
