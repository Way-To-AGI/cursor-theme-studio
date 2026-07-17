#!/usr/bin/env node
// input: 浏览器选择主题 / 应用 / 恢复
// output: 本地 HTML 画廊 + API（127.0.0.1）
// pos: 桌面可视化选主题、切主题、恢复
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listThemes, loadTheme, themesRoot } from "./theme-core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const galleryHtml = path.join(root, "assets", "gallery", "index.html");
const statePath = path.join(os.homedir(), "Library", "Application Support", "CursorThemeStudio", "state.json");

function parseArgs(argv) {
  const options = { port: 48771, open: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--port") options.port = Number(argv[++index]);
    else if (arg === "--no-open") options.open = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error("Invalid port");
  return options;
}

function json(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error("Request too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function currentState() {
  try {
    return JSON.parse(await fs.readFile(statePath, "utf8"));
  } catch {
    return null;
  }
}

function runNode(script, args = []) {
  return spawnSync(process.execPath, [path.join(here, script), ...args], {
    encoding: "utf8",
    timeout: 120000,
  });
}

const options = parseArgs(process.argv.slice(2));
const html = await fs.readFile(galleryHtml, "utf8");

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${options.port}`);
  try {
    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
      });
      response.end(html);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/themes") {
      json(response, 200, { themes: await listThemes(), active: await currentState() });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      json(response, 200, { active: await currentState(), themesRoot });
      return;
    }

    const artMatch = /^\/api\/themes\/([a-z0-9][a-z0-9_-]*)\/art$/i.exec(url.pathname);
    if (request.method === "GET" && artMatch) {
      const theme = await loadTheme(artMatch[1]);
      if (!theme.artPath) {
        json(response, 404, { error: "No artwork" });
        return;
      }
      const data = await fs.readFile(theme.artPath);
      const ext = path.extname(theme.artPath).toLowerCase();
      const type = ext === ".webp" ? "image/webp" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      response.end(data);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/apply") {
      const body = await readJson(request);
      const themeId = String(body.themeId || "").trim();
      if (!themeId) {
        json(response, 400, { error: "themeId required" });
        return;
      }
      await loadTheme(themeId);
      const result = runNode("switch-theme.mjs", [themeId, "--no-screenshot"]);
      if (result.status !== 0) {
        json(response, 500, { error: result.stderr || result.stdout || "Apply failed", status: result.status });
        return;
      }
      json(response, 200, { applied: true, themeId, active: await currentState() });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/restore") {
      const result = runNode("restore-theme.mjs");
      if (result.status !== 0) {
        json(response, 500, { error: result.stderr || result.stdout || "Restore failed" });
        return;
      }
      json(response, 200, { restored: true, active: await currentState() });
      return;
    }

    json(response, 404, { error: "Not found" });
  } catch (error) {
    json(response, 400, { error: error.message });
  }
});

server.listen(options.port, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${options.port}/`;
  console.log(JSON.stringify({ ready: true, url, pid: process.pid }, null, 2));
  if (options.open && process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  }
});
