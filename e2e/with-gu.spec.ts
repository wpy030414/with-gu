import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * E2E 覆盖的是**用户旅程**，不是代码行。
 *
 * 两条纪律：
 * 1. 等待**状态属性**（`data-reveal-state`），绝不用 `waitForTimeout`。
 *    Playwright 的断言自带重试，等时间只会制造 flaky。
 * 2. 不依赖真实时序的地方一律不依赖 —— 动画的确定性由单测（手动时钟）
 *    和 director 的注入式 `advance()` 保证。
 */

/** 点击开机序列的 ENTER 进入正片 */
async function enterSite(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByRole('button', { name: /ENTER/ }).click()
}

/** 某个节点的字符画容器 */
function artOf(page: Page, id: string) {
  return page.locator(`li[data-milestone="${id}"] [data-reveal-state]`)
}

test.describe('开机序列', () => {
  test('自检日志完整，ENTER 后进入时间线', async ({ page }) => {
    await page.goto('/')

    const bootLog = page.getByRole('log')
    await expect(bootLog).toContainText('WITH-GU BIOS')
    await expect(bootLog).toContainText('MOUNTING /dev/heart')

    // 字标是字符画，最终会解码完成
    await expect(page.locator('[data-reveal-state]').first()).toHaveAttribute(
      'data-reveal-state',
      'done',
      { timeout: 20_000 },
    )

    await page.getByRole('button', { name: /ENTER/ }).click()

    await expect(page.getByRole('heading', { name: '门可罗雀的直播间' })).toBeVisible()
    await expect(page.getByRole('list')).toBeVisible()
  })
})

test.describe('滚动叙事', () => {
  test('七个节点齐备，且每幅字符画都会解码完成', async ({ page }) => {
    await enterSite(page)

    const cards = page.locator('li[data-milestone]')
    await expect(cards).toHaveCount(7)

    // 逐个滚过去。四种揭开顺序（wave / rain / dissolve / typewriter）
    // 分别落在不同节点上，这里一并覆盖。
    const ids = [
      'first-contact',
      'commission',
      'closer',
      'confession',
      'meeting',
      'incident',
      'nanjing',
    ]

    for (const id of ids) {
      const card = page.locator(`li[data-milestone="${id}"]`)
      await card.scrollIntoViewIfNeeded()

      // 等状态属性，而不是等时间
      await expect(artOf(page, id)).toHaveAttribute('data-reveal-state', 'done', {
        timeout: 20_000,
      })

      // 叙述文本必须是真实 DOM 文本，可被朗读与检索
      await expect(card.locator('time')).toBeVisible()
    }
  })

  test('字符画是渐进揭示的，不是一帧到位', async ({ page }) => {
    await enterSite(page)

    const art = artOf(page, 'first-contact')
    await page.locator('li[data-milestone="first-contact"]').scrollIntoViewIfNeeded()

    // 先看到 running，再等到 done —— 证明中间确实有过过程
    await expect(art).toHaveAttribute('data-reveal-state', 'running')
    await expect(art).toHaveAttribute('data-reveal-state', 'done', { timeout: 20_000 })
  })

  test('尾声给出在一起的天数，且为正整数', async ({ page }) => {
    await enterSite(page)

    const epilogue = page.getByRole('region', { name: '尾声' })
    await epilogue.scrollIntoViewIfNeeded()

    await expect(epilogue).toContainText('未来不可知，但我满心期待。')

    const days = await epilogue.locator('[class*="daysValue"]').innerText()
    expect(Number(days)).toBeGreaterThan(0)
    expect(Number.isInteger(Number(days))).toBe(true)
  })
})

test.describe('减弱动态效果', () => {
  test.use({ reducedMotion: 'reduce' })

  test('首屏即终态，内容完整可读', async ({ page }) => {
    await enterSite(page)

    // 不经过任何等待，字标就应该已经是完成的
    const boot = page.locator('[data-reveal-state]').first()
    await expect(boot).toBeVisible()

    const art = artOf(page, 'first-contact')
    await page.locator('li[data-milestone="first-contact"]').scrollIntoViewIfNeeded()
    await expect(art).toHaveAttribute('data-reveal-state', 'done')

    // 叙述依然完整
    await expect(page.locator('li[data-milestone="first-contact"]')).toContainText(
      '那是第一个给我打赏的人',
    )
  })
})

test.describe('页脚微终端', () => {
  test('help / cat LICENSE / fortune 三条命令都可用', async ({ page }) => {
    await enterSite(page)

    const input = page.getByLabel('gu@with-gu:~$')

    await input.fill('help')
    await input.press('Enter')
    await expect(page.getByText('可用命令：')).toBeVisible()

    await input.fill('cat LICENSE')
    await input.press('Enter')
    // 情书全文 —— 用 testid 精确定位，避免与 help 里的命令说明撞车
    await expect(page.getByTestId('license-output')).toContainText(
      '杏仁鹿与咕猫猫一生一世专属许可证',
    )

    await input.fill('fortune')
    await input.press('Enter')
    await expect(page.getByText(/【(大吉|中吉|小吉|末吉|凶)】/)).toBeVisible()
  })

  test('未知命令给出提示而不是静默失败', async ({ page }) => {
    await enterSite(page)

    const input = page.getByLabel('gu@with-gu:~$')
    await input.fill('rm -rf /')
    await input.press('Enter')

    await expect(page.getByText(/未知命令：rm -rf \//)).toBeVisible()
  })
})

test.describe('移动端', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('页面不出现横向滚动', async ({ page }) => {
    await enterSite(page)

    // 逐节点滚一遍，确认没有任何一幅字符画把页面撑破
    for (let i = 0; i < 7; i++) {
      await page.locator('li[data-milestone]').nth(i).scrollIntoViewIfNeeded()
    }

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }))

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
  })
})

test.describe('无障碍', () => {
  test('键盘可达，且无严重违规', async ({ page }) => {
    await page.goto('/')

    // 用键盘走完开机序列。
    // 字符画本身是「可聚焦的滚动区域」，所以 Tab 未必第一下就落在按钮上 ——
    // 这里如实遍历，而不是直接 focus() 走捷径。
    const enter = page.getByRole('button', { name: /ENTER/ })

    let reached = false
    for (let i = 0; i < 10 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await enter.evaluate((el) => el === document.activeElement)
    }
    expect(reached).toBe(true)

    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { name: '门可罗雀的直播间' })).toBeVisible()

    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )

    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
})
