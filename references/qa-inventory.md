<!-- input: 已编译主题 + 可选实机 Cursor -->
<!-- output: 完成前检查清单 -->
<!-- pos: 验收门禁 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# QA inventory

Before claiming completion:

1. `node scripts/self-test.mjs` passes
2. `node scripts/studio-protocol-test.mjs` passes
3. Sample theme `aurora-focus` compiles without unsafe CSS
4. Isolated profile apply (`--profile-path`) verifies and can capture a screenshot
5. Decorations remain `pointer-events: none` and `aria-hidden`
6. `restore-theme.mjs` clears the skin class and style node
7. No machine-specific secrets committed
8. Root README + affected folder `ARCHITECTURE.md` updated
