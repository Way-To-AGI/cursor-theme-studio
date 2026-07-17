---
name: cursor-theme-studio
description: Interactively design, generate, preview, apply, verify, export, repair, or safely remove polished decorative themes for the official Cursor desktop app on macOS. Use when a user wants a guided HTML theme studio, a custom Cursor skin from a brief or reference image, a background image, coordinated colors, safe non-blocking decorations, a portable .cursor-theme package, live compatibility inspection, or one-click restoration without modifying Cursor.app or app.asar.
---

<!-- input: 用户审美意图 / brief / 可选背景图 -->
<!-- output: 已验证的可逆 Cursor 主题与截图 -->
<!-- pos: Agent 工作流入口 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

Create reversible Cursor themes through a constrained design brief and loopback Chromium DevTools Protocol. Preserve the signed app, user data, extensions, and native interaction hierarchy.

## Choose the workflow

- Start the studio with `node scripts/studio-server.mjs --wait-for-submit`. Keep that process attached until it emits `submitted`, then continue from `briefPath`.
- Compile with `node scripts/compile-theme.mjs --brief /absolute/brief.json [--art /absolute/art.png]`.
- Prefer isolated apply: `node scripts/start-theme.mjs --theme <id> --profile-path <qa-profile>`.
- Primary profile apply only with explicit user authorization and `--restart-existing` if Cursor is already running without CDP.
- Verify with `node scripts/runtime.mjs --verify --theme <id> --screenshot /absolute/theme.png`.
- Export/import `.cursor-theme` packages; import replacement requires `--force`.
- Restore with `node scripts/restore-theme.mjs`.

Read `references/theme-schema.md` before changing the brief. Read `references/design-system.md` before editing CSS. Read `references/runtime-notes.md` before changing launch/CDP/restore. Read `references/qa-inventory.md` before declaring completion.

## Guardrails

- Never patch, replace, re-sign, or take ownership of `Cursor.app` or `app.asar`.
- Bind CDP only to `127.0.0.1`. Stop on port conflicts.
- Never terminate Cursor unless the user authorized a restart.
- Prefer `--profile-path` for QA so the user's primary session is untouched.
- Reject `@import`, external CSS URLs, executable CSS, unsafe asset names, and packages over 30 MB.
- Decorations are trusted templates only, `aria-hidden`, `pointer-events: none`.
- Do not claim success from compilation alone. Require static validation, live verification, and screenshot inspection when applying.

## Test

```bash
node scripts/self-test.mjs
node scripts/studio-protocol-test.mjs
```
