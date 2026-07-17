<!-- 一旦我所属的文件夹有所变化，请更新我。 -->

# scripts/

Node CLI：编译、Studio、CDP 注入、导入导出与测试。  
默认不依赖第三方 npm 包。  
变更脚本后同步更新本文件与根 `ARCHITECTURE.md`。

| 名字 | 地位 | 功能 |
|------|------|------|
| `theme-core.mjs` | 核心库 | brief 规范化、CSS 生成、包校验 |
| `doctor.mjs` | 体检入口 | 检查 Node / Cursor / CDP |
| `interview.mjs` | 访谈入口 | 一轮/多轮确认 → brief |
| `try.mjs` | 试用入口 | QA profile 一键应用 |
| `list-themes.mjs` | 列表入口 | 查看本地主题 |
| `switch-theme.mjs` | 切换入口 | 快速切主题 / 恢复 |
| `gallery-server.mjs` | 画廊服务 | HTML 预览选主题 |
| `compile-theme.mjs` | 编译入口 | brief → themes/ |
| `studio-server.mjs` | Studio 服务 | HTML 工作台 + handoff |
| `start-theme.mjs` | 应用入口 | 启动 Cursor CDP + watcher |
| `runtime.mjs` | 注入守护 | watch/verify/remove/截图 |
| `restore-theme.mjs` | 恢复入口 | 停 watcher、清注入 |
| `export-theme.mjs` | 导出 | 生成 `.cursor-theme` |
| `import-theme.mjs` | 导入 | 安全解包 |
| `self-test.mjs` | 离线测试 | 编译与安全断言 |
| `studio-protocol-test.mjs` | 协议测试 | Studio 提交 JSONL |
