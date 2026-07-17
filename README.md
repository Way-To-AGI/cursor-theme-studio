<!-- input: 仓库源码与用户环境（macOS + Cursor.app） -->
<!-- output: 安装/使用/安全边界说明 -->
<!-- pos: 根文档入口；功能或架构变更后必须同步更新本文件与各子目录 md -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

[简体中文](README.zh-CN.md)

Design, **confirm**, generate, preview, apply, and safely restore polished themes for the official **Cursor** app on macOS — without modifying `Cursor.app`.

Inspired by [Way-To-AGI/codex-theme-studio](https://github.com/Way-To-AGI/codex-theme-studio).

> **Maintenance rule:** Any feature/architecture change must update this README and affected folder `ARCHITECTURE.md` files.

## Why this exists

Cursor’s modern Glass / Agents UI needs more than a flat color theme. This studio helps you:

1. Confirm taste with the user (one round or multi-round)
2. Generate a **beautiful** theme (visible artwork, translucent glass, restrained décor)
3. Apply safely in an isolated QA window first
4. Restore anytime

## Requirements

- macOS 12+
- Cursor at `/Applications/Cursor.app` or `~/Applications/Cursor.app`
- Node.js 22+

## Install (easy)

```bash
git clone https://github.com/Way-To-AGI/cursor-theme-studio.git
cd cursor-theme-studio
node scripts/doctor.mjs
```

Optional: install as a Cursor Skill

```bash
mkdir -p ~/.cursor/skills
git clone https://github.com/Way-To-AGI/cursor-theme-studio.git \
  ~/.cursor/skills/cursor-theme-studio
```

Then restart Cursor / reload skills and ask:

> Use $cursor-theme-studio to help me pick a beautiful dark theme, confirm with me, then apply it in a QA window.

## 60-second try (sample theme)

Opens a **separate** QA Cursor window. Your main Cursor stays untouched.

```bash
node scripts/try.mjs
```

Restore:

```bash
node scripts/restore-theme.mjs
```

## Confirm taste, then apply

### A) Agent multi-round (recommended)

Follow `references/interview.md`:

1. Direction
2. Decoration density
3. Explicit confirm
4. Compile → `try.mjs` → screenshot → refine until it looks good

### B) Terminal interview

```bash
# multi-round confirm
node scripts/interview.mjs --multi

# one-round shortcut
node scripts/interview.mjs --one-round

# interview + apply QA window
node scripts/interview.mjs --multi --apply
```

### C) Visual HTML studio

```bash
node scripts/studio-server.mjs --wait-for-submit
```

## Beauty bar

- Background must be visible (not crushed flat black)
- Glass stays translucent
- Decorations are atmospheric only (thin light filament + optional whisper signature)
- No patch-like floating cards

## Safety

- CDP binds to `127.0.0.1` only
- Never patches `Cursor.app` / `app.asar`
- Prefer QA profile (`scripts/try.mjs`) before touching the primary session
- Primary restart requires explicit `--restart-existing`

## Layout

```text
SKILL.md                 Agent workflow
references/interview.md  Taste confirmation rounds
scripts/doctor.mjs       Env check
scripts/interview.mjs    CLI interview → brief
scripts/try.mjs          One-command QA apply
scripts/theme-core.mjs   Compile / validate
themes/aurora-focus/     Sample beautiful theme
```

## License

MIT. Community project, not affiliated with Anysphere/Cursor.
