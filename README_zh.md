# World Monitor（中文说明）

**实时全球情报仪表盘** — 一个集成 AI 的新闻聚合、地缘政治监控和基础设施追踪界面。

## 为什么使用 World Monitor？

| 问题 | 解决方案 |
|------|----------|
| 新闻散落在 100+ 个来源 | **统一仪表盘**，170+ 个精选 RSS 订阅，15 个分类 |
| 事件没有地理上下文 | **交互式地图**，45+ 可切换图层和国家风险热图 |
| 信息超载 | **AI 生成摘要**，焦点检测，本地 LLM 支持 |
| 付费 OSINT 工具昂贵 | **完全免费开源** |
| 依赖云端 AI | **本地运行 AI**（Ollama/LM Studio）或使用轻量版云接口 |
| 仅 Web 仪表盘 | **原生桌面应用**（Tauri） + 可安装 PWA 离线地图 |

（完整英文特性请参阅原 README）

---

## 快速上手（Lite 版）

轻量版面向期货/新闻监控用户，依赖您自己的 AI 与数据接口。

1. **环境变量**：创建 `.env.local`（或 `.env`），包括：
   ```dotenv
   DOLPHINDB_API_URL=https://你的-dolphindb-api.example
   DOLPHINDB_API_KEY=可选
   OPENROUTER_API_KEY=...
   # 或 GROQ_API_KEY
   ```
2. **安装并启动**：
   ```bash
   npm install
   npm run dev   # Vite 在 http://localhost:3000
   ```
3. **访问仪表盘**：
   - 精简版：`http://localhost:3000/lite-dashboard.html` 可直接查看行情、IV、持仓、新闻和 AI 分析。
   - 完整版：打开主应用，面板中可切换“轻量行情”、“隐含波动率 (Lite)”、“持仓 (Lite)”、“新闻监控”、“AI 分析”等。
4. **桌面(Tauri)**：安装 [Tauri 开发环境](https://tauri.app/v1/guides/getting-started/setup) 后运行：
   ```bash
   npm run tauri dev
   ```
   桌面应用会自动包含上述面板，并通过 sidecar 读取本地 env。

5. **测试 DolphinDB 查询**：
   ```bash
   DOLPHINDB_API_URL=http://localhost:3000/api/dolphindb/quotes \
     node scripts/test-dolphindb-query.js
   ```

---

## 主要操作面板

| 面板名称 | 功能 |
|----------|------|
| Lite Market（轻量行情） | 显示期货报价，按涨跌排序，统计成交量 |
| Implied Volatility (Lite)（隐含波动率） | 列出各合约的 IV |
| Positions (Lite)（持仓） | 显示实时账户持仓情况 |
| News Monitor（新闻监控） | 拉取指定 RSS 源的最新头条 |
| AI Analysis（AI 分析） | 根据新闻、报价、IV 和持仓输出机会/风险清单 |

这些面板在主界面默认启用，可通过“设置 → 面板”进行显示/隐藏和排序。


> **注意**：若需对 AI 输出做进一步定制，请调整逻辑或提示词（位于 `api/ai/analyze_structured.js`）。

---

如需完整中文文档或帮助，可翻阅项目中文文档或联系维护者。欢迎贡献翻译！