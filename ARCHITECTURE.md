<!-- 一旦我所属的文件夹有所变化，请更新我。 -->

# 根目录架构

可逆 CDP 主题工作室：Studio → brief → 编译 → 注入 Cursor workbench → 验证/恢复。  
不修改 Cursor 安装包；状态在 `~/Library/Application Support/CursorThemeStudio`。  
**变更后必须同步更新本文件与相关子目录 md。**

## 文件与目录

| 名字 | 地位 | 功能 |
|------|------|------|
| `README.md` / `README.zh-CN.md` | 根文档 | 安装使用与安全说明 |
| `ARCHITECTURE.md` | 根地图 | 本文件 |
| `SKILL.md` | Agent 契约 | Cursor Skill 工作流 |
| `package.json` | npm 元数据 | scripts / engines |
| `LICENSE` | 许可 | MIT |
| `.gitignore` | 工程忽略 | 日志/主题包/临时产物 |
| `.github/` | CI | 语法与自测 |
| `agents/` | Skill 元数据 | 展示名与默认提示 |
| `assets/` | 前端资产 | Studio、注入器、默认背景 |
| `references/` | 规范 | schema/设计/访谈/运行时/QA |
| `scripts/` | 可执行核心 | 体检、访谈、试用、编译、注入 |
| `themes/` | 主题产物 | 示例与编译输出 |
