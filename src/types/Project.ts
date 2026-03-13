/**
 * 项目
 */
export interface Project {
  /** 名称 */
  name: string
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
