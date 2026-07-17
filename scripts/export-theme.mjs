#!/usr/bin/env node
// input: 主题 id / manifest
// output: 可移植 .cursor-theme 包
// pos: 导出 CLI
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import path from "node:path";
import { buildThemePackage } from "./theme-core.mjs";

function parseArgs(argv) {
  const options = { theme: null, output: null, force: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--theme") options.theme = argv[++index];
    else if (arg === "--output") options.output = path.resolve(argv[++index]);
    else if (arg === "--force") options.force = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.theme) throw new Error("--theme is required");
  return options;
}

const options = parseArgs(process.argv.slice(2));
const { bundle, serialized } = await buildThemePackage(options.theme);
const output = options.output ?? path.resolve(`${bundle.manifest.id}-${bundle.manifest.version}.cursor-theme`);
if (!options.force) {
  try { await fs.access(output); throw new Error(`Refusing to overwrite ${output}; use --force`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, serialized, "utf8");
console.log(JSON.stringify({ exported: true, output, bytes: Buffer.byteLength(serialized) }, null, 2));
