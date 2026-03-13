import type { Theme } from '@/types/Theme'

/**
 * 应用配置
 */
export interface AppOption {
  // 必选项

  /** 持有者 */
  owner: string
  /** 社交链接 */
  socialLinks: {
    link: string
    icon: string
    name?: string
  }[]
  /** 数据源 */
  dataSource: string

  // 功能配置项

  /** 门户功能。所有成员隐式地为真 */
  portalFunctions?: {
    blogs?: boolean
    pictures?: boolean
    projects?: boolean
  }

  /** 核心功能。所有成员隐式地为真 */
  coreFunctions?: {
    blog?: boolean
    galary?: boolean
    museum?: boolean
    project?: boolean
  }

  /** 底部功能。所有成员隐式地为真 */
  bottomFunctions?: {
    shrine?: boolean
    easterEgg?: boolean
    support?: {
      name: string
      link: string
    }[]
  }

  /** 全局功能 */
  global: {
    theme: Theme
    backgroundMusic?: string
  }

  // 可选项

  /** 核心功能中的“项目”的名称 */
  projectName?: string
  /** 备案信息 */
  icpInfo?: string
}
