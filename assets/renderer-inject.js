// input: 由 runtime 注入的 CSS / art data URL / theme 元数据占位符
// output: 在 Cursor workbench 中可逆安装主题与装饰
// pos: CDP Runtime.evaluate 注入载荷；不修改 Cursor.app
// 一旦我被更新，务必更新我的开头注释，以及所属的文件夹的 md。

(async (cssText, artDataUrl, theme) => {
  const STATE_KEY = "__CURSOR_THEME_STUDIO_STATE__";
  const STYLE_ID = "cursor-theme-studio-style";
  const DECORATIONS_ID = "cursor-theme-studio-decorations";
  const BACKDROP_ID = "cursor-theme-studio-backdrop";
  const MARKER = "cursor-theme-studio-skin";
  window.__CURSOR_THEME_STUDIO_DISABLED__ = false;

  const previous = window[STATE_KEY];
  previous?.observer?.disconnect();
  if (previous?.timer) clearInterval(previous.timer);
  if (previous?.scheduler) clearTimeout(previous.scheduler);
  if (previous?.resize) removeEventListener("resize", previous.resize);

  const sameArt = previous?.themeId === theme.id && previous?.themeVersion === theme.version;
  if (previous?.artUrl && !sameArt) URL.revokeObjectURL(previous.artUrl);
  const artUrl = sameArt ? previous.artUrl : (() => {
    if (!artDataUrl) return "none";
    const comma = artDataUrl.indexOf(",");
    const binary = atob(artDataUrl.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return URL.createObjectURL(new Blob([bytes], { type: artDataUrl.slice(5, artDataUrl.indexOf(";")) || "image/png" }));
  })();
  if (artUrl !== "none" && !sameArt) {
    const image = new Image();
    image.src = artUrl;
    try { await image.decode(); } catch { /* Gradient fallback remains usable. */ }
  }

  const visibleRect = (node) => {
    if (!(node instanceof Element)) return null;
    const style = getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1 || rect.bottom <= 0 || rect.right <= 0 || rect.top >= innerHeight || rect.left >= innerWidth) return null;
    return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
  };

  const expand = (rect, amount) => ({
    left: rect.left - amount, top: rect.top - amount, right: rect.right + amount, bottom: rect.bottom + amount,
    width: rect.width + amount * 2, height: rect.height + amount * 2,
  });
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const interactiveRects = () => [...document.querySelectorAll('button,a[href],input,textarea,select,[contenteditable="true"],[role="button"],[role="link"],[role="menuitem"],[role="option"],[role="tab"]')]
    .filter((node) => !node.closest(`#${DECORATIONS_ID}`))
    .map(visibleRect)
    .filter(Boolean);

  const addText = (parent, className, value) => {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = String(value ?? "");
    parent.appendChild(node);
    return node;
  };

  const createCard = (className, config) => {
    const card = document.createElement("section");
    card.className = `cts-decoration-card ${className}`;
    card.hidden = true;
    const inner = document.createElement("div");
    inner.className = "cts-decoration-inner";
    addText(inner, "cts-decoration-icon", config.icon);
    addText(inner, "cts-decoration-eyebrow", config.eyebrow);
    addText(inner, "cts-decoration-title", config.title);
    addText(inner, "cts-decoration-caption", config.caption);
    card.appendChild(inner);
    return card;
  };

  const ensureBackdrop = () => {
    let backdrop = document.getElementById(BACKDROP_ID);
    if (!backdrop || backdrop.parentElement !== document.body) {
      backdrop?.remove();
      backdrop = document.createElement("div");
      backdrop.id = BACKDROP_ID;
      backdrop.setAttribute("aria-hidden", "true");
      document.body.prepend(backdrop);
    }
    // Inline critical paint so glass shells cannot zero-out an empty layer.
    backdrop.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:0",
      "pointer-events:none",
      "background-repeat:no-repeat",
      "background-size:cover,cover,cover",
      "background-position:center,78% 35%,center",
      "background-image:linear-gradient(105deg, rgba(6,10,16,0.55) 0%, rgba(6,10,16,0.18) 38%, rgba(6,10,16,0.02) 68%, rgba(6,10,16,0.12) 100%), var(--cursor-theme-art, none), radial-gradient(circle at 80% 20%, rgba(126,231,255,0.22), transparent 40%), linear-gradient(145deg, #05080e, #0a1018 55%, #121a24)",
    ].join(";");
    return backdrop;
  };

  const ensureDecorations = () => {
    let container = document.getElementById(DECORATIONS_ID);
    if (!container || container.parentElement !== document.body || container.dataset.themeVersion !== `${theme.id}@${theme.version}`) {
      container?.remove();
      container = document.createElement("div");
      container.id = DECORATIONS_ID;
      container.setAttribute("aria-hidden", "true");
      container.dataset.themeId = theme.id;
      container.dataset.themeVersion = `${theme.id}@${theme.version}`;
      const sidebar = createCard("cts-sidebar-widget", theme.decorations.sidebarWidget);
      sidebar.dataset.slot = "sidebar-gap-widget";
      const corner = createCard("cts-corner-card", theme.decorations.cornerCard);
      corner.dataset.slot = "bottom-corner-card";
      container.append(sidebar, corner);
      document.body.appendChild(container);
    }
    return container;
  };

  const setBox = (node, rect) => {
    node.style.left = `${Math.round(rect.left)}px`;
    node.style.top = `${Math.round(rect.top)}px`;
    node.style.width = `${Math.round(rect.width)}px`;
    node.style.height = `${Math.round(rect.height)}px`;
    delete node.dataset.hiddenReason;
    node.hidden = false;
  };

  const hideCard = (node, reason) => {
    node.hidden = true;
    node.dataset.hiddenReason = reason;
  };

  const placeSidebarWidget = (node, aside, controls) => {
    hideCard(node, "not-placed");
    if (!theme.decorations.sidebarWidget.enabled) return hideCard(node, "disabled");
    const bounds = visibleRect(aside);
    if (!bounds || bounds.width < 160 || bounds.height < 420) return hideCard(node, "missing-or-compact-sidebar");
    const width = Math.min(188, bounds.width - 20);
    const height = 152;
    const insetTop = bounds.top + 64;
    const insetBottom = bounds.bottom - 56;
    const blockers = controls
      .filter((rect) => rect.right > bounds.left && rect.left < bounds.right && rect.bottom > insetTop && rect.top < insetBottom)
      .sort((a, b) => a.top - b.top);
    const gaps = [];
    let cursor = insetTop;
    for (const blocker of blockers) {
      if (blocker.top > cursor) gaps.push({ top: cursor, bottom: blocker.top });
      cursor = Math.max(cursor, blocker.bottom);
    }
    if (cursor < insetBottom) gaps.push({ top: cursor, bottom: insetBottom });
    const gap = gaps.filter((item) => item.bottom - item.top >= height + 18).sort((a, b) => (b.bottom - b.top) - (a.bottom - a.top))[0];
    if (!gap) return hideCard(node, "no-safe-gap");
    const candidate = {
      left: bounds.left + (bounds.width - width) / 2,
      top: gap.top + (gap.bottom - gap.top - height) / 2,
      right: bounds.left + (bounds.width + width) / 2,
      bottom: gap.top + (gap.bottom - gap.top + height) / 2,
      width,
      height,
    };
    if (controls.some((rect) => overlaps(candidate, expand(rect, 8)))) return hideCard(node, "interactive-collision");
    setBox(node, candidate);
  };

  const placeCornerCard = (node, main, controls) => {
    hideCard(node, "not-placed");
    if (!theme.decorations.cornerCard.enabled) return hideCard(node, "disabled");
    const bounds = visibleRect(main);
    if (!bounds || bounds.width < 640 || bounds.height < 420) return hideCard(node, "missing-or-compact-editor");
    const width = 190;
    const height = 122;
    const candidates = [
      { left: bounds.right - width - 24, top: bounds.bottom - height - 72 },
      { left: bounds.right - width - 24, top: bounds.top + Math.max(72, bounds.height * 0.56) },
    ];
    for (const position of candidates) {
      const candidate = { ...position, right: position.left + width, bottom: position.top + height, width, height };
      if (candidate.top < bounds.top + 48 || candidate.bottom > bounds.bottom - 12) continue;
      if (controls.some((rect) => overlaps(candidate, expand(rect, 10)))) continue;
      setBox(node, candidate);
      return;
    }
    hideCard(node, "no-collision-free-candidate");
  };

  const ensure = () => {
    if (window.__CURSOR_THEME_STUDIO_DISABLED__) return;
    const root = document.documentElement;
    if (!root || !document.body) return;
    root.classList.add(MARKER);
    root.dataset.cursorThemeStudio = theme.id;
    root.dataset.cursorThemeStudioVersion = theme.version;
    root.style.setProperty("--cursor-theme-art", artUrl === "none" ? "none" : `url("${artUrl}")`);

    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || root).appendChild(style);
    }
    if (style.textContent !== cssText) {
      style.textContent = cssText;
      style.dataset.themeVersion = `${theme.id}@${theme.version}`;
      style.dataset.cssBytes = String(cssText.length);
    }

    ensureBackdrop();
    const container = ensureDecorations();
    const sidebarWidget = container.querySelector(".cts-sidebar-widget");
    const cornerCard = container.querySelector(".cts-corner-card");

    let workbench = null;
    let glassShell = null;
    let sidebar = null;
    let editor = null;
    try {
      workbench = document.querySelector(".monaco-workbench");
      glassShell = document.querySelector(".logged-out-glass-screen, .workspaces-container, .workspace-container, .agent-panel")
        || document.querySelector(".glass-sidebar-docked")?.parentElement
        || [...document.body.children].find((node) => node instanceof HTMLElement && node.id !== STYLE_ID && node.id !== DECORATIONS_ID && node.id !== BACKDROP_ID && node.getBoundingClientRect().height > 200)
        || null;
      sidebar = document.querySelector(".glass-sidebar-docked")
        || document.querySelector(".monaco-workbench .part.sidebar")
        || document.querySelector(".part.sidebar");
      editor = document.querySelector(".agent-panel")
        || document.querySelector(".monaco-workbench .part.editor")
        || document.querySelector(".part.editor")
        || glassShell;
      document.querySelectorAll(".cursor-theme-art-shell").forEach((node) => node.classList.remove("cursor-theme-art-shell"));
      if (editor instanceof Element) {
        editor.classList.add("cursor-theme-art-shell");
        const content = editor.querySelector(".content");
        content?.classList.add("cursor-theme-art-shell");
      }
      if (glassShell instanceof Element) glassShell.classList.add("cursor-theme-art-shell");
    } catch {
      /* Cursor DOM variants should not block token CSS or decoration scaffolding. */
    }

    const dialogOpen = Boolean(document.querySelector('[role="dialog"],[aria-modal="true"],.monaco-dialog-box'));
    const compact = innerWidth < 900 || innerHeight < 600;
    const ready = Boolean(document.body);
    container.hidden = dialogOpen || compact || !ready;
    if (container.hidden) {
      const reason = dialogOpen ? "dialog-open" : compact ? "compact-window" : "not-ready";
      hideCard(sidebarWidget, reason);
      hideCard(cornerCard, reason);
      return;
    }
    const controls = interactiveRects();
    placeSidebarWidget(sidebarWidget, sidebar, controls);
    placeCornerCard(cornerCard, editor || workbench || glassShell || document.body, controls);
  };

  const cleanup = () => {
    window.__CURSOR_THEME_STUDIO_DISABLED__ = true;
    const state = window[STATE_KEY];
    state?.observer?.disconnect();
    if (state?.timer) clearInterval(state.timer);
    if (state?.scheduler) clearTimeout(state.scheduler);
    if (state?.resize) removeEventListener("resize", state.resize);
    document.documentElement?.classList.remove(MARKER);
    if (document.documentElement) {
      delete document.documentElement.dataset.cursorThemeStudio;
      delete document.documentElement.dataset.cursorThemeStudioVersion;
      document.documentElement.style.removeProperty("--cursor-theme-art");
    }
    document.querySelectorAll(".cursor-theme-art-shell").forEach((node) => node.classList.remove("cursor-theme-art-shell"));
    document.getElementById(STYLE_ID)?.remove();
    document.getElementById(DECORATIONS_ID)?.remove();
    document.getElementById(BACKDROP_ID)?.remove();
    if (state?.artUrl && state.artUrl !== "none") URL.revokeObjectURL(state.artUrl);
    delete window[STATE_KEY];
    return true;
  };

  let scheduler = null;
  const schedule = () => {
    if (scheduler) clearTimeout(scheduler);
    scheduler = setTimeout(() => { scheduler = null; ensure(); }, 160);
    if (window[STATE_KEY]) window[STATE_KEY].scheduler = scheduler;
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const resize = () => schedule();
  addEventListener("resize", resize, { passive: true });
  const timer = setInterval(ensure, 4000);
  window[STATE_KEY] = { cleanup, ensure, observer, resize, timer, scheduler, artUrl, themeId: theme.id, themeVersion: theme.version };
  ensure();
  return { installed: true, themeId: theme.id, version: theme.version };
})(__CTS_CSS_JSON__, __CTS_ART_JSON__, __CTS_THEME_JSON__)
