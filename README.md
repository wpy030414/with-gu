# with-gu / 咕鹿小屋

杏仁鹿与咕猫猫的相遇纪念 —— 一个以 CRT 终端字符呈现的单页静态站点。

线上地址：<https://with-gu.xrl.im>

## 这是什么？

- **定位**：私人纪念站。记录一段自 2024 年 9 月开始的恋爱时间线，共七个节点。
- **解决的核心问题**：把一段私人记忆保存成**可长期静态托管、零后端、无外部服务依赖**的形式。

## 为什么存在？

原站基于 Vue 3.6-rc + Vuetify + three.js，站主判定其已无法维护。2026 年 9 月决定
**放弃复用、整体重写**，并把视觉语言从通用 Web 风格改为 CRT 终端风格 —— 因为后者的
「逐字符解码」质感，恰好适合表现「一段记忆被逐条读取出来」这件事。

## 如何安装和运行？

前置要求：Node `^20.19.0 || >=22.12.0`、pnpm 12。

```bash
pnpm install     # 国内可加 --registry=https://registry.npmmirror.com

pnpm dev         # 开发服务器
pnpm build       # 类型检查 + 生产构建（产物在 dist/）
pnpm preview     # 预览生产构建
```

验证：

```bash
pnpm type-check   # tsc --noEmit
pnpm lint         # oxlint
pnpm test         # vitest 单元测试
pnpm test:e2e     # Playwright 端到端测试（自动构建并起 preview）
```

首次跑 E2E 需要先装浏览器：`pnpm exec playwright install chromium`。

## 当前状态

- **阶段**：功能完整，已可部署
- **已知限制**：
  - 字符画全部为手工绘制的纯半角 ASCII，**不含照片**（站主明确选择）
  - 中文不进入 ASCII 栅格（全角占 2 列会破坏对齐），仅出现在叙述层
  - 命令行支持 `help` / `cat LICENSE` / `fortune` / `clear` 四条命令

## 核心技术

- **框架**：React 19 + TypeScript 7，Vite 8 构建
- **动画**：自研零依赖字符解码引擎（无 motion / 无 GSAP）
- **样式**：原生 CSS Modules + CSS 变量，无 UI 框架
- **测试**：Vitest（纯逻辑层）+ Playwright（用户旅程）
- **部署**：GitHub Actions → GitHub Pages，自定义域名 `with-gu.xrl.im`

详细结构见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)，
关键取舍见 [`docs/DECISIONS.md`](docs/DECISIONS.md)。
