# 改进 & 使用/测试总结（lite 专用）

本文档概述了近期对于 lite 版改造的所有关键变更，以及如何验证功能正常。可作为开发人员或运维的参照。

## 核心改动

1. **新增 DolphinDB 代理接口**
   - 路径：`/api/dolphindb/quotes.js`、`iv.js`、`positions.js`
   - 支持 GET 与 POST，自动将 `DOLPHINDB_API_KEY` 加入 Authorization 头。
   - POST 通过 JSON body 原样转发，允许复杂查询。

2. **前端客户端封装**
   - `src/services/dolphindb.ts` 提供 `fetchQuotes`, `fetchIV`, `fetchPositions`。
   - 所有前端访问改为使用此封装，便于未来切换源。

3. **轻量仪表盘与页面**
   - `public/lite-dashboard.html/js`: 静态测试页面，快速浏览数据与 AI 结果。
   - 包含自定义 JSON 查询输入框以及云 AI 分析调用逻辑。

4. **云 AI 分析结构化输出**
   - 新建 `api/ai/analyze_structured.js`，返回 `{ provider, parsedOk, parsed, raw }`。
   - 增加 prompt 投诉，强制 LLM 仅返回特定 JSON schema。
   - 旧 `/api/ai/analyze.js` 保留为简单文本版本供兼容。

5. **面板组件**
   - 新增五个组件：`MarketLitePanel`, `IVLitePanel`, `PositionsLitePanel`, `NewsMonitorPanel`, `AIAnalysisPanel`。
   - 在 `panel-layout.ts` 中注册，且在 `finance` 和 `full` 变体的 `DEFAULT_PANELS` 中加入默认启用配置。

6. **文档与配置**
   - `.env.example` 添加 DolphinDB 和 AI key 说明。
   - README 与 README_zh.md/README_zh_complete.md 增加 Lite 说明与快速上手。
   - 增加脚本 `scripts/test-dolphindb-query.js` 用于模拟复杂 POST 查询。

7. **国际化**
   - 在英文 locale 文件中加入所有新面板的字符串。

## 使用/测试步骤

1. **准备环境**
   - `.env.local` 填入 `DOLPHINDB_API_URL` 等。
   - 可选：`OPENROUTER_API_KEY` 或 `GROQ_API_KEY` 用于云 AI。

2. **启动**
   ```bash
   npm install
   npm run dev
   ```
   打开浏览器访问 `/lite-dashboard.html` 或主页面查看新面板。

3. **验证 API**
   - 在浏览器侧打开开发者控制台，检查 `/api/dolphindb/quotes` 等返回正常数据。
   - 使用 POST body 执行复杂查询。

4. **脚本测试**
   ```bash
   node scripts/test-dolphindb-query.js
   ```
   输出应包含 HTTP 状态和部分结果字符串。

5. **人工检查**
   - Lite 仪表盘应显示：行情统计、IV 表格、持仓表、新闻列表、AI 分析结果。
   - AI 分析结果应将 JSON 解析并显示机会与风险列表。
   - 若云 AI 未配置，则前端应降级进入本地启发式分析。

6. **桌面版**
   - `npm run tauri dev` 启动后，确认上述面板在桌面应用中同样可见并刷新正常。

7. **面板配置**
   - 在 Settings → Panels 中可启/禁上述面板或调整显示顺序。
   - `finance`/`full` variant 下默认启用，其他 variant 需要手动勾选。

8. **故障排查**
   - 检查 Node/浏览器控制台日志。
   - 确认 `.env.local` 值被正确读取（重启服务器）。
   - 对于云 API 失败，可在 `/api/ai/analyze_structured.js` 中查看原始 `raw` 字段。

## 后续维护注意

- 若更改面板 id 或路径，记得同时更新 `DEFAULT_PANELS`、i18n 字符串和 `scripts/test-dolphindb-query.js` 示例体。
- 重构 DolphinDB 代理时注意保留 POST 支持，否则复杂查询会中断。
- AI prompt 可随时优化，但请保持输出符合指令 schema，否则前端解析失败。

---

此文档随项目演进更新，可供团队成员快速了解 Lite 版的技术变更与验证步骤。