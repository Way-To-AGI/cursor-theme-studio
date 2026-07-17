---
name: cursor-theme-studio
description: Interactively design, confirm, generate, preview, apply, verify, export, or safely restore polished Cursor desktop themes on macOS. Use when a user wants a guided multi-round (or one-round) theme interview, a beautiful custom Cursor skin, background artwork, restrained decorations, a portable .cursor-theme package, or one-click QA apply without modifying Cursor.app.
---

<!-- input: 用户审美意图 / brief / 可选背景图 -->
<!-- output: 已验证的可逆 Cursor 主题与截图 -->
<!-- pos: Agent 工作流入口 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Cursor Theme Studio

Create reversible, **good-looking** Cursor themes through a constrained brief and loopback CDP. Never modify `Cursor.app` / `app.asar`.

## Easy path (recommended)

1. `node scripts/doctor.mjs`
2. Interview taste (Agent conversation **or** CLI):
   - Multi-round: follow `references/interview.md`
   - One-round CLI: `node scripts/interview.mjs --one-round`
   - Multi-round CLI: `node scripts/interview.mjs --multi`
3. Apply to an isolated QA window: `node scripts/try.mjs --theme <id>` or open the gallery `node scripts/gallery-server.mjs`
4. Show screenshot / ask whether to keep or refine
5. If anything breaks: `node scripts/switch-theme.mjs --restore`
6. Only apply to the primary Cursor after explicit user authorization (`--restart-existing`)

### Fast switching

```bash
node scripts/list-themes.mjs
node scripts/switch-theme.mjs aurora-focus
node scripts/switch-theme.mjs cyber-neon
node scripts/gallery-server.mjs   # HTML preview + click to switch
```

Read `references/interview.md` before asking taste questions. Beauty bar is mandatory: visible artwork, translucent glass, no patch-like floating cards.

## Alternate: HTML studio

```bash
node scripts/studio-server.mjs --wait-for-submit
```

Keep the Agent turn attached until `submitted`, then compile from `briefPath` and continue with artwork → apply → verify.

## CLI map

| Command | Purpose |
|---------|---------|
| `scripts/doctor.mjs` | Environment check |
| `scripts/interview.mjs` | Taste interview → brief (+ compile) |
| `scripts/try.mjs` | One-command QA apply |
| `scripts/list-themes.mjs` | List local themes |
| `scripts/switch-theme.mjs` | Switch theme / restore |
| `scripts/gallery-server.mjs` | Local HTML preview + switch |
| `scripts/compile-theme.mjs` | Brief → theme |
| `scripts/start-theme.mjs` | Apply / launch with CDP |
| `scripts/restore-theme.mjs` | Remove theme |
| `scripts/export-theme.mjs` / `import-theme.mjs` | Portable `.cursor-theme` |

## Guardrails

- CDP only on `127.0.0.1`
- Prefer `--profile-path` / `try.mjs` so the user's main Cursor stays untouched
- Never restart Cursor without explicit authorization
- Decorations: spine filament + optional whisper signature only
- Do not claim success without live verification / screenshot when applying

## Test

```bash
node scripts/self-test.mjs
node scripts/studio-protocol-test.mjs
node scripts/doctor.mjs
```
