#!/usr/bin/env node
// input: 可选 --json
// output: 本地 themes/ 列表
// pos: 快速查看可切换主题
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import { listThemes } from "./theme-core.mjs";

const asJson = process.argv.includes("--json");
const themes = await listThemes();
if (asJson) {
  console.log(JSON.stringify({ count: themes.length, themes }, null, 2));
} else {
  if (!themes.length) {
    console.log("No themes yet. Run: node scripts/interview.mjs --one-round");
  } else {
    for (const theme of themes) {
      console.log(`${theme.id.padEnd(24)} ${theme.mode.padEnd(6)} ${theme.displayName} · ${theme.direction}`);
    }
  }
}
