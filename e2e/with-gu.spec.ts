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

  /* 等窗口的入场动画收势。
     这一帧不是可有可无的等待 —— 动画途中的 opacity 会让 axe 把整窗文字
     当成半透明色去算对比度（#ffab2e 被算成 #463010），凭空判出十几条
     color-contrast serious。等状态，不等时间。 */
  await expect(page.locator('[data-terminal-window]')).toHaveAttribute('data-enter-state', 'done')
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

    // 字体实测必须完成。池子降级为纯 ASCII 是允许的（字体缺字时的正确选择），
    // 但「没测出来」不行 —— 实测结果是整站栅格的前提，也是曾经
    // 让本地全绿、CI 全红的那个变量的来源，所以在这里明确断言它在。
    await expect(page.locator('html')).toHaveAttribute('data-char-pool', /^(default|ascii)$/)

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

test.describe('字符池降级', () => {
  /**
   * 回归用例，对应一次「本地全绿、CI 全红」的事故。
   *
   * 字体就绪后 `measureCellMetrics` 会把实测字符池灌回 `App` 的 state ——
   * 也就是**挂载之后**才发生的变化。当时这个变化会重启注册动画的 effect：
   * 注销旧演员、注册新演员（visible: false），而同步可见性的 effect 依赖没变、
   * 不会重跑，新演员永远等不到 setVisible(true)；导演发现无人可见便停表，
   * 字符画永远停在 data-reveal-state="running"。
   *
   * 复现需要两个条件同时成立，缺一不可，而它们在开发机上都不成立：
   *
   * 1. **实测判定要降级为纯 ASCII 池** —— 取决于这台机器装了什么字体；
   * 2. **实测要晚于动画开始** —— 冷字体缓存 + 慢机器的必然结果，
   *    开发机上字体早已进缓存，实测总是赶在动画前面完成。
   *
   * 所以这里把两个条件都造出来：伪造测量结果逼出降级，并拖慢字体让实测
   * 落在动画跑到一半的时候。这样任何机器上都能复现那台 CI runner。
   */
  test('字体实测晚于动画开始时，动画依然能跑到终态', async ({ page }) => {
    await page.addInitScript(() => {
      const original = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function (this: Element) {
        const rect = original.call(this)
        const text = this.textContent
        // 只对 measure 用的方块字符探针做手脚：让它量出来比实际宽两成
        if (text !== null && text.length === 64 && text.charCodeAt(0) === 0x2591) {
          return new DOMRect(rect.x, rect.y, rect.width * 1.2, rect.height)
        }
        return rect
      }
    })

    await page.route('**/*.woff2', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      await route.continue()
    })

    await page.goto('/')

    // 先确认「实测晚于动画开始」这个前提真的成立了 ——
    // 否则这条用例会退化成一条永远为真的空断言
    await expect(page.locator('[data-reveal-state]').first()).toHaveAttribute(
      'data-reveal-state',
      'running',
    )
    await expect(page.locator('html')).toHaveAttribute('data-char-pool', 'ascii')

    await expect(page.locator('[data-reveal-state]').first()).toHaveAttribute(
      'data-reveal-state',
      'done',
      { timeout: 20_000 },
    )
  })
})

test.describe('滚动叙事', () => {
  test('七个节点齐备，且每幅字符画都会解码完成', async ({ page }) => {
    /* 这条用例要**逐个等完七幅字符画**，本来就是全站最慢的一条；
       加上每个节点「先敲命令再输出」的那一秒，已经贴着 Playwright 默认的
       30 秒上限跑了。放宽三倍，别让它变成一条靠机器快慢决定生死的用例。 */
    test.slow()

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

test.describe('滚动驱动的会话', () => {
  /**
   * 每个节点是一段**会话**，不是一个预先摆好的版面：
   * `idle`（还没滚到）→ `typing`（正在敲命令）→ `output`（结果吐出来）。
   *
   * 这三条用例守的是「依次输入命令、输出结果」这件事本身 ——
   * 一旦退回「滚到就全都在那儿」，站子照样能跑，没有任何别的测试会报警。
   */
  test('进入时屏幕是空的：先敲标题那条命令，才轮到第一条节点', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /ENTER/ }).click()

    // 注意这里不等 enterSite 的窗口动画 —— 那 320ms 会吃掉本用例的观察窗口
    const section = page.locator('[data-section="timeline"]')

    // 标题那条命令先开口……
    await expect(section).toHaveAttribute('data-phase', 'typing')
    // ……此时第一条节点还没轮到它
    await expect(page.locator('li[data-milestone="first-contact"]')).toHaveAttribute(
      'data-phase',
      'idle',
    )

    // 标题吐完，才轮到它
    await expect(section).toHaveAttribute('data-phase', 'output')
    await expect(page.locator('li[data-milestone="first-contact"]')).toHaveAttribute(
      'data-phase',
      'typing',
    )

    // 而屏幕外的那些，一条都还没开始
    await expect(page.locator('li[data-milestone="meeting"]')).toHaveAttribute('data-phase', 'idle')
    await expect(page.locator('li[data-milestone="nanjing"]')).toHaveAttribute('data-phase', 'idle')
  })

  test('滚到之后：先敲命令，敲完才轮到输出', async ({ page }) => {
    await enterSite(page)

    const card = page.locator('li[data-milestone="meeting"]')
    await expect(card).toHaveAttribute('data-phase', 'idle')

    await card.scrollIntoViewIfNeeded()

    // 中间态必须真的存在 —— 少了它，「输入命令」就退化成「命令早就写好了」
    await expect(card).toHaveAttribute('data-phase', 'typing')
    await expect(card).toHaveAttribute('data-phase', 'output')
  })

  test('输出之前，结果与字符画都不露出来', async ({ page }) => {
    await enterSite(page)

    const card = page.locator('li[data-milestone="meeting"]')
    await card.scrollIntoViewIfNeeded()

    // 字符画的 t=0 帧（满屏乱码）在挂载时就写好了，所以必须靠 .art 的
    // visibility 挡住 —— 否则「滚到就有东西」当场漏底
    const art = card.locator('[data-reveal-state]')
    await expect(art).toBeHidden()

    await expect(card).toHaveAttribute('data-phase', 'output')
    await expect(art).toBeVisible()
  })
})

test.describe('终端窗口', () => {
  /**
   * 正片不是「铺在黑底上的一堆卡片」，而是**一台终端里的一个窗口**。
   * 这条用例守的就是这个结构本身 —— 它没有别的可测产物，
   * 一旦退回「长文档 + 卡片」的形态，沉浸感会静悄悄地消失而没有任何测试报警。
   */
  test('内容活在窗口里，滚动也发生在窗口里', async ({ page }) => {
    await enterSite(page)

    await expect(page.locator('[data-terminal-window]')).toBeVisible()
    await expect(page.locator('[data-terminal-window]')).toContainText('gu@with-gu: ~/timeline')

    // 判据一：**页面本身不滚动**。窗口是 fixed 的，文档不该有可滚动高度 ——
    // 一旦这里变成 true，说明窗口退化成了文档流里的长容器，边框会跟着内容滚走。
    const documentScrolls = await page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
    )
    expect(documentScrolls).toBe(false)

    // 判据二：内容确实超出了屏幕，所以滚动发生在窗口内部
    const overflow = await page.locator('[data-terminal-screen]').evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }))
    expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight)
  })

  test('滚到最深处，标题栏与提示符依然在窗口里', async ({ page }) => {
    await enterSite(page)

    await page.locator('li[data-milestone="nanjing"]').scrollIntoViewIfNeeded()

    await expect(page.locator('[data-terminal-window]')).toContainText('gu@with-gu: ~/timeline')

    // 用 toBeInViewport 而非 toBeVisible：要的就是「没被滚走」。
    // 标题栏要精确定位 —— 每个节点内部也有 <header>，裸 'header' 会命中复数。
    await expect(page.locator('[data-terminal-window] > header')).toBeInViewport()
    await expect(page.getByLabel('gu@with-gu:~$')).toBeInViewport()
  })

  test('命令输出落在屏幕末尾，而不是挤在底部命令行里', async ({ page }) => {
    await enterSite(page)

    const input = page.getByLabel('gu@with-gu:~$')
    await input.fill('help')
    await input.press('Enter')

    // 输出出现在窗口的屏幕上……
    const screen = page.locator('[data-terminal-screen]')
    await expect(screen.getByText('可用命令：')).toBeAttached()

    // ……并且提交后自动滚到了最新一行
    await expect(screen.getByText('可用命令：')).toBeInViewport()

    // 清屏之后屏幕里不该再有输出
    await input.fill('clear')
    await input.press('Enter')
    await expect(page.getByText('可用命令：')).toHaveCount(0)
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

    const { document: doc, screen } = await page.evaluate(() => {
      const el = document.querySelector('[data-terminal-screen]')
      return {
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        },
        screen: el
          ? { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }
          : { scrollWidth: 0, clientWidth: 0 },
      }
    })

    // 两个容器都要守住：
    // 文档 —— 窗口是 fixed 的，一旦它比视口宽，整页会横向滚；
    // 屏幕 —— 内容真正溢出的地方，窄屏上字符画最容易撑破的就是它。
    expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth)
    expect(screen.scrollWidth).toBeLessThanOrEqual(screen.clientWidth)
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

    // 窗口的入场动画必须已经收势，否则量到的是半透明的一帧（见 enterSite 的说明）
    await expect(page.locator('[data-terminal-window]')).toHaveAttribute('data-enter-state', 'done')

    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )

    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
})
