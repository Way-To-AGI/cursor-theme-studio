<!-- input: 设计 brief / 导出包约定 -->
<!-- output: 字段与安全约束说明 -->
<!-- pos: brief 与 .cursor-theme 契约 -->
<!-- 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。 -->

# Theme schema

The studio accepts a constrained JSON brief and compiles it into a manifest, CSS, and optional local artwork.

## Brief

```json
{
  "id": "aurora-focus",
  "name": "Aurora Focus",
  "mode": "dark",
  "direction": "aurora-glass",
  "palette": {
    "accent": "#72E6FF",
    "support": "#B78CFF",
    "surface": "#0D1420",
    "ink": "#F2F7FA"
  },
  "background": {
    "source": "builtin",
    "position": "center right",
    "veil": 0.72,
    "prompt": "quiet aurora over a glass observatory"
  },
  "shape": { "radius": 18, "shadow": "soft" },
  "decorations": {
    "density": "light",
    "sidebarWidget": { "enabled": true, "title": "Focus mode", "caption": "System ready", "icon": "✦" },
    "cornerCard": { "enabled": true, "title": "Create calmly", "caption": "Ideas in motion", "icon": "C" }
  },
  "copy": { "tagline": "Build with clarity" }
}
```

Only `light` and `dark` modes are accepted. IDs use letters, digits, hyphens, and underscores. Colors use six-digit hex. Text fields are length-clamped plain text.

`background.source` is `builtin`, `upload`, `generated`, or `none`.

`decorations.density` is `none`, `light`, or `standard`. Only `sidebarWidget` and `cornerCard` templates are supported; manifests cannot provide HTML, selectors, scripts, handlers, or arbitrary coordinates.

## Compiled manifest

```json
{
  "schemaVersion": 1,
  "engine": "cursor-theme-studio",
  "id": "aurora-focus",
  "displayName": "Aurora Focus",
  "version": "1.0.0",
  "css": "theme.css",
  "art": "background.png"
}
```

Portable `.cursor-theme` is UTF-8 JSON with `format: "cursor-theme"`, schema version 1, normalized manifest, full CSS, and optional Base64 artwork. Maximum size 30 MB.

Reject CSS containing `@import`, non-data `url(...)`, `javascript:`, `expression(`, `behavior:`, `-moz-binding`, or layout mutations on `.monaco-workbench` / `.part.*`.
