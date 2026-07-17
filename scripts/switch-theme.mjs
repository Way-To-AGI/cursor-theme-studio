#!/usr/bin/env node
// input: 主题 id（位置参数或 --theme）
// output: 切换到该主题（QA profile）；可 --restore
// pos: 桌面/终端快速切主题快捷入口
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listThemes, loadTheme } from "./theme-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const options = { theme: null, restore: false, port: 9336, noScreenshot: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--theme") options.theme = argv[++index];
    else if (arg === "--restore" || arg === "restore") options.restore = true;
    else if (arg === "--port") options.port = Number(argv[++index]);
    else if (arg === "--no-screenshot") options.noScreenshot = true;
    else if (!arg.startsWith("-") && !options.theme) options.theme = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

const options = parseArgs(process.argv.slice(2));

if (options.restore) {
  const result = spawnSync(process.execPath, [path.join(here, "restore-theme.mjs")], { stdio: "inherit" });
  process.exit(result.status ?? 1);
}

if (!options.theme) {
  const themes = await listThemes();
  console.error("Usage: node scripts/switch-theme.mjs <theme-id>");
  console.error("       node scripts/switch-theme.mjs --restore");
  console.error("Available:");
  for (const theme of themes) console.error(`  - ${theme.id}`);
  process.exit(2);
}

await loadTheme(options.theme);
const tryArgs = [path.join(here, "try.mjs"), "--theme", options.theme, "--port", String(options.port)];
if (options.noScreenshot) tryArgs.push("--no-screenshot");
const result = spawnSync(process.execPath, tryArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
