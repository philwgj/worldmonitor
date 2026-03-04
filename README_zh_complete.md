# World Monitor 中文版说明（完整版）

World Monitor 是一个实时全球情报仪表盘，集成 AI 处理、交互地图和海量 RSS 源，适用于地缘政治、市场、科技等多种场景。本文件为英文 `README.md` 的完整中文翻译，包含功能介绍、部署步骤、开发准则等。

> **提示**：本文档体积较大，主要面向希望深入了解项目的读者。若只需快速上手，请参见 `README_zh.md` 中的 Lite 版部分。

---

## 项目定位

World Monitor 解决以下常见问题：

- 数据来源分散、更新缓慢
- 缺乏地理可视化与情境
- 信息过载导致决策困难
- 云 AI 成本高且受限
- 多平台分离造成维护难度

公司/个人可以通过本系统在浏览器或桌面上获得：

- 高频新闻聚合，170+ 个 RSS 分类订阅
- 交互式 2D/3D 地图，45+ 数据图层
- AI 自动摘要、情报推演与情感分析
- 本地 LLM 支持，无需 API key
- 简化数据面板（书签、轻量行情、IV、持仓等）
- 一套代码同时输出 Web、PWA、Tauri 桌面应用


## 快速特性概览

1. **多语言支持**：21 种界面语言，包含 RTL 排版，自动根据用户语言加载新闻源。
2. **双引擎地图**：Three.js 3D Globe + deck.gl 平面地图，开关自由。
3. **AI 概览**：全图 `World Brief` 摘要，使用本地或云 LLM，带缓存与降级机制。
4. **Headline Memory**：客户端语义存储与检索，基于 ONNX 模型的 RAG 系统。
5. **市场与金融套件**：股票、期货、外汇、加密、宏观雷达等专业面板。
6. **桌面版（Tauri）**：离线地图、高性能渲染、本地 API Sidecar、系统托盘支持。
7. **全变体部署**：四个网站（world, tech, finance, happy）由一个代码库自动打包。

详细特性请阅英文 README，节省篇幅。

---

## 安装与本地开发

1. 克隆仓库并进入目录：
   ```bash
   git clone https://github.com/koala73/worldmonitor.git
   cd worldmonitor
   ```
2. 复制环境模板并填入 API key：
   ```bash
   cp .env.example .env.local
   # 根据需要编辑 .env.local
   ```
3. 安装依赖并启动 Vite 开发服务器：
   ```bash
   npm install
   npm run dev
   ```
   访问 `http://localhost:3000` 查看主应用，或 `http://localhost:3000/lite-dashboard.html` 查看轻量版仪表盘。 
4. 桌面开发：
   ```bash
   npm run tauri dev
   ```
   需要提前安装 Tauri CLI 与 Rust 工具链。


## 配置说明

环境变量分为多个类别：

- DolphinDB 与自定义 API（Lite 数据源）
- AI 提供商（GROQ、OpenRouter，本地 Ollama）
- Redis 缓存、金融、卫星、冲突等第三方服务的 Key
- Telegram、Railway 中继等高级功能

详见 `.env.example` 文件中的注释。


## 轻量版扩展功能

在最新改进中我们新增了：

- `/api/dolphindb/quotes`, `/iv`, `/positions` 代理，可正向 GET/POST 至任意 DolphinDB 后端。
- 前端 `src/services/dolphindb.ts` 抽象 API 调用。
- 公共页面 `public/lite-dashboard.html` 与脚本，便于快速验证数据与 AI 分析。
- 新增五个可嵌入主 UI 的轻量 panel：
  - Lite Market、Implied Volatility (Lite)、Positions (Lite)
  - News Monitor、AI Analysis
- AI 分析现在返回结构化 JSON，便于前端渲染与后续逻辑。
- 配置模板和 README 增加相应说明。

面板代码位于 `src/components/*LitePanel.ts`，所有入口已在 `panel-layout.ts` 注册，并且默认在 `finance` 与 `full` 变体中启用。


## 使用与测试指南

### 基础功能验证

1. 启动开发服务器后打开主页面，确认轻量面板出现在仪表盘中。
2. 在 `lite-dashboard.html` 中：
   - 点击“刷新”按钮查看所有数据加载正常。
   - 在自定义查询框中粘贴 JSON 体并点击“Run”，观察返回内容。
3. 若缺少 DolphinDB 环境，可使用任何简单的 JSON server 模拟并将 `DOLPHINDB_API_URL` 指向它。

### DolphinDB POST 测试脚本

```bash
DOLPHINDB_API_URL=http://localhost:3000/api/dolphindb/quotes \
  node scripts/test-dolphindb-query.js
```
脚本默认发送示例查询体并打印状态与前 2000 字符响应。

### AI 分析流程

1. 在 `api/ai/analyze_structured.js` 中可调整 `systemPrompt` 内容，规定输出 JSON 模式。
2. 在 `lite-dashboard.html` 或 `AIAnalysisPanel` 点击“AI 分析”按钮触发请求。
3. 若未配置任何云 API key，接口会返回 503，前端继而使用本地启发式备份逻辑。

### 本地 LLM 测试（可选）

- 安装并运行 Ollama/LM Studio，于 `.env.local` 中设置 `OLLAMA_API_URL`。
- 前端在 Settings → AI 设置中可选择本地模型。

### Tauri 桌面测试

- 确保 `npm run tauri dev` 能成功启动，主界面加载与浏览器一致。
- 在桌面版调试 GitHub 上观察 Node sidecar 日志输出。

---

## 后续维护与贡献

1. 请在修改新增面板后同步更新本地 i18n 文本与 `DEFAULT_PANELS` 配置。
2. 对 API 进行改动时记得更新 `server/` 目录中的路由与类型定义。
3. PR 时附带简短变更说明，若涉及跨组件代码，请添加对应单元测试。

---

## 详细架构

为了便于浏览，我把结构分成 **前端 (UI/逻辑)**、**后端 API**、**数据/脚本**、**测试**、**配置/文档** 等几大类；每一项又列出包含此功能的关键文件或子目录。  

> ⚠️ 由于项目非常庞大，下面只是高层次概览；具体实现可在对应目录里进一步追踪。

---

## 🧠 1. 前端 — 应用框架与客户端逻辑

### • 入口 & 上下文

- main.ts、index.ts —— 启动逻辑
- app-context.ts —— `AppContext` 状态接口
- `src/app/bootstrap/`、`event-handlers.ts`、`refresh-scheduler.ts` 等负责初始化、事件、定时刷新

### • 布局与面板管理

- panel-layout.ts —— 面板注册、拖拽、变体切换
- search-manager.ts、`country-intel.ts` 等辅助模块

### • UI 组件（面板库）

****
位于 components，包含 ~80 个 TS 文件，每个对应一个功能模块或面板：

```
AIAnalysisPanel.ts          MarketPanel.ts           UcdpEventsPanel.ts
NewsPanel.ts                GlobeMap.ts              StrategicRiskPanel.ts
MapContainer.ts             SatelliteFiresPanel.ts   TelegramIntelPanel.ts
Reactive “lite” 组件        CountryBriefPage.ts      + …  具体见目录列举
```

其中可分子模块：

- **情报 & 新闻**：`NewsPanel`, `GdeltIntelPanel`, `LiveNewsPanel`, `PositiveNewsFeedPanel`…
- **市场 & 经济**：`MarketPanel`, `MacroSignalsPanel`, `CommoditiesPanel`, `CryptoPanel`…
- **地图/地理**：`Map.ts`, `DeckGLMap.ts`, `GlobeMap.ts`, `MapPopup.ts`
- **地区/专题**：`CIIPanel`（国家不稳定指数）、`Conflicts`、`InvestmentsPanel`、`GulfEconomiesPanel`…
- **“快乐”变体**：`GoodThingsDigestPanel.ts`, `HeroSpotlightPanel.ts` 等
- **共享组件**：`Panel.ts`, `SearchModal.ts`, `VirtualList.ts`, `UnifiedSettings.ts` 等

### • 地图引擎与图层

- map-layer-definitions.ts（图层目录/元数据）
- globe-render-settings.ts、`map-layer-*` 服务
- DeckGLMap.ts + `GlobeMap.ts` 实现 flat/globe 双引擎
- 支持 45+ 数据层、区域预设、时区检测、URL 状态、触摸手势等

### • 本地化 & 文本

- locales — 21 个语言包
- i18n.ts 管理翻译函数
- RTL 支持在样式与布局中体现

### • AI 与智能服务

- `src/services/ai/` —— 包括摘要、翻译、Headline‑Memory、推理等
- `src/services/news‑context.ts`、`military‑surge.ts`、`investments‑focus.ts` 等
- 致力于本地 LLM（Ollama/LM‑Studio）与云备选

### • 配置与常量

- config（`feeds.ts`、`intel-sources.ts`、`defaults.ts` 等）
- `schema.ts`、`registerInterest.ts` 为类型/注册
- types 提供 TypeScript 类型定义

### • 通用工具

- utils 包括网络、缓存、DOM、日期格式、sanitizer 等
- workers 如 headline‑memory 嵌入处理

### • 桌面（Tauri）与 PWA 支持

- desktop-updater.ts、`src/src-tauri/` 相关代码
- `src/app/settings-main.ts` 等窗口间通信

---

## 🔌 2. 后端/API 层

位于项目根 api，每个 JS/TS 文件映射一个 HTTP 端点：

```
api/_cors.js            api/og-story.js      api/register-interest.js
api/ai/…                api/opensky.js       api/telegram-feed.js
api/geo.js              api/ais-snapshot.js  api/loaders-xml-wms-regression.test.mjs
```

- 公共中间件：`_cors.js`, `_rate-limit.js`, `_relay.js`
- 数据抓取与代理：`download.js`, `cache-purge.js`, `og-story.js`, `seed-health.js`…
- 智能/AI：ai 子目录，服务摘要、翻译、向量查询等
- 单元/集成测试：例如 _cors.test.mjs, `og-story.test.mjs`
- api 还含有各类异步 loader 和热点转发

### • Proto/类型合同

- proto 存放 Buf 定义，22 个服务契约有自动生成的客户端和 OpenAPI 文档
- `generated/` 目录承载代码生成输出（TypeScript 客户端）

---

## 📦 3. 数据 & 静态资源

- data：静态 JSON 文件，如 `gamma-irradiators.json`, `telegram-channels.json`
- public：前端静态资源（地图纹理、图标、HTML 示例、PWA manifest）
- scripts：辅助脚本（例如 `test-dolphindb-query.js` 等）

---

## 🧪 4. 测试

- E2E：e2e 包含 Playwright 规范（`*.spec.ts`）
- 单元：`api/*` 测试和前端目录中偶见测试脚本
- playwright.config.ts、tsconfig.json 为测试环境配置

---

## ⚙️ 5. 构建 & 配置

- TypeScript configs：tsconfig.json, tsconfig.api.json, `tsconfig.*`  
- 打包/运行脚本：vite.config.ts, Makefile, package.json, vercel.json
- 环境/变体控制：railpack.json, `live‑channels.html`, `playground‑settings‑*.html`

---

## 📚 6. 文档 & 其他

- docs：使用指南、部署文档、API 文档、社区推广、桌面配置等
- 根目录含 `README*`, `CHANGELOG*`, CONTRIBUTING.md, SECURITY.md…

---

### 🧩 小结

这个仓库是一套**跨平台情报仪表盘**，核心功能模块包括：

1. **地图引擎**（3D Globe / Deck.gl 平面）
2. **情报面板集合**（新闻、冲突、市场、投资、天气等 45+ 层）
3. **AI 智能服务**（摘要、预测、RAG、热点检测）
4. **多语言与本地化**（21 种语言+RTL）
5. **桌面应用**（Tauri + PWA）
6. **后台 API 与数据代理**（Node/Cloud Functions）
7. **配置、类型合同与文档**（proto、config 文件、docs）

每个模块在仓库中都有明确的目录和文件支撑，上述结构可作为理解与导航的“思维导图”。

> 💡 若需更细粒度的模块图，建议结合 README 中各功能节标题与 components 目录做进一步映射。
---

以上为完整中文版 README，可根据项目发展增补更多内容。欢迎复制到其他语言或作为内部文档使用。