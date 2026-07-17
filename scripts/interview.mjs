#!/usr/bin/env node
// input: 终端问答（1 轮或分轮）
// output: sessions/.../brief.json 路径（stdout JSON）
// pos: 无 Studio 时的轻量审美访谈 → brief
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { spawnSync } from "node:child_process";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { normalizeBrief, createTheme } from "./theme-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const DIRECTIONS = [
  { id: "quiet-editorial", label: "克制编辑部 · 干净纸感" },
  { id: "aurora-glass", label: "极光玻璃 · 冷静夜色（推荐）" },
  { id: "cyber-neon", label: "未来霓虹 · 高对比" },
  { id: "warm-studio", label: "温暖工作室 · 柔和日光" },
];

const PRESETS = {
  "quiet-editorial": { mode: "light", accent: "#3867D6", support: "#7C8AA5", surface: "#F4F3EF", ink: "#20242B" },
  "aurora-glass": { mode: "dark", accent: "#7EE7FF", support: "#D7B48A", surface: "#0A1018", ink: "#F4F7FA" },
  "cyber-neon": { mode: "dark", accent: "#F4E527", support: "#32D8FF", surface: "#080D18", ink: "#F5F7FA" },
  "warm-studio": { mode: "light", accent: "#FF7A45", support: "#E0A82E", surface: "#FAF4E8", ink: "#302821" },
};

function parseArgs(argv) {
  const options = { rounds: "multi", compile: true, apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--one-round") options.rounds = "one";
    else if (arg === "--multi") options.rounds = "multi";
    else if (arg === "--no-compile") options.compile = false;
    else if (arg === "--apply") options.apply = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

async function askChoice(rl, title, items) {
  console.log(`\n${title}`);
  items.forEach((item, index) => console.log(`  ${index + 1}) ${item.label || item}`));
  const raw = (await rl.question("选择编号（回车=1）: ")).trim();
  const index = raw ? Number(raw) - 1 : 0;
  if (!Number.isInteger(index) || index < 0 || index >= items.length) throw new Error("无效选择");
  return items[index];
}

function slugify(value) {
  return String(value || "my-theme")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `theme-${Date.now()}`;
}

const options = parseArgs(process.argv.slice(2));
const rl = readline.createInterface({ input, output });

try {
  console.log("Cursor Theme Studio · 审美访谈");
  console.log(options.rounds === "one" ? "模式：一轮确认后生成" : "模式：多轮确认（方向 → 明暗细节 → 装饰）");

  const name = (await rl.question("\n主题名称（回车=Aurora Focus）: ")).trim() || "Aurora Focus";
  const idInput = (await rl.question("主题 ID（回车自动生成）: ")).trim();
  const id = slugify(idInput || name);

  const direction = await askChoice(rl, "设计方向", DIRECTIONS);
  const preset = PRESETS[direction.id];

  let mode = preset.mode;
  let density = "light";
  let tagline = "Quiet light, clear mind";

  if (options.rounds === "multi") {
    const modeChoice = await askChoice(rl, "明暗", [
      { id: "dark", label: "深色 · 夜间专注" },
      { id: "light", label: "浅色 · 日间清爽" },
      { id: "keep", label: `跟随方向默认（${preset.mode}）` },
    ]);
    if (modeChoice.id !== "keep") mode = modeChoice.id;

    const densityChoice = await askChoice(rl, "装饰密度（推荐克制）", [
      { id: "none", label: "无装饰 · 只保留背景与配色" },
      { id: "light", label: "轻量 · 仅侧栏细光丝（推荐）" },
      { id: "standard", label: "标准 · 光丝 + 右下淡签名" },
    ]);
    density = densityChoice.id;
    tagline = (await rl.question("一句话气质（回车用默认）: ")).trim() || tagline;

    console.log("\n请确认：");
    console.log(`  名称: ${name}`);
    console.log(`  方向: ${direction.label}`);
    console.log(`  明暗: ${mode}`);
    console.log(`  装饰: ${density}`);
    console.log(`  短句: ${tagline}`);
    const ok = (await rl.question("确认生成好看主题？(Y/n): ")).trim().toLowerCase();
    if (ok === "n" || ok === "no") {
      console.log(JSON.stringify({ cancelled: true }, null, 2));
      process.exit(0);
    }
  } else {
    density = "light";
  }

  const brief = normalizeBrief({
    id,
    name,
    mode,
    direction: direction.id,
    palette: preset,
    background: {
      source: "builtin",
      position: mode === "dark" ? "78% 35%" : "center right",
      veil: mode === "dark" ? 0.3 : 0.72,
      prompt: `${direction.label}, polished editorial atmosphere, quiet negative space`,
    },
    shape: { radius: 20, shadow: "soft" },
    decorations: {
      density,
      sidebarWidget: {
        enabled: density !== "none",
        icon: "A",
        eyebrow: "AURORA",
        title: tagline.split(/[，,]/)[0] || "Deep focus",
        caption: tagline,
      },
      cornerCard: {
        enabled: density === "standard",
        icon: "N",
        eyebrow: "STUDIO",
        title: "luminous",
        caption: tagline,
      },
    },
    copy: { tagline },
  });

  const sessionRoot = path.join(os.homedir(), ".cursor", "theme-studio", "sessions", `${Date.now().toString(36)}`);
  await fs.mkdir(sessionRoot, { recursive: true });
  const briefPath = path.join(sessionRoot, "brief.json");
  await fs.writeFile(briefPath, `${JSON.stringify(brief, null, 2)}\n`, "utf8");

  let compiled = null;
  if (options.compile) {
    compiled = await createTheme(brief, {
      outputRoot: path.join(root, "themes"),
      artPath: path.join(root, "assets", "studio-default-art.png"),
    });
  }

  const payload = {
    status: "ready",
    briefPath,
    themeId: brief.id,
    compiled: Boolean(compiled),
    manifestPath: compiled?.manifestPath || null,
    next: options.apply
      ? "Applying via scripts/try.mjs ..."
      : `Preview/apply: node scripts/try.mjs --theme ${brief.id}`,
  };
  console.log(`\n${JSON.stringify(payload, null, 2)}`);

  if (options.apply && compiled) {
    const tryPath = path.join(here, "try.mjs");
    const applied = spawnSync(process.execPath, [tryPath, "--theme", brief.id], { stdio: "inherit" });
    process.exit(applied.status ?? 1);
  }
} finally {
  rl.close();
}
