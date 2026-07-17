<!-- input: macOS Cursor 安装与 CDP 约定 -->
<!-- output: 启动/注入/恢复行为说明 -->
<!-- pos: start-theme / runtime 契约 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Runtime notes

- Official macOS bundle is normally `/Applications/Cursor.app` with bundle id `com.todesktop.230313mzl4w4u92`.
- Launcher starts the official executable with `--remote-debugging-address=127.0.0.1` and a loopback port. It never changes the app bundle.
- Default CDP port is **9336**.
- Prefer `--profile-path` for isolated QA so the primary Cursor session is not disturbed.
- Persistent state and logs live under `~/Library/Application Support/CursorThemeStudio`.
- A running primary Cursor without CDP is never restarted unless `--restart-existing` is present.
- Eligible page targets are primarily `vscode-file://` workbench pages. Exclude DevTools and unrelated targets.
- Watch injector reapplies after renderer reloads. Only one Theme Studio watcher should own a port.
- Restore validates the stored PID command before terminating the watcher, removes live CSS/DOM, and leaves accounts and workspace data unchanged.
