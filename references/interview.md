<!-- input: 用户模糊审美描述 / Agent 访谈回合 -->
<!-- output: 可编译 brief 所需决策 -->
<!-- pos: 多轮或一轮确认的审美访谈契约 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Theme interview

Goal: confirm a **beautiful** Cursor theme with the user before applying. One round is OK; multi-round is better when taste is unclear.

## Round A — Direction (required)

Ask **one** question with choices:

1. Quiet editorial (light, paper, calm)
2. Aurora glass (dark, teal + champagne, cinematic) — default recommendation
3. Cyber neon (dark, high contrast)
4. Warm studio (light, soft sunlight)

Do not invent a fifth random style unless the user insists.

## Round B — Density (recommended)

1. None — colors + background only
2. Light — thin sidebar light filament only (recommended)
3. Standard — filament + whisper signature (`luminous`)

Never propose thick floating cards or badge stickers.

## Round C — Confirm (required before apply)

Show a short recap:

- name / direction / mode / density / one-line mood

Ask: “Confirm and apply to a QA Cursor window?”

Only after explicit yes:

1. Write `brief.json`
2. Compile
3. Prefer `node scripts/try.mjs --theme <id>` (isolated profile)
4. Capture screenshot and show/describe it
5. Iterate if the user says it is still ugly — change art/veil/palette, do **not** slap on more widgets

## One-round shortcut

If the user says “直接来一个好看的深色极光”:

- direction `aurora-glass`
- density `light`
- compile + `try.mjs`
- still show screenshot and ask whether to keep or refine

## Hard beauty bar

- Background must be visible (veil not too heavy)
- Glass surfaces stay translucent
- Decorations are atmospheric, never patch-like cards
- Refuse to ship a theme that only changes a few CSS variables with a flat black screen
