// ==UserScript==
// @name         Google 文档深色模式
// @namespace    local.google-docs-night
// @version      3.0.0
// @description  一个图标切换深色模式，图片保持原色，自动记住选择。
// @match        https://docs.google.com/document/*
// @run-at       document-start
// @sandbox      raw
// @grant        none
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  installDocsCanvasTheme();

// Call once, inside the userscript IIFE, at document-start in MAIN_WORLD.
function installDocsCanvasTheme() {
  const selector = 'canvas.kix-canvas-tile-content';
  const byCanvas = new WeakMap();
  const byContext = new WeakMap();
  const dirty = new Set();
  const proto = CanvasRenderingContext2D.prototype;
  const getContext = HTMLCanvasElement.prototype.getContext;
  const native = Object.fromEntries(Object.getOwnPropertyNames(proto)
    .filter(name => typeof Object.getOwnPropertyDescriptor(proto, name).value === 'function')
    .map(name => [name, proto[name]]));
  const properties = ['direction', 'filter', 'font', 'fontKerning', 'fontStretch',
    'fontVariantCaps', 'globalAlpha', 'globalCompositeOperation', 'imageSmoothingEnabled',
    'imageSmoothingQuality', 'letterSpacing', 'lineCap', 'lineDashOffset', 'lineJoin',
    'lineWidth', 'miterLimit', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY',
    'textAlign', 'textBaseline', 'textRendering', 'wordSpacing'];
  const paintCache = new Map();
  let frame = 0;

  // Assigning the current pixel size also clears a canvas and its saved state.
  for (const key of ['width', 'height']) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, key);
    Object.defineProperty(HTMLCanvasElement.prototype, key, {
      ...descriptor,
      set(value) {
        descriptor.set.call(this, value);
        const record = byCanvas.get(this);
        if (record) {
          record.canvas[key] = descriptor.get.call(this);
          queue(record);
        }
      },
    });
  }
  const setAttribute = HTMLCanvasElement.prototype.setAttribute;
  HTMLCanvasElement.prototype.setAttribute = function (name, value) {
    const result = setAttribute.call(this, name, value);
    const key = String(name).toLowerCase();
    const record = byCanvas.get(this);
    if (record && (key === 'width' || key === 'height')) {
      record.canvas[key] = this[key];
      queue(record);
    }
    return result;
  };

  function darkPaint(value) {
    if (typeof value !== 'string') return value;
    if (paintCache.has(value)) return paintCache.get(value);
    let rgba;
    if (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) {
      rgba = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
      rgba.push(value.length === 9 ? parseInt(value.slice(7), 16) / 255 : 1);
    } else if (/^rgba?\(/.test(value)) {
      rgba = value.match(/[\d.]+/g).map(Number);
      if (rgba.length === 3) rgba.push(1);
    } else return value;
    const channels = rgba.slice(0, 3).map(n => n / 255);
    const light = (Math.min(...channels) + Math.max(...channels)) / 2;
    const target = .88 - .76 * light;
    const scale = Math.min(light ? target / light : 1,
      light < 1 ? (1 - target) / (1 - light) : 1);
    const mapped = channels.map(n => Math.round(255 * (target + (n - light) * scale)));
    const result = `rgba(${mapped.join(',')},${rgba[3]})`;
    paintCache.set(value, result);
    return result;
  }

  function syncSize(record) {
    const { source, canvas } = record;
    if (canvas.width !== source.width) canvas.width = source.width;
    if (canvas.height !== source.height) canvas.height = source.height;
  }

  function syncState(context, copy) {
    native.setTransform.call(copy, native.getTransform.call(context));
    native.setLineDash.call(copy, native.getLineDash.call(context));
    for (const key of properties) if (key in context) copy[key] = context[key];
    copy.fillStyle = darkPaint(context.fillStyle);
    copy.strokeStyle = darkPaint(context.strokeStyle);
    copy.shadowColor = darkPaint(context.shadowColor);
  }

  function recordFor(context) {
    let record = byContext.get(context);
    if (record) return record;
    const source = context.canvas;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.className = 'gdn-dark-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const options = native.getContextAttributes?.call(context);
    const copy = getContext.call(canvas, '2d', options);
    record = { source, canvas, copy, mounted: false, failed: false };
    byContext.set(context, record);
    byCanvas.set(source, record);
    queue(record);
    return record;
  }

  function queue(record) {
    if (!(record.source instanceof HTMLCanvasElement)) return;
    dirty.add(record);
    if (!frame) frame = requestAnimationFrame(layout);
  }

  const resize = new ResizeObserver(entries => {
    for (const entry of entries) {
      const record = byCanvas.get(entry.target);
      if (record) queue(record);
    }
  });

  function layout() {
    frame = 0;
    for (const record of dirty) {
      const { source, canvas } = record;
      if (record.failed || !source.isConnected || !source.matches(selector)) {
        canvas.remove();
        source.removeAttribute('data-gdn-mirrored');
        if (record.mounted) resize.unobserve(source);
        record.mounted = false;
        continue;
      }
      if (!record.mounted || source.nextSibling !== canvas) {
        source.after(canvas);
        source.setAttribute('data-gdn-mirrored', '');
        resize.observe(source);
        record.mounted = true;
      }
      const css = getComputedStyle(source);
      Object.assign(canvas.style, {
        position: 'absolute', left: `${source.offsetLeft}px`, top: `${source.offsetTop}px`,
        width: css.width, height: css.height, transform: css.transform,
        transformOrigin: css.transformOrigin, zIndex: css.zIndex,
        pointerEvents: 'none', margin: '0', border: '0', padding: '0',
        backgroundColor: '#1f1f1f',
      });
    }
    dirty.clear();
  }

  function mirror(context, name, args) {
    const record = recordFor(context);
    if (record.failed) return;
    syncSize(record);
    syncState(context, record.copy);
    if (name === 'drawImage') {
      const imageRecord = byCanvas.get(args[0]);
      if (imageRecord && !imageRecord.failed && imageRecord.source.matches(selector)) {
        syncSize(imageRecord);
        args = [imageRecord.canvas, ...args.slice(1)];
      }
    }
    native[name].apply(record.copy, args);
    queue(record);
  }

  const methods = ['beginPath', 'closePath', 'moveTo', 'lineTo', 'bezierCurveTo',
    'quadraticCurveTo', 'arc', 'arcTo', 'ellipse', 'rect', 'roundRect', 'clip',
    'save', 'restore', 'reset', 'fill', 'stroke', 'fillRect', 'strokeRect',
    'clearRect', 'fillText', 'strokeText', 'drawImage', 'putImageData'];
  for (const name of methods) {
    if (!native[name]) continue;
    proto[name] = function (...args) {
      const result = native[name].apply(this, args);
      try {
        mirror(this, name, args);
      } catch (error) {
        const record = byContext.get(this);
        if (record) {
          record.failed = true;
          record.source.setAttribute('data-gdn-mirror-error', error.name);
          queue(record);
        }
      }
      return result;
    };
  }

  const changes = new MutationObserver(records => {
    for (const mutation of records) {
      const own = byCanvas.get(mutation.target);
      if (own) queue(own);
      for (const node of [...mutation.addedNodes, ...mutation.removedNodes]) {
        if (!(node instanceof Element) || node.classList.contains('gdn-dark-canvas')) continue;
        for (const canvas of [node, ...node.querySelectorAll(selector)]) {
          const record = byCanvas.get(canvas);
          if (record) queue(record);
        }
      }
    }
  });
  changes.observe(document, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['style', 'class', 'width', 'height'] });

  const style = document.createElement('style');
  style.textContent = `
    canvas.gdn-dark-canvas { display: none !important; }
    @media screen {
      html[data-google-docs-dark] canvas[data-gdn-mirrored] { opacity: 0 !important; }
      html[data-google-docs-dark] canvas.gdn-dark-canvas { display: block !important; }
    }
    @media print { canvas.gdn-dark-canvas { display: none !important; } }
  `;
  function addStyle() { document.documentElement.append(style); }
  if (document.documentElement) addStyle();
  else document.addEventListener('DOMContentLoaded', addStyle, { once: true });
}

  const ATTRIBUTE = 'data-google-docs-dark';
  const BUTTON_ID = 'google-docs-dark-toggle';
  let dark = localStorage.getItem('google-docs-dark') === '1';

  function start() {
    const root = document.documentElement;
    root.toggleAttribute(ATTRIBUTE, dark);
    const style = document.createElement('style');
    style.textContent = `
@media screen {
  html[${ATTRIBUTE}] {
    color-scheme: dark;
    --gdn-bg: #191c20;
    --gdn-surface: #23272d;
    --gdn-raised: #2b3038;
    --gdn-hover: #363e49;
    --gdn-text: #e1e5eb;
    --gdn-muted: #b3bdcb;
    --gdn-border: #454d59;
    --gdn-accent: #adcaff;
    --gdn-selected: #334660;
  }
  html[${ATTRIBUTE}] :is(body, .docs-material, .docs-gm3, #docs-chrome,
    .goog-menu, .modal-dialog) {
    --gm3-sys-color-background: var(--gdn-bg);
    --gm3-sys-color-surface: var(--gdn-surface);
    --gm3-sys-color-surface-dim: var(--gdn-bg);
    --gm3-sys-color-surface-bright: var(--gdn-raised);
    --gm3-sys-color-surface-container-lowest: var(--gdn-bg);
    --gm3-sys-color-surface-container-low: var(--gdn-bg);
    --gm3-sys-color-surface-container: var(--gdn-surface);
    --gm3-sys-color-surface-container-high: var(--gdn-raised);
    --gm3-sys-color-surface-container-highest: var(--gdn-hover);
    --gm3-sys-color-on-background: var(--gdn-text);
    --gm3-sys-color-on-surface: var(--gdn-text);
    --gm3-sys-color-on-surface-variant: var(--gdn-muted);
    --gm3-sys-color-outline: var(--gdn-border);
    --gm3-sys-color-outline-variant: var(--gdn-border);
    --gm3-sys-color-primary: var(--gdn-accent);
    --gm3-sys-color-primary-container: var(--gdn-selected);
    --gm3-sys-color-on-primary-container: var(--gdn-accent);
    --gm3-sys-color-secondary-container: var(--gdn-selected);
    --gm3-sys-color-on-secondary-container: var(--gdn-text);
    --gm3-sys-color-tertiary-container: var(--gdn-selected);
    --gm3-sys-color-on-tertiary-container: var(--gdn-text);
  }
  html[${ATTRIBUTE}] body,
  html[${ATTRIBUTE}] :is(#docs-editor, .kix-appview, .kix-appview-editor,
    .kix-appview-editor-container) {
    background-color: var(--gdn-bg) !important;
    color: var(--gdn-text) !important;
    scrollbar-color: var(--gdn-border) var(--gdn-bg);
  }
  html[${ATTRIBUTE}] :is(#docs-chrome, .docs-titlebar, #docs-menubars,
    .docs-menubar, .navigation-widget, .kix-outlines-widget-header-contents,
    .left-sidebar-container, .docs-companion-app-switcher-container,
    .companion-app-switcher-container, .companion-collapser-button-container,
    .docs-sidebar, .docs-sidebar-content, .docs-ruler, .docs-ruler-inner) {
    background-color: var(--gdn-surface) !important;
    color: var(--gdn-text) !important;
    border-color: var(--gdn-border) !important;
  }
  html[${ATTRIBUTE}] :is(#docs-toolbar-wrapper, #docs-toolbar, .docs-main-toolbars,
    .goog-toolbar, .goog-menu, .goog-menu-vertical, .goog-submenu, .modal-dialog,
    .modal-dialog-title, .modal-dialog-content, .modal-dialog-buttons, .docs-bubble,
    .docs-bubble-content, .docs-findinput-container, .docs-findbar) {
    background-color: var(--gdn-raised) !important;
    color: var(--gdn-text) !important;
    border-color: var(--gdn-border) !important;
  }
  html[${ATTRIBUTE}] :is(.docs-title-input, .docs-title-input-label,
    .goog-menuitem-content, .goog-menuitem-accel, .goog-toolbar-button,
    .goog-toolbar-menu-button, .goog-toolbar-menu-button-caption,
    .goog-toolbar-combo-button, .goog-flat-menu-button, .goog-flat-menu-button-caption,
    .goog-control, .goog-menubar .goog-menuitem, .docs-menubar .goog-menuitem,
    .navigation-widget-header, .navigation-item, .navigation-item-content,
    .outline-refresh .outline-item, .outline-refresh .outline-item-content,
    .kix-outlines-widget-header-text-chaptered, .docs-ruler-number) {
    color: var(--gdn-text) !important;
  }
  html[${ATTRIBUTE}] :is(#docs-chrome, .goog-menu, .docs-sidebar, .modal-dialog,
    .docs-findbar) :is(input:not([type="checkbox"]):not([type="radio"]):not([type="color"]),
    textarea, select) {
    background-color: var(--gdn-surface) !important;
    color: var(--gdn-text) !important;
    border-color: var(--gdn-border) !important;
  }
  html[${ATTRIBUTE}] :is(.goog-menuitem-highlight, .goog-menuitem-hover,
    .goog-toolbar-button-hover, .goog-toolbar-menu-button-hover,
    .goog-flat-menu-button-hover, .goog-toolbar-combo-button-hover) {
    background-color: var(--gdn-hover) !important;
    border-color: var(--gdn-border) !important;
  }
  html[${ATTRIBUTE}] :is(.goog-toolbar-button-checked, .goog-toolbar-button-active,
    .goog-toolbar-menu-button-open, .goog-menuitem-selected, .navigation-item-selected) {
    background-color: var(--gdn-selected) !important;
    color: var(--gdn-accent) !important;
  }
  html[${ATTRIBUTE}] :is(.goog-menuseparator, .goog-toolbar-separator,
    .docs-ruler, .docs-ruler-face) { border-color: var(--gdn-border) !important; }
  html[${ATTRIBUTE}] .goog-menuitem-disabled { opacity: .45; }
  html[${ATTRIBUTE}] :is(#docs-chrome, .goog-menu, .docs-ruler,
    .navigation-widget, .docs-sidebar)
    .docs-icon-img:not(.docs-icon-masked-image):not([class*="logo"]):not([class*="warning"]) {
    filter: grayscale(1) brightness(0) invert(.88) !important;
  }
  html[${ATTRIBUTE}] :is(#docs-chrome, .goog-menu, .docs-ruler,
    .navigation-widget, .docs-sidebar) .docs-icon-masked-image {
    background-color: var(--gdn-text) !important;
  }
  html[${ATTRIBUTE}] :is(.kix-page, .kix-page-paginated) {
    background-color: #1f1f1f !important;
    border-color: var(--gdn-border) !important;
  }
  html[${ATTRIBUTE}] .kix-cursor-caret { border-color: var(--gdn-accent) !important; }

  #${BUTTON_ID} {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    margin: 0 4px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #444746;
    cursor: pointer;
    vertical-align: middle;
  }
  #${BUTTON_ID}:hover { background: #e8eaed; }
  #${BUTTON_ID}:focus-visible { outline: 2px solid #5c83c9; outline-offset: 2px; }
  #${BUTTON_ID} svg { display: block; width: 21px; height: 21px; pointer-events: none; }
  #${BUTTON_ID}.gdn-floating {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 10000;
    width: 42px;
    height: 42px;
    margin: 0;
    background: #f0f4f9;
    box-shadow: 0 2px 10px #0003;
  }
  html[${ATTRIBUTE}] #${BUTTON_ID} { color: var(--gdn-accent); }
  html[${ATTRIBUTE}] #${BUTTON_ID}.gdn-floating { background: var(--gdn-raised); }
  html[${ATTRIBUTE}] #${BUTTON_ID}:hover { background: var(--gdn-hover); }
}
@media print { #${BUTTON_ID} { display: none !important; } }
`;
    root.append(style);

    function mount() {
      const button = document.createElement('button');
      button.id = BUTTON_ID;
      button.type = 'button';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.8');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.append(path);
      button.append(svg);

      function render() {
        root.toggleAttribute(ATTRIBUTE, dark);
        const label = dark ? '切换到浅色模式' : '切换到深色模式';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(dark));
        path.setAttribute('d', dark
          ? 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42'
          : 'M20.5 13.2A8.6 8.6 0 0 1 10.8 3.5 8.6 8.6 0 1 0 20.5 13.2Z');
      }
      button.addEventListener('click', () => {
        dark = !dark;
        localStorage.setItem('google-docs-dark', dark ? '1' : '0');
        render();
      });
      const toolbar = document.querySelector('.docs-titlebar-buttons');
      if (toolbar) toolbar.prepend(button);
      else {
        button.className = 'gdn-floating';
        document.body.append(button);
      }
      render();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else mount();
  }

  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
