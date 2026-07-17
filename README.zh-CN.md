<!-- input: 仓库源码与用户环境（macOS + Cursor.app） -->
<!-- output: 中文安装/使用/安全说明 -->
<!-- pos: 中文根文档；与 README.md 同步维护 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

[English](README.md)

给官方 **Cursor** 做好看、可恢复的主题（Skill + CLI）。先和用户确认审美（一轮或多轮），再生成并应用到隔离窗口，**不修改 `Cursor.app`**。

对标 [Way-To-AGI/codex-theme-studio](https://github.com/Way-To-AGI/codex-theme-studio)。

> **维护约定：** 功能/架构变更后必须更新本文件与相关目录子文档。

## 安装（简单）

```bash
git clone https://github.com/Way-To-AGI/cursor-theme-studio.git
cd cursor-theme-studio
node scripts/doctor.mjs
```

装成 Cursor Skill（可选）：

```bash
mkdir -p ~/.cursor/skills
git clone https://github.com/Way-To-AGI/cursor-theme-studio.git \
  ~/.cursor/skills/cursor-theme-studio
```

对话里可以说：

> 用 $cursor-theme-studio，先问我想要什么风格，确认好看后再应用到 QA 窗口。

## 一分钟试用（示例主题）

会打开**另一个** QA Cursor 窗口，不影响你正在用的主窗口：

```bash
node scripts/try.mjs
# 或
node scripts/switch-theme.mjs aurora-focus
```

### 本地 HTML 画廊（预览 / 切换 / 恢复）

```bash
node scripts/gallery-server.mjs
```

浏览器打开 `http://127.0.0.1:48771/`：

- 预览本地全部主题
- 点 **切换到此主题** 立刻切换
- 出问题点 **恢复原样**

### 终端快捷切换

```bash
node scripts/list-themes.mjs
node scripts/switch-theme.mjs cyber-neon
node scripts/switch-theme.mjs warm-studio
node scripts/switch-theme.mjs --restore
```

恢复：

```bash
node scripts/restore-theme.mjs
```

## 先确认审美，再应用到 Cursor

### A) Agent 多轮确认（推荐）

按 `references/interview.md`：

1. 选方向（极光 / 编辑部 / 霓虹 / 温暖）
2. 选装饰密度（推荐轻量光丝）
3. 复述确认
4. 编译 → `try.mjs` → 看截图 → 不好看就继续改，直到好看

### B) 终端访谈

```bash
# 多轮确认
node scripts/interview.mjs --multi

# 一轮快捷
node scripts/interview.mjs --one-round

# 访谈完直接 QA 应用
node scripts/interview.mjs --multi --apply
```

### C) HTML 工作台

```bash
node scripts/studio-server.mjs --wait-for-submit
```

## 好看标准

- 背景必须看得见
- 玻璃保持通透
- 装饰只做氛围（细光丝 + 可选淡签名）
- 禁止补丁式大卡片

## 安全

- CDP 只绑本机回环
- 不改官方安装包
- 默认走 QA profile；主窗口要重启必须用户明确授权

## 目录

```text
scripts/list-themes.mjs      列出主题
scripts/switch-theme.mjs     切换 / 恢复
scripts/gallery-server.mjs   本地 HTML 画廊
assets/gallery/              画廊页面
themes/*/                    示例与生成主题
```

## 许可证

MIT。与 Anysphere/Cursor 无隶属关系。
