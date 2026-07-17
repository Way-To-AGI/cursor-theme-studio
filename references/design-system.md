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
- Decorations: small area, auto-hide on dialogs/compact windows/collisions.
- Respect `prefers-reduced-motion`.
- Never mutate native layout geometry (`position`, `z-index`, `width`, `height`, `display`, `pointer-events` on workbench parts).
