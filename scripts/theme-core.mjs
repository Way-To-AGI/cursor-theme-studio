// input: brief JSON / 主题目录 / 可选本地背景图
// output: 规范化 brief、theme.css、manifest、.cursor-theme 包
// pos: 主题编译与校验核心；被 compile/export/import/runtime 调用
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const skillRoot = path.resolve(here, "..");
export const themesRoot = path.join(skillRoot, "themes");
export const MAX_PACKAGE_BYTES = 30 * 1024 * 1024;

const SAFE_ID = /^[a-z0-9][a-z0-9_-]*$/i;
const HEX = /^#[0-9a-f]{6}$/i;
const MODES = new Set(["light", "dark"]);
const DIRECTIONS = new Set(["quiet-editorial", "aurora-glass", "cyber-neon", "warm-studio", "custom"]);
const DENSITIES = new Set(["none", "light", "standard"]);
const SHADOWS = new Set(["none", "soft", "crisp"]);
const ART_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const UNSAFE_CSS = [
  /@import\s/i,
  /url\(\s*["']?(?!data:|var\()/i,
  /javascript\s*:/i,
  /expression\s*\(/i,
  /behavior\s*:/i,
  /-moz-binding\s*:/i,
];
const NATIVE_SELECTOR = /\.monaco-workbench|\.part\.(?:sidebar|editor|auxiliarybar|activitybar|panel|titlebar)/i;
const LAYOUT_PROPERTY = /(?:^|;)\s*(?:position|z-index|display|visibility|pointer-events|transform|(?:min-|max-)?width|(?:min-|max-)?height)\s*:/im;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function text(value, fallback, max = 80) {
  const result = typeof value === "string" ? value.trim() : "";
  return (result || fallback).slice(0, max);
}

function hex(value, fallback) {
  return HEX.test(value ?? "") ? value.toUpperCase() : fallback;
}

function rgb(value) {
  return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
}

function toHex(values) {
  return `#${values.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function mix(a, b, weight = 0.5) {
  const aa = rgb(a);
  const bb = rgb(b);
  return toHex(aa.map((value, index) => value * (1 - weight) + bb[index] * weight));
}

function alpha(value, opacity) {
  const [r, g, b] = rgb(value);
  return `rgba(${r}, ${g}, ${b}, ${clamp(opacity, 0, 1, 1).toFixed(3)})`;
}

function luminance(value) {
  return rgb(value)
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

export function contrastRatio(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function paletteDefaults(mode, direction) {
  const presets = {
    "quiet-editorial": { accent: "#3867D6", support: "#7C8AA5", surface: "#F4F3EF", ink: "#20242B" },
    "aurora-glass": { accent: "#64DDF2", support: "#A58BFA", surface: "#0D1420", ink: "#F2F7FA" },
    "cyber-neon": { accent: "#F4E527", support: "#32D8FF", surface: "#080D18", ink: "#F5F7FA" },
    "warm-studio": { accent: "#FF7A45", support: "#E0A82E", surface: "#FAF4E8", ink: "#302821" },
  };
  const picked = presets[direction] ?? presets[mode === "dark" ? "aurora-glass" : "quiet-editorial"];
  if (mode === "dark" && luminance(picked.surface) > 0.25) return presets["aurora-glass"];
  if (mode === "light" && luminance(picked.surface) < 0.35) return presets["quiet-editorial"];
  return picked;
}

function normalizeWidget(raw, defaults, enabled) {
  return {
    enabled: enabled && raw?.enabled !== false,
    icon: text(raw?.icon, defaults.icon, 4),
    eyebrow: text(raw?.eyebrow, defaults.eyebrow, 24),
    title: text(raw?.title, defaults.title, 32),
    caption: text(raw?.caption, defaults.caption, 56),
  };
}

export function normalizeBrief(raw = {}) {
  const mode = MODES.has(raw.mode) ? raw.mode : "light";
  const direction = DIRECTIONS.has(raw.direction) ? raw.direction : (mode === "dark" ? "aurora-glass" : "quiet-editorial");
  const defaults = paletteDefaults(mode, direction);
  const palette = {
    accent: hex(raw.palette?.accent, defaults.accent),
    support: hex(raw.palette?.support, defaults.support),
    surface: hex(raw.palette?.surface, defaults.surface),
    ink: hex(raw.palette?.ink, defaults.ink),
  };
  const corrections = [];
  if (contrastRatio(palette.ink, palette.surface) < 4.5) {
    palette.ink = mode === "dark" ? "#F4F7FA" : "#1D232B";
    corrections.push("ink-adjusted-for-contrast");
  }
  const id = text(raw.id, `cursor-theme-${Date.now()}`, 48).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!SAFE_ID.test(id)) throw new Error("Theme id must contain only letters, digits, hyphens, and underscores");
  const density = DENSITIES.has(raw.decorations?.density) ? raw.decorations.density : "light";
  const allowSidebar = density !== "none";
  const allowCorner = density === "standard";
  return {
    id,
    name: text(raw.name, id, 64),
    version: /^\d+\.\d+\.\d+$/.test(raw.version ?? "") ? raw.version : "1.0.0",
    mode,
    direction,
    palette,
    background: {
      source: ["builtin", "upload", "generated", "none"].includes(raw.background?.source) ? raw.background.source : "builtin",
      position: text(raw.background?.position, "center right", 32),
      veil: clamp(raw.background?.veil, 0.35, 0.92, mode === "dark" ? 0.68 : 0.78),
      prompt: text(raw.background?.prompt, "", 360),
    },
    shape: {
      radius: clamp(raw.shape?.radius, 8, 24, 16),
      shadow: SHADOWS.has(raw.shape?.shadow) ? raw.shape.shadow : "soft",
    },
    decorations: {
      density,
      sidebarWidget: normalizeWidget(raw.decorations?.sidebarWidget, {
        icon: "✦", eyebrow: "CURSOR / STUDIO", title: "Focus mode", caption: "Theme synchronized",
      }, allowSidebar),
      cornerCard: normalizeWidget(raw.decorations?.cornerCard, {
        icon: "C", eyebrow: "CREATIVE SPACE", title: "Build with clarity", caption: "Ideas in motion",
      }, allowCorner),
    },
    copy: {
      tagline: text(raw.copy?.tagline, "Build with clarity", 72),
    },
    corrections,
  };
}

function themeColors(brief) {
  const { mode, palette } = brief;
  const dark = mode === "dark";
  const panel = dark ? mix(palette.surface, "#FFFFFF", 0.065) : mix(palette.surface, "#FFFFFF", 0.56);
  const elevated = dark ? mix(palette.surface, "#FFFFFF", 0.11) : mix(palette.surface, "#FFFFFF", 0.76);
  const under = dark ? mix(palette.surface, "#000000", 0.32) : mix(palette.surface, palette.accent, 0.035);
  const muted = mix(palette.ink, palette.surface, dark ? 0.42 : 0.46);
  const border = mix(palette.surface, palette.ink, dark ? 0.22 : 0.16);
  return { panel, elevated, under, muted, border };
}

export function generateCss(briefInput) {
  const brief = normalizeBrief(briefInput);
  const { palette, mode, shape, background } = brief;
  const c = themeColors(brief);
  const dark = mode === "dark";
  const veil = background.veil;
  const shadow = shape.shadow === "none"
    ? "none"
    : shape.shadow === "crisp"
      ? `0 10px 28px ${alpha("#000000", dark ? 0.34 : 0.13)}, 0 0 0 1px ${alpha(c.border, 0.55)}`
      : `0 18px 48px ${alpha("#000000", dark ? 0.30 : 0.11)}, inset 0 1px ${alpha("#FFFFFF", dark ? 0.08 : 0.72)}`;
  const artPosition = background.position.replace(/[^a-z0-9% .-]/gi, "");
  const baseGradient = dark
    ? `radial-gradient(circle at 82% 8%, ${alpha(palette.support, 0.16)}, transparent 34%), linear-gradient(145deg, ${c.under}, ${palette.surface} 52%, ${mix(palette.surface, palette.accent, 0.08)})`
    : `radial-gradient(circle at 82% 8%, ${alpha(palette.support, 0.14)}, transparent 34%), linear-gradient(145deg, ${mix(palette.surface, "#FFFFFF", 0.58)}, ${palette.surface} 56%, ${mix(palette.surface, palette.accent, 0.07)})`;
  const editorVeil = dark
    ? `linear-gradient(90deg, ${alpha(c.under, Math.min(0.96, veil + 0.14))} 0%, ${alpha(c.under, veil)} 58%, ${alpha(c.under, Math.max(0.32, veil - 0.24))} 100%)`
    : `linear-gradient(90deg, ${alpha(c.elevated, Math.min(0.98, veil + 0.12))} 0%, ${alpha(c.elevated, veil)} 58%, ${alpha(c.elevated, Math.max(0.38, veil - 0.24))} 100%)`;

  return `/* Generated by Cursor Theme Studio. Declarative tokens first; native geometry is untouched. */
:root.cursor-theme-studio-skin {
  color-scheme: ${mode} !important;
  --cts-accent: ${palette.accent};
  --cts-support: ${palette.support};
  --cts-surface: ${palette.surface};
  --cts-panel: ${c.panel};
  --cts-elevated: ${c.elevated};
  --cts-under: ${c.under};
  --cts-ink: ${palette.ink};
  --cts-muted: ${c.muted};
  --cts-border: ${c.border};
  --cts-radius: ${shape.radius}px;
  --vscode-foreground: ${palette.ink} !important;
  --vscode-descriptionForeground: ${c.muted} !important;
  --vscode-editor-background: ${alpha(c.panel, dark ? 0.72 : 0.82)} !important;
  --vscode-editor-foreground: ${palette.ink} !important;
  --vscode-sideBar-background: ${alpha(c.under, dark ? 0.78 : 0.88)} !important;
  --vscode-sideBar-foreground: ${palette.ink} !important;
  --vscode-sideBar-border: ${alpha(c.border, 0.72)} !important;
  --vscode-activityBar-background: ${mix(c.under, "#000000", dark ? 0.18 : 0)} !important;
  --vscode-activityBar-foreground: ${palette.ink} !important;
  --vscode-activityBar-activeBorder: ${palette.accent} !important;
  --vscode-titleBar-activeBackground: ${c.under} !important;
  --vscode-titleBar-activeForeground: ${palette.ink} !important;
  --vscode-titleBar-inactiveBackground: ${c.under} !important;
  --vscode-panel-background: ${alpha(c.panel, dark ? 0.78 : 0.88)} !important;
  --vscode-panel-border: ${alpha(c.border, 0.72)} !important;
  --vscode-statusBar-background: ${c.under} !important;
  --vscode-statusBar-foreground: ${c.muted} !important;
  --vscode-tab-activeBackground: ${c.elevated} !important;
  --vscode-tab-inactiveBackground: ${alpha(c.under, 0.92)} !important;
  --vscode-tab-activeForeground: ${palette.ink} !important;
  --vscode-tab-inactiveForeground: ${c.muted} !important;
  --vscode-input-background: ${alpha(c.elevated, dark ? 0.90 : 0.92)} !important;
  --vscode-input-foreground: ${palette.ink} !important;
  --vscode-input-border: ${c.border} !important;
  --vscode-focusBorder: ${palette.accent} !important;
  --vscode-button-background: ${palette.accent} !important;
  --vscode-button-foreground: ${dark ? c.under : "#FFFFFF"} !important;
  --vscode-list-hoverBackground: ${alpha(palette.accent, dark ? 0.13 : 0.09)} !important;
  --vscode-list-activeSelectionBackground: ${alpha(palette.accent, dark ? 0.20 : 0.14)} !important;
  --vscode-list-activeSelectionForeground: ${palette.ink} !important;
  --composer-pane-background: ${alpha(c.panel, dark ? 0.72 : 0.86)} !important;
  --cursor-text-link: ${palette.accent} !important;
}

#cursor-theme-studio-backdrop {
  position: fixed !important;
  inset: 0 !important;
  z-index: 0 !important;
  pointer-events: none !important;
  background-image: ${editorVeil}, var(--cursor-theme-art, none), ${baseGradient} !important;
  background-repeat: no-repeat !important;
  background-size: cover, cover, cover !important;
  background-position: center, ${artPosition || "center right"}, center !important;
}

html.cursor-theme-studio-skin body,
html.cursor-theme-studio-skin .monaco-workbench {
  color: var(--cts-ink) !important;
  background: transparent !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Microsoft YaHei UI", system-ui, sans-serif !important;
}

html.cursor-theme-studio-skin body > div:first-of-type,
html.cursor-theme-studio-skin .logged-out-glass-screen,
html.cursor-theme-studio-skin .workspaces-container,
html.cursor-theme-studio-skin .workspace-container,
html.cursor-theme-studio-skin .agent-panel,
html.cursor-theme-studio-skin .glass-agent-drop-target,
html.cursor-theme-studio-skin .glass-sidebar-docked {
  background-color: ${alpha(c.under, dark ? 0.08 : 0.18)} !important;
  background-image: none !important;
  border-color: ${alpha(c.border, 0.45)} !important;
  color: var(--cts-ink) !important;
}

html.cursor-theme-studio-skin .agent-panel {
  background-color: ${alpha(c.panel, dark ? 0.05 : 0.16)} !important;
  box-shadow: inset 0 0 0 1px ${alpha(palette.accent, dark ? 0.14 : 0.10)} !important;
  backdrop-filter: blur(8px) saturate(1.1) !important;
}

html.cursor-theme-studio-skin .glass-sidebar-docked {
  background: linear-gradient(180deg, ${alpha(c.under, dark ? 0.28 : 0.40)}, ${alpha(c.panel, dark ? 0.12 : 0.24)}) !important;
  box-shadow: inset -1px 0 ${alpha(palette.accent, dark ? 0.24 : 0.14)} !important;
  backdrop-filter: blur(16px) saturate(1.15) !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.activitybar {
  color: var(--cts-ink) !important;
  background: linear-gradient(180deg, ${alpha(c.under, 0.98)}, ${alpha(mix(c.under, "#000000", dark ? 0.2 : 0), 0.96)}) !important;
  border-color: ${alpha(c.border, 0.72)} !important;
  box-shadow: inset -1px 0 ${alpha("#FFFFFF", dark ? 0.05 : 0.66)} !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.sidebar {
  color: var(--cts-ink) !important;
  background: linear-gradient(180deg, ${alpha(c.under, 0.97)}, ${alpha(c.panel, 0.94)}) !important;
  border-color: ${alpha(c.border, 0.72)} !important;
  box-shadow: inset -1px 0 ${alpha("#FFFFFF", dark ? 0.05 : 0.66)} !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.editor {
  color: var(--cts-ink) !important;
  background: ${alpha(c.panel, dark ? 0.55 : 0.7)} !important;
  border-color: ${alpha(c.border, 0.66)} !important;
  box-shadow: ${shadow} !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.editor.cursor-theme-art-shell,
html.cursor-theme-studio-skin .monaco-workbench .part.editor > .content.cursor-theme-art-shell {
  background-image: ${editorVeil}, var(--cursor-theme-art), ${baseGradient} !important;
  background-repeat: no-repeat !important;
  background-size: cover, cover, cover !important;
  background-position: center, ${artPosition || "center right"}, center !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.auxiliarybar {
  color: var(--cts-ink) !important;
  background: linear-gradient(180deg, ${alpha(c.panel, 0.86)}, ${alpha(c.under, 0.82)}) !important;
  border-color: ${alpha(c.border, 0.72)} !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.panel {
  color: var(--cts-ink) !important;
  background: ${alpha(c.panel, 0.88)} !important;
  border-color: ${alpha(c.border, 0.72)} !important;
}

html.cursor-theme-studio-skin .monaco-workbench .part.titlebar {
  color: var(--cts-ink) !important;
  background: ${alpha(c.under, 0.92)} !important;
  border-color: ${alpha(c.border, 0.6)} !important;
}

html.cursor-theme-studio-skin :is(.composer-bar, .composer-bar.editor, [class*="composer"], [class*="agent-input"], textarea, [contenteditable="true"]) {
  color: var(--cts-ink) !important;
  border-color: ${alpha(palette.accent, dark ? 0.38 : 0.28)} !important;
  border-radius: calc(var(--cts-radius) + 4px) !important;
  box-shadow: 0 0 0 1px ${alpha(palette.accent, 0.08)}, 0 16px 40px ${alpha("#000000", dark ? 0.28 : 0.10)} !important;
}

html.cursor-theme-studio-skin :is([role="dialog"], [aria-modal="true"], [role="menu"], .monaco-dialog-box) {
  color: var(--cts-ink) !important;
  background-color: ${alpha(c.elevated, dark ? 0.98 : 0.985)} !important;
  border-color: ${alpha(c.border, 0.78)} !important;
  box-shadow: 0 22px 70px ${alpha("#000000", dark ? 0.46 : 0.18)} !important;
}

html.cursor-theme-studio-skin :is(button, [role="button"], a):focus-visible {
  outline-color: var(--cts-accent) !important;
}

#cursor-theme-studio-decorations {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  color: var(--cts-ink);
}

#cursor-theme-studio-decorations[hidden],
#cursor-theme-studio-decorations [hidden] { display: none !important; }

.cts-decoration {
  position: fixed;
  box-sizing: border-box;
  pointer-events: none;
  overflow: visible;
}

/* Integrated spine: thin light filament only. */
.cts-spine {
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.cts-spine-rail {
  width: 2px;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent 0%, ${palette.accent} 22%, ${palette.support} 62%, transparent 100%);
  box-shadow: 0 0 16px ${alpha(palette.accent, 0.4)}, 0 0 2px ${alpha(palette.accent, 0.75)};
  opacity: 0.85;
}

/* Soft signature: ambient glow + whisper text, no badge chrome. */
.cts-signature {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 0 4px 2px 0;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.cts-signature-glow {
  position: absolute;
  right: -36px;
  bottom: -40px;
  width: 160px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, ${alpha(palette.accent, 0.18)}, ${alpha(palette.support, 0.06)} 48%, transparent 74%);
  filter: blur(2px);
  z-index: 0;
}

.cts-signature-copy {
  position: relative;
  z-index: 1;
}

.cts-signature-title {
  color: ${alpha(palette.ink, 0.55)};
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: lowercase;
  font-variant: small-caps;
}

@media (max-width: 1179px), (max-height: 719px) {
  #cursor-theme-studio-decorations { display: none !important; }
}

@media (prefers-reduced-motion: reduce) {
  html.cursor-theme-studio-skin *, html.cursor-theme-studio-skin *::before, html.cursor-theme-studio-skin *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
`;
}

function assertInside(base, target, label) {
  const relative = path.relative(base, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`${label} must stay inside the theme directory`);
}

export function validateCss(css) {
  if (typeof css !== "string" || !css.trim()) throw new Error("Theme CSS is empty");
  for (const pattern of UNSAFE_CSS) {
    if (pattern.test(css)) throw new Error(`Unsafe theme CSS matched ${pattern}`);
  }
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (NATIVE_SELECTOR.test(rule[1]) && LAYOUT_PROPERTY.test(rule[2])) throw new Error("Theme CSS mutates native layout geometry");
  }
  return true;
}

export async function listThemes(options = {}) {
  const root = path.resolve(options.outputRoot ?? themesRoot);
  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const themes = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    if (!SAFE_ID.test(entry.name)) continue;
    try {
      const loaded = await loadTheme(path.join(root, entry.name, `${entry.name}.json`));
      const briefPath = path.join(root, entry.name, "brief.json");
      let brief = null;
      try { brief = JSON.parse(await fs.readFile(briefPath, "utf8")); } catch { /* optional */ }
      themes.push({
        id: loaded.manifest.id,
        displayName: loaded.manifest.displayName,
        version: loaded.manifest.version,
        mode: loaded.manifest.design?.mode ?? brief?.mode ?? "dark",
        direction: loaded.manifest.design?.direction ?? brief?.direction ?? "custom",
        palette: loaded.manifest.design?.palette ?? brief?.palette ?? null,
        art: loaded.manifest.art,
        artUrl: loaded.manifest.art ? `/api/themes/${loaded.manifest.id}/art` : null,
        density: loaded.manifest.decorations?.density ?? brief?.decorations?.density ?? "light",
        tagline: loaded.manifest.copy?.tagline ?? brief?.copy?.tagline ?? "",
        manifestPath: loaded.manifestPath,
        themeDir: path.dirname(loaded.manifestPath),
      });
    } catch {
      /* skip broken theme folders */
    }
  }
  return themes.sort((a, b) => a.id.localeCompare(b.id));
}

export async function createTheme(briefInput, options = {}) {
  const brief = normalizeBrief(briefInput);
  const outputRoot = path.resolve(options.outputRoot ?? themesRoot);
  const themeDir = path.join(outputRoot, brief.id);
  await fs.mkdir(themeDir, { recursive: true });
  const css = generateCss(brief);
  validateCss(css);

  let art = null;
  const sourceArt = options.artPath ? path.resolve(options.artPath) : null;
  if (sourceArt) {
    const extension = path.extname(sourceArt).toLowerCase();
    if (!ART_EXTENSIONS.has(extension)) throw new Error("Artwork must be PNG, JPEG, or WebP");
    const stat = await fs.stat(sourceArt);
    if (!stat.isFile() || stat.size > 24 * 1024 * 1024) throw new Error("Artwork is missing or too large");
    art = `background${extension === ".jpeg" ? ".jpg" : extension}`;
    await fs.copyFile(sourceArt, path.join(themeDir, art));
  } else if (options.artData) {
    const extension = ART_EXTENSIONS.has(options.artExtension) ? options.artExtension : ".png";
    if (options.artData.length > 24 * 1024 * 1024) throw new Error("Artwork is too large");
    art = `background${extension === ".jpeg" ? ".jpg" : extension}`;
    await fs.writeFile(path.join(themeDir, art), options.artData);
  } else if (brief.background.source === "builtin") {
    const builtin = path.join(skillRoot, "assets", "studio-default-art.png");
    try {
      await fs.access(builtin);
      art = "background.png";
      await fs.copyFile(builtin, path.join(themeDir, art));
    } catch {
      brief.corrections.push("builtin-art-missing-gradient-fallback-used");
    }
  }

  const manifest = {
    schemaVersion: 1,
    engine: "cursor-theme-studio",
    id: brief.id,
    displayName: brief.name,
    version: brief.version,
    css: "theme.css",
    art,
    design: { mode: brief.mode, direction: brief.direction, palette: brief.palette, shape: brief.shape },
    background: brief.background,
    decorations: brief.decorations,
    copy: {
      brandTitle: brief.name,
      brandSubtitle: "Cursor Theme Studio",
      signature: brief.copy.tagline,
      tagline: brief.copy.tagline,
    },
    baseTheme: {
      mode: brief.mode,
      accent: brief.palette.accent,
      contrast: Math.round(contrastRatio(brief.palette.ink, brief.palette.surface) * 10),
      ink: brief.palette.ink,
      surface: brief.palette.surface,
      fonts: { windowsCode: "Cascadia Code", windowsUi: "Microsoft YaHei UI", macCode: "SF Mono", macUi: "PingFang SC" },
    },
  };
  const manifestPath = path.join(themeDir, `${brief.id}.json`);
  const cssPath = path.join(themeDir, "theme.css");
  await Promise.all([
    fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8"),
    fs.writeFile(cssPath, css, "utf8"),
    fs.writeFile(path.join(themeDir, "brief.json"), `${JSON.stringify(brief, null, 2)}\n`, "utf8"),
  ]);
  return { brief, manifest, manifestPath, cssPath, themeDir, artPath: art ? path.join(themeDir, art) : null };
}

export function resolveThemeManifest(reference) {
  if (!reference) throw new Error("A theme id or manifest path is required");
  if (SAFE_ID.test(reference)) return path.join(themesRoot, reference, `${reference}.json`);
  return path.resolve(reference);
}

export async function loadTheme(reference) {
  const manifestPath = resolveThemeManifest(reference);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifest.schemaVersion !== 1 || !SAFE_ID.test(manifest.id ?? "")) throw new Error("Unsupported or unsafe theme manifest");
  for (const key of ["displayName", "version", "css"]) {
    if (typeof manifest[key] !== "string" || !manifest[key].trim()) throw new Error(`Missing manifest field: ${key}`);
  }
  const base = path.dirname(manifestPath);
  const cssPath = path.resolve(base, manifest.css);
  assertInside(base, cssPath, "CSS path");
  const css = await fs.readFile(cssPath, "utf8");
  validateCss(css);
  let artPath = null;
  if (manifest.art) {
    artPath = path.resolve(base, manifest.art);
    assertInside(base, artPath, "Artwork path");
    if (!ART_EXTENSIONS.has(path.extname(artPath).toLowerCase())) throw new Error("Unsupported artwork type");
    await fs.access(artPath);
  }
  return { manifest, manifestPath, cssPath, css, artPath };
}

function mimeType(filename) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

export async function buildThemePackage(reference) {
  const theme = await loadTheme(reference);
  const manifest = { ...theme.manifest, css: "theme.css", art: theme.artPath ? path.basename(theme.artPath) : null };
  const bundle = {
    format: "cursor-theme",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    manifest,
    css: theme.css,
  };
  if (theme.artPath) {
    bundle.art = { filename: path.basename(theme.artPath), mimeType: mimeType(theme.artPath), base64: (await fs.readFile(theme.artPath)).toString("base64") };
  }
  const serialized = `${JSON.stringify(bundle, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > MAX_PACKAGE_BYTES) throw new Error("Theme package exceeds 30 MB");
  return { bundle, serialized };
}

export async function importThemePackage(packagePath, options = {}) {
  const source = path.resolve(packagePath);
  const stat = await fs.stat(source);
  if (!stat.isFile() || stat.size > MAX_PACKAGE_BYTES) throw new Error("Theme package is missing or exceeds 30 MB");
  const bundle = JSON.parse(await fs.readFile(source, "utf8"));
  if (bundle.format !== "cursor-theme" || bundle.schemaVersion !== 1) throw new Error("Unsupported theme package format");
  const manifest = bundle.manifest;
  if (!manifest || manifest.schemaVersion !== 1 || !SAFE_ID.test(manifest.id ?? "")) throw new Error("Unsafe package manifest");
  for (const key of ["displayName", "version"]) {
    if (typeof manifest[key] !== "string" || !manifest[key].trim()) throw new Error(`Missing package manifest field: ${key}`);
  }
  validateCss(bundle.css);
  let art = null;
  let artData = null;
  if (bundle.art) {
    if (!manifest.art || path.basename(manifest.art) !== manifest.art || path.basename(bundle.art.filename ?? "") !== bundle.art.filename) throw new Error("Unsafe packaged artwork name");
    const extension = path.extname(bundle.art.filename).toLowerCase();
    if (!ART_EXTENSIONS.has(extension) || !["image/png", "image/jpeg", "image/webp"].includes(bundle.art.mimeType)) throw new Error("Unsupported packaged artwork type");
    if (typeof bundle.art.base64 !== "string" || !/^[a-z0-9+/=]+$/i.test(bundle.art.base64)) throw new Error("Invalid packaged artwork data");
    artData = Buffer.from(bundle.art.base64, "base64");
    if (!artData.length || artData.length > 24 * 1024 * 1024) throw new Error("Packaged artwork is empty or too large");
    art = bundle.art.filename;
  } else if (manifest.art) {
    throw new Error("Package manifest references missing artwork");
  }
  const outputRoot = path.resolve(options.outputRoot ?? themesRoot);
  const themeDir = path.join(outputRoot, manifest.id);
  try {
    await fs.access(themeDir);
    if (!options.force) throw new Error(`Theme ${manifest.id} already exists; use --force to replace it`);
    await fs.rm(themeDir, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await fs.mkdir(themeDir, { recursive: true });
  const normalizedManifest = { ...manifest, engine: manifest.engine ?? "cursor-theme-studio", css: "theme.css", art };
  const manifestPath = path.join(themeDir, `${manifest.id}.json`);
  await Promise.all([
    fs.writeFile(manifestPath, `${JSON.stringify(normalizedManifest, null, 2)}\n`, "utf8"),
    fs.writeFile(path.join(themeDir, "theme.css"), bundle.css, "utf8"),
    ...(art ? [fs.writeFile(path.join(themeDir, art), artData)] : []),
  ]);
  return { imported: true, id: manifest.id, manifestPath, themeDir, artPath: art ? path.join(themeDir, art) : null };
}
