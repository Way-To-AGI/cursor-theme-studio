<!-- input: brief 配色与方向 -->
<!-- output: CSS token / 装饰视觉规范 -->
<!-- pos: 生成 CSS 时的设计约束 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Design system

- Body text contrast ≥ 4.5:1; large text/icons ≥ 3:1.
- One primary accent, one supporting accent; keep status colors meaningful.
- Prefer VS Code CSS variables (`--vscode-*`) plus Cursor overlays (`--composer-pane-background`, `--cursor-text-link`).
- Artwork detail stays away from sidebar, editor reading column, and composer.
- Use a legibility veil; avoid rectangular seams.
- Respect `prefers-reduced-motion`.
- Never mutate native layout geometry (`position`, `z-index`, `width`, `height`, `display`, `pointer-events` on workbench parts).

## Decorations policy

- Prefer integrated atmosphere over floating cards.
- Trusted templates are `sidebar spine` (thin light rail + vertical label) and `corner signature` (soft glow + quiet mark).
- Never use heavy boxed chrome that reads as a bolted-on patch.
- Keep decorations `aria-hidden` and `pointer-events: none`.
- Hide on dialogs, compact windows, missing anchors, or collisions.
