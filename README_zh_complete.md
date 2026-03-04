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

以上为完整中文版 README，可根据项目发展增补更多内容。欢迎复制到其他语言或作为内部文档使用。