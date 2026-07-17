<!-- input: 仓库源码与用户环境（macOS + Cursor.app） -->
<!-- output: 中文安装/使用/安全说明 -->
<!-- pos: 中文根文档；与 README.md 同步维护 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

[English](README.md)

面向官方 **Cursor** 桌面应用的交互式主题设计工具（Skill + CLI）：引导生成、预览、应用、验证、导入导出与安全恢复。

对标 [Way-To-AGI/codex-theme-studio](https://github.com/Way-To-AGI/codex-theme-studio)，通过本机回环 CDP 注入，**不修改 `Cursor.app` / `app.asar`**。

> **维护约定：** 任何功能、架构或写法变更，工作结束后必须更新本根文档，以及相关目录下的子文档。

## 主要能力

- 四步 HTML 主题工作台
- 浅色/深色与多种设计方向
- 协调 VS Code / Cursor 语义色、圆角、阴影、表面
- 本地背景图 + 阅读遮罩
- 受信任、不可点击的装饰模板与碰撞检测
- CDP 可逆注入
- `.cursor-theme` 安全导入导出
- 内置 `aurora-focus` 示例主题

## 环境

- macOS 12+
- Cursor 安装于 `/Applications/Cursor.app` 或 `~/Applications/Cursor.app`
- Node.js 22+

## 快速开始

```bash
cd ~/Desktop/cursor-theme-studio
node scripts/self-test.mjs
node scripts/compile-theme.mjs --brief themes/aurora-focus/brief.json
```

### 推荐：隔离 profile 应用（不影响当前正在用的 Cursor）

```bash
node scripts/start-theme.mjs \
  --theme aurora-focus \
  --profile-path "$HOME/Library/Application Support/CursorThemeStudio/qa-profile" \
  --port 9336 \
  --screenshot /tmp/cursor-theme-verify.png
```

### 恢复

```bash
node scripts/restore-theme.mjs
```

### 打开设计工作台

```bash
node scripts/studio-server.mjs --wait-for-submit
```

## 安全

- CDP 只绑 `127.0.0.1`
- 不改官方安装包
- 未授权不重启主 Cursor；QA 请用 `--profile-path`
- 拒绝危险 CSS / 远程资源 / 超大主题包
- 装饰层 `pointer-events: none`

## 许可证

MIT。社区项目，与 Anysphere/Cursor 无隶属关系。
