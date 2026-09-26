# AGENTS.md

给在本仓库工作的 Agent 的快速定位。

## 概述

`with-gu` 是杏仁鹿与咕猫猫的相遇纪念站：一个 React 19 单页静态站点，
用 CRT 终端风格与随机字符解码动画呈现一条七节点的恋爱时间线。

## 边界与范围

**范围内**

- 终端窗口叙事：正片整体活在一个固定的终端窗口里（标题栏与命令行常驻，
  内容在窗口内部滚动），顺序为 开机序列 → 七个时间线节点 → 尾声 → 命令行
- 终端视觉：琥珀色字符、扫描线、随机字符解码动画
- 无障碍：减弱动态效果、键盘可达、屏幕阅读器可朗读、axe 无严重违规
- 静态部署到 GitHub Pages

**非目标（明确排除）**

- ❌ 任何后端、数据库、用户系统、评论、统计
- ❌ 路由（单页滚动，**刻意不引入 react-router**）
- ❌ 照片与音视频素材（字符画全部手工绘制）
- ❌ 多语言（仅中文）
- ❌ 在 ASCII 栅格内混排中文或 emoji

## Agent 操作指南

### 全局规则

1. **内容与表现分离**。所有文案、日期、签名只写在 `src/content/`，组件不得内联剧情文本。
2. **引擎层保持零 DOM**。`src/engine/` 下的一切必须是纯函数或纯状态机，可在 jsdom 之外单测。
   唯一例外是 `director.ts`（它需要 rAF）与 `measure.ts`（它需要真实字体度量）。
3. **禁止 `Math.random()`**。动画随机一律走 `src/engine/rng.ts` 的种子化 PRNG —— 可复现性
   是截图基线、bug 复现与 E2E 断言的前提。
4. **字符画必须纯半角 ASCII**。用制表符 `─│┌┐`、方块 `█░`、中文或 emoji 都会让整幅画错位
   （原因见 `docs/DECISIONS.md` 的 ADR-002）。有测试守住这条线。
5. **`<pre>` 元素对 React 永远不传 children**。字符动画直接在 `textContent` 上写，
   React 一旦也去写就会互相覆盖。
6. **不要每帧 setState**。动画进度放 `useRef` / 闭包，唯一的 `setState` 是完成时的 `settled`。
7. **等待用状态属性而非时间**。E2E 里用 `data-reveal-state`，绝不使用 `waitForTimeout`。
8. **提交分段**。一个逻辑单元一次提交；不带 `Co-authored-by` 尾注。

### 改动前请先读

- 动视觉/动画 → `docs/ARCHITECTURE.md` 的「字符解码引擎」一节
- 动无障碍 → `docs/DECISIONS.md` 的 ADR-009
- 动布局或滚动容器 → `docs/DECISIONS.md` 的 ADR-014（页面本身不滚动，
  滚动只发生在窗口的屏幕 `[data-terminal-screen]` 里）
- 加依赖 → `docs/DECISIONS.md` 的 ADR-005（本项目刻意保持零动画依赖）

## 目录速查

| 路径 | 职责 |
|---|---|
| `src/engine/` | **零 DOM 的纯逻辑层** —— 随机、栅格、解码调度、分层渲染、导演、度量、日期、生成器 |
| `src/hooks/` | React 绑定层 —— 把引擎接到组件生命周期上 |
| `src/art/` | 手工字符画（唯一允许出现「图形」的地方） |
| `src/content/` | 剧情数据 —— 时间线、台词池、御神签 |
| `src/components/` | 纯展示组件，不持有循环 |
| `src/styles/` | 设计令牌、基础样式、CRT 覆盖层 |
| `tests/unit/` | Vitest。覆盖率主战场是 `engine/` |
| `e2e/` | Playwright 用户旅程 |
| `docs/` | PRD / ARCHITECTURE / DECISIONS / specs |
| `public/` | 原样拷贝进 `dist/` 的静态文件（**含 CNAME**） |
