#!/usr/bin/env node
// input: 可选 --theme / --port / --screenshot
// output: 用隔离 QA profile 一键应用示例主题
// pos: 最易上手的试用入口（不影响主 Cursor）
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const startPath = path.join(here, "start-theme.mjs");

function parseArgs(argv) {
  const options = {
    theme: "aurora-focus",
    port: 9336,
    screenshot: path.join(os.tmpdir(), "cursor-theme-studio-try.png"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--theme") options.theme = argv[++index];
    else if (arg === "--port") options.port = Number(argv[++index]);
    else if (arg === "--screenshot") options.screenshot = path.resolve(argv[++index]);
    else if (arg === "--no-screenshot") options.screenshot = null;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));
const profilePath = path.join(os.homedir(), "Library", "Application Support", "CursorThemeStudio", "qa-profile");
const args = [
  startPath,
  "--theme", options.theme,
  "--profile-path", profilePath,
  "--port", String(options.port),
];
if (options.screenshot) args.push("--screenshot", options.screenshot);

const result = spawnSync(process.execPath, args, { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(JSON.stringify({
  tried: true,
  theme: options.theme,
  profilePath,
  port: options.port,
  screenshot: options.screenshot,
  tip: "A separate QA Cursor window should open. Your main Cursor is unchanged. Restore with: node scripts/restore-theme.mjs",
}, null, 2));
