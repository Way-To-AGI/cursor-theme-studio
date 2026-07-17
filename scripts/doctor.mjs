#!/usr/bin/env node
// input: 无（可选 --port）
// output: 环境自检 JSON（Cursor / Node / 端口）
// pos: 安装后第一步体检
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const port = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 9336);
const home = os.homedir();
const candidates = [
  "/Applications/Cursor.app/Contents/MacOS/Cursor",
  path.join(home, "Applications/Cursor.app/Contents/MacOS/Cursor"),
];

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

const cursorPath = (await Promise.all(candidates.map(async (item) => (await exists(item) ? item : null)))).find(Boolean) || null;
let cdp = false;
try {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(800) });
  cdp = response.ok;
} catch {
  cdp = false;
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
const result = {
  ok: Boolean(cursorPath) && nodeMajor >= 22 && process.platform === "darwin",
  platform: process.platform,
  node: process.version,
  nodeOk: nodeMajor >= 22,
  cursorPath,
  cdpPort: port,
  cdpOpen: cdp,
  skillHint: path.join(home, ".cursor/skills/cursor-theme-studio"),
  next: cursorPath
    ? "Run: node scripts/try.mjs"
    : "Install Cursor.app first, then rerun doctor",
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 2;
