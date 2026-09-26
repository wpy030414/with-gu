# ARCHITECTURE — 咕鹿小屋纪念站

## 系统概述

零后端单页应用。构建产物是纯静态文件，部署到 GitHub Pages。

```
┌──────────────────────────────────────────────────────────┐
│  浏览器                                                   │
│                                                          │
│  App                                                     │
│   ├── BootScreen ──────┐                                 │
│   └── Timeline / Epilogue / TerminalFooter             │
│                        │                                 │
│                        ▼                                 │
│  components/  纯展示，不持有循环                          │
│                        │  useCharAnimation               │
│                        ▼                                 │
│  hooks/       React 绑定层                               │
│                        │  register / setVisible          │
│                        ▼                                 │
│  engine/director   唯一 rAF · 优先级预算 · 降级策略       │
│                        │  每帧调用                        │
│                        ▼                                 │
│  engine/ 纯函数：rng · grid · reveal · render · measure   │
└──────────────────────────────────────────────────────────┘
```

**一条铁律**：`src/engine/` 里除 `director.ts` 与 `measure.ts` 外，全部是零 DOM 的纯函数。
它们不碰 React、不碰 rAF、不读全局时间 —— 因此可以在 jsdom 之外被穷举测试。

## 核心模块

| 模块 | 职责 |
|---|---|
| `engine/rng.ts` | 种子化 PRNG（mulberry32）与无分配整数 hash。全站禁用 `Math.random()` |
| `engine/charset.ts` | 随机字符池；按实测宽度降级为纯 ASCII 的保护 |
| `engine/grid.ts` | ASCII 栅格化：缩进剥离、行补齐、东亚宽度、列→字符下标换算 |
| `engine/reveal.ts` | **解码调度**。四种揭开顺序退化为同一个纯函数 `decodeProgressAt` |
| `engine/render.ts` | 分层渲染：亮层（已解码）与暗层（未解码）的互补划分 |
| `engine/director.ts` | **全局动画导演**。唯一 rAF、优先级预算、可见性、时间 clamp、降级 |
| `engine/measure.ts` | 字体就绪门控的栅格度量（cellWidth / cellHeight / 字符池） |
| `engine/dates.ts` | 结构化日期与本地时区构造，避免 UTC 解析错位 |
| `engine/generators.ts` | 程序化字符画：星空、行程条 |
| `hooks/useCharAnimation.ts` | 把上述一切接到 React 生命周期，并写 DOM |
| `hooks/useMediaQuery.ts` | `useSyncExternalStore` 读取媒体查询（首帧即正确） |
| `hooks/useInView.ts` | IntersectionObserver 封装 |
| `hooks/useElapsedDays.ts` | 在一起的天数，每 60 秒订阅一次时钟 |
| `art/milestones.ts` | 八幅手工字符画（含启动字标） |
| `content/*` | 剧情数据：时间线、台词池、御神签 |

## 字符解码引擎（本项目的心脏）

### 问题

要做出「随机字符逐渐解码成字符画」的效果，需要回答：某一帧里，**哪些格已经解码了**。

### 关键洞见

**「哪些格子已解码」是数据，不是几何。** 一旦认清这点，四种揭开顺序
（从左到右 / 从上到下 / 随机散点 / 阅读顺序）就退化成同一个函数：

```ts
decodeProgressAt(index, cols, rows, mode, seed) -> [0, 1]
```

渲染层因此完全不需要知道顺序是什么。顺序只影响这个纯函数的返回值。

### 渲染：两层 `<pre>` 互补划分

```
┌─────────────────────────────────────────────┐
│ <pre> 亮层：已解码格填目标字符，其余空格      │ ← 单调递增 · 有辉光
│ <pre> 暗层：只在未解码格画乱码，其余空格      │ ← 每帧变 · 无辉光 · 面积递减
└─────────────────────────────────────────────┘
```

两点必须守住：

1. **互补划分**，而不是两层都画满靠 z-order 叠。字符之间有空隙，画满的话乱码会从字形缝隙
   里透出来 —— 结果是「脏」而不是「亮」。
2. **亮层单调递增**。已解码集合只增不减，因此只在**真的解码了新格**时才重写 DOM。
   这把重绘频率从 60Hz 降到十几 Hz，是 `text-shadow` 辉光成本可接受的前提。

### 时间推进

```ts
// ✗ 后台标签页 rAF 完全停止，回来时 elapsed 已是几十秒 → 动画瞬间跳到终态
const elapsed = now - startTime

// ✓ 累积 delta 并 clamp
const dt = Math.min(MAX_DELTA_MS, Math.max(0, now - last))
elapsed += dt
```

### 导演的优先级预算

`MAX_ACTIVE_ACTORS = 3`。每帧只推进优先级最高的至多三个演员，其余**保留各自进度**
（`elapsed` 属于演员而非导演，所以「暂停」就是「不调用 tick」）。

离开视口 → 暂停且保留进度；回到视口 → 从原处续上，不重播。

## 数据流

```
content/timeline.ts
      │  Milestone（纯数据）
      ▼
MilestoneCard
      │  art + mode + durationMs + seed
      ▼
AsciiArt ──useInView──▶ play
      │                  │
      │                  ▼
      │            useCharAnimation ──register──▶ director
      │                  │                          │ tick(dt, noiseFrame)
      │                  │◀─────────────────────────┘
      │                  ▼
      │        decodedMask() → renderBrightLayer / renderNoiseLayer
      │                  │
      ▼                  ▼
  两个 <pre>.textContent（绕过 React 直接写）
```

## 外部系统

| 系统 | 用途 | 依赖程度 |
|---|---|---|
| GitHub Pages | 静态托管 | 强（唯一运行时依赖） |
| GitHub Actions | 构建、测试、部署 | 强 |
| Google Fonts（经 fontsource 自托管） | 等宽字体 | **已消除** —— 字体随构建打包，不请求外部 CDN |
| 任何后端 / 数据库 / 统计 | — | 无 |

## 重要技术边界

1. **字符画只能纯半角 ASCII**。fontsource 按 unicode-range 分片，`latin` 分片不含制表符与
   方块元素，用它们会回落到系统字体并改变列宽 —— 整幅画错位。见 ADR-002。
2. **中文不进栅格**。CJK 是 1em 全角，`<pre>` 按字符数而非列数排版。
   需要中文标注时用 `grid.ts` 的 `columnToIndex` 在画外单独定位。
3. **`<pre>` 不传 children**。React 只 diff 它管理的 DOM；我们直接写 `textContent`，
   React 一旦也写就会互相覆盖。
4. **`CNAME` 必须在 `public/`**。放在仓库根目录 Vite 不会拷贝进 `dist/`，
   部署后自定义域名会失效。
