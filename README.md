<!-- input: 仓库源码与用户环境（macOS + Cursor.app） -->
<!-- output: 安装/使用/安全边界说明 -->
<!-- pos: 根文档入口；功能或架构变更后必须同步更新本文件与各子目录 md -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

[简体中文](README.zh-CN.md)

Interactive Skill/CLI for designing, generating, previewing, applying, validating, exporting, and safely restoring polished themes for the official **Cursor** desktop app on macOS.

Inspired by [Way-To-AGI/codex-theme-studio](https://github.com/Way-To-AGI/codex-theme-studio), adapted for Cursor's Electron workbench via loopback CDP. **Never modifies `Cursor.app` or `app.asar`.**

> **Maintenance rule:** Any feature, architecture, or coding-style change must update this root README **and** the architecture md in every affected folder before the work is considered done.

## Highlights

- Guided four-step HTML theme studio
- Light/dark modes with editorial, aurora, cyber, and warm directions
- Coordinated VS Code / Cursor semantic colors, radius, shadow, surfaces
- Local PNG/JPEG/WebP backgrounds with reading veil
- Trusted, pointer-inert decoration templates with collision detection
- Reversible loopback CDP injection
- Portable `.cursor-theme` import/export with safety validation
- Bundled `aurora-focus` sample theme

## Requirements

- macOS 12+
- Official Cursor at `/Applications/Cursor.app` or `~/Applications/Cursor.app`
- Node.js 22+

## Quick start

```bash
cd ~/Desktop/cursor-theme-studio
node scripts/self-test.mjs
node scripts/compile-theme.mjs --brief themes/aurora-focus/brief.json
```

### Apply with an isolated profile (recommended while developing)

```bash
node scripts/start-theme.mjs \
  --theme aurora-focus \
  --profile-path "$HOME/Library/Application Support/CursorThemeStudio/qa-profile" \
  --port 9336 \
  --screenshot /tmp/cursor-theme-verify.png
```

### Restore

```bash
node scripts/restore-theme.mjs
```

### Studio UI

```bash
node scripts/studio-server.mjs --wait-for-submit
```

## CLI

| Command | Purpose |
|---------|---------|
| `scripts/studio-server.mjs` | Interactive design studio |
| `scripts/compile-theme.mjs` | Compile brief → theme |
| `scripts/start-theme.mjs` | Launch Cursor + inject |
| `scripts/runtime.mjs` | Watch / verify / remove |
| `scripts/restore-theme.mjs` | Stop watcher + remove CSS |
| `scripts/export-theme.mjs` | Export `.cursor-theme` |
| `scripts/import-theme.mjs` | Import package |
| `scripts/self-test.mjs` | Offline regression |

## Safety

- Bind CDP only to `127.0.0.1`
- Do not patch or re-sign Cursor
- Never restart the primary Cursor unless `--restart-existing` is explicit
- Prefer `--profile-path` for QA
- Reject unsafe CSS, remote URLs, and packages over 30 MB
- Decorations are `aria-hidden` + `pointer-events: none`

## Layout

```text
SKILL.md                 Agent workflow
README.md / README.zh-CN.md
ARCHITECTURE.md          Root map + update rule
agents/                  Skill metadata
assets/                  Studio HTML + injector + art
references/              Schema / design / runtime / QA
scripts/                 Compile / runtime / tests
themes/aurora-focus/     Sample theme
```

## License

MIT. Community project, not affiliated with Anysphere/Cursor.
