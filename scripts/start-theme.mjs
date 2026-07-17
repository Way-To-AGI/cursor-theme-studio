#!/usr/bin/env node
// input: 主题 id、可选 CDP 端口 / profile / 重启授权
// output: 启动带 CDP 的 Cursor + watcher，并做现场验证
// pos: 主题应用入口（macOS）
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadTheme } from "./theme-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const runtimePath = path.join(here, "runtime.mjs");
const stateRoot = path.join(os.homedir(), "Library", "Application Support", "CursorThemeStudio");
const statePath = path.join(stateRoot, "state.json");
const CURSOR_BUNDLE_ID = "com.todesktop.230313mzl4w4u92";

function parseArgs(argv) {
  const options = { theme: null, port: 9336, profilePath: null, restartExisting: false, foreground: false, screenshot: null, workspace: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--theme") options.theme = argv[++index];
    else if (arg === "--port") options.port = Number(argv[++index]);
    else if (arg === "--profile-path") options.profilePath = path.resolve(argv[++index]);
    else if (arg === "--restart-existing") options.restartExisting = true;
    else if (arg === "--foreground") options.foreground = true;
    else if (arg === "--screenshot") options.screenshot = path.resolve(argv[++index]);
    else if (arg === "--workspace") options.workspace = path.resolve(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.theme) throw new Error("--theme is required");
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) throw new Error("Invalid port");
  return options;
}

async function cdpReady(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(900) });
    if (!response.ok) return false;
    const targets = await response.json();
    return targets.some((item) => item.type === "page" && (
      String(item.url).startsWith("vscode-file://")
      || String(item.url).includes("workbench")
    ));
  } catch { return false; }
}

function processRows() {
  return spawnSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).stdout.split("\n")
    .map((line) => line.trim()).filter(Boolean)
    .map((line) => ({ pid: Number(line.match(/^\d+/)?.[0]), command: line.replace(/^\d+\s+/, "") }));
}

function primaryCursorPids() {
  return processRows()
    .filter((row) => /\/Cursor\.app\/Contents\/MacOS\/Cursor(?:\s|$)/.test(row.command))
    .map((row) => row.pid);
}

function commandFor(pid) {
  return spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" }).stdout.trim();
}

function stopPreviousWatcher(state) {
  if (!state?.watcherPid) return;
  const command = commandFor(state.watcherPid);
  if (command.includes(runtimePath) && command.includes("--watch")) {
    try { process.kill(state.watcherPid, "SIGTERM"); } catch { /* stale */ }
  }
}

async function findApp() {
  for (const candidate of ["/Applications/Cursor.app", path.join(os.homedir(), "Applications", "Cursor.app")]) {
    const executable = path.join(candidate, "Contents", "MacOS", "Cursor");
    try { await fs.access(executable); return executable; } catch { /* continue */ }
  }
  throw new Error("Official Cursor app was not found");
}

async function waitReady(port, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdpReady(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`Cursor did not expose CDP on port ${port}`);
}

function runRuntime(args, options = {}) {
  return spawn(process.execPath, [runtimePath, ...args], { stdio: options.stdio ?? "inherit", detached: options.detached ?? false });
}

const options = parseArgs(process.argv.slice(2));
const theme = await loadTheme(options.theme);
await fs.mkdir(stateRoot, { recursive: true });
let previousState = null;
try { previousState = JSON.parse(await fs.readFile(statePath, "utf8")); } catch { /* first run */ }
stopPreviousWatcher(previousState);

if (!(await cdpReady(options.port))) {
  const primaryRunning = primaryCursorPids().length > 0;
  if (primaryRunning && !options.profilePath && !options.restartExisting) {
    throw new Error("Cursor is already running without Theme Studio CDP. Close it, use --profile-path for an isolated window, or rerun with --restart-existing after explicit authorization.");
  }
  if (options.restartExisting && !options.profilePath && primaryRunning) {
    spawnSync("osascript", ["-e", `tell application id "${CURSOR_BUNDLE_ID}" to quit`], { stdio: "ignore" });
    const deadline = Date.now() + 12000;
    while (primaryCursorPids().length && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 250));
    if (primaryCursorPids().length) throw new Error("Cursor did not quit cleanly; refusing to force terminate it");
  }
  const executable = await findApp();
  const appArgs = [`--remote-debugging-address=127.0.0.1`, `--remote-debugging-port=${options.port}`];
  if (options.profilePath) {
    await fs.mkdir(options.profilePath, { recursive: true });
    appArgs.push(`--user-data-dir=${options.profilePath}`);
  }
  if (options.workspace) appArgs.push(options.workspace);
  const log = await fs.open(path.join(stateRoot, "app.log"), "a");
  const child = spawn(executable, appArgs, { detached: true, stdio: ["ignore", log.fd, log.fd] });
  child.unref();
  await waitReady(options.port);
}

if (options.foreground) {
  const child = runRuntime(["--watch", "--port", String(options.port), "--theme", theme.manifestPath]);
  await new Promise((resolve) => child.on("exit", resolve));
  process.exit(0);
}

const out = await fs.open(path.join(stateRoot, "watcher.log"), "a");
const err = await fs.open(path.join(stateRoot, "watcher-error.log"), "a");
const watcher = runRuntime(["--watch", "--port", String(options.port), "--theme", theme.manifestPath], { detached: true, stdio: ["ignore", out.fd, err.fd] });
watcher.unref();
await fs.writeFile(statePath, `${JSON.stringify({
  port: options.port,
  watcherPid: watcher.pid,
  theme: theme.manifestPath,
  profilePath: options.profilePath,
  startedAt: new Date().toISOString(),
}, null, 2)}\n`, "utf8");

let verified = false;
const verifyMode = options.profilePath ? "--smoke" : "--verify";
for (let attempt = 0; attempt < 24; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (attempt === 0 || attempt % 3 === 0) {
    spawnSync(
      process.execPath,
      [runtimePath, "--once", "--port", String(options.port), "--theme", theme.manifestPath, "--timeout-ms", "4000"],
      { stdio: "ignore", timeout: 7000 },
    );
  }
  const check = spawnSync(
    process.execPath,
    [runtimePath, verifyMode, "--port", String(options.port), "--theme", theme.manifestPath, "--timeout-ms", "4000"],
    { stdio: "ignore", timeout: 6000 },
  );
  if (check.status === 0) { verified = true; break; }
}
if (!verified) {
  stopPreviousWatcher({ watcherPid: watcher.pid });
  await fs.rm(statePath, { force: true });
  throw new Error(`Theme was injected but live verification failed. See ${path.join(stateRoot, "watcher-error.log")}`);
}
if (options.screenshot) {
  let captured = false;
  for (let attempt = 0; attempt < 3 && !captured; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 1000));
    const capture = spawnSync(process.execPath, [runtimePath, verifyMode, "--port", String(options.port), "--theme", theme.manifestPath, "--timeout-ms", "15000", "--screenshot", options.screenshot], { stdio: "inherit", timeout: 20000 });
    captured = capture.status === 0;
  }
  if (!captured) console.warn(`Theme is active, but screenshot capture did not complete: ${options.screenshot}`);
}
console.log(JSON.stringify({ active: true, theme: theme.manifest.id, port: options.port, watcherPid: watcher.pid, screenshot: options.screenshot }, null, 2));
