/**
 * vitest 全局启动文件。
 *
 * 只做两件事：加载 jest-dom 匹配器、安装 jsdom 缺失的浏览器 API。
 * 实际的 mock 实现与「手动触发」辅助函数都在 tests/helpers/dom.ts。
 */
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

import { resetDomMocks } from './tests/helpers/dom'

afterEach(() => {
  cleanup()
  resetDomMocks()
})
