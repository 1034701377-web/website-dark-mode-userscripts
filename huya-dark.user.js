// ==UserScript==
// @name         虎牙深色模式
// @namespace    local.huya-dark
// @version      1.0.0
// @description  点击月亮开启深色模式，点击太阳恢复浅色，自动记住选择。
// @match        *://huya.com/*
// @match        *://*.huya.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const ATTRIBUTE = 'data-huya-dark';
  const BUTTON_ID = 'huya-dark-toggle';
  let dark = GM_getValue('huya-dark', false);

  function start() {
    const root = document.documentElement;
    root.toggleAttribute(ATTRIBUTE, dark);
    const style = document.createElement('style');
    style.textContent = `
@media screen {
  html[data-huya-dark] { color-scheme: dark; background: #12151b !important; }
  html[data-huya-dark] body {
    ---main_color_background01_common: #1e232c;
    ---main_color_text_dark01_common: #e7eaf0;
    ---main_color_text_dark02_common: #aeb5c2;
    ---main_color_text_dark03_common: #969ead;
    ---main_card_grey_bg_color: #252b35;
    ---main_color_divider01_dark_common: #343b48;
    background: #12151b !important;
    color: #e7eaf0 !important;
    scrollbar-color: #475160 #171b22;
  }
  html[data-huya-dark] body a { color: #cdd3df; }
  html[data-huya-dark] body a:hover { color: #ffb547; }
  html[data-huya-dark] #duya-header,
  html[data-huya-dark] #duya-header .duya-header-wrap {
    background: #1b2028 !important;
    box-shadow: 0 1px 0 #303744 !important;
  }
  html[data-huya-dark] #duya-header .hy-nav-link { color: #e7eaf0 !important; }
  html[data-huya-dark] #duya-header .hy-nav-item-on .hy-nav-link,
  html[data-huya-dark] #duya-header .hy-nav-link:hover { color: #ffb547 !important; }
  html[data-huya-dark] :is(.game-live-item, .host-item a, .superStar-item,
    .search-gameCard-item, .host-item .desc, .search-suggest, .nav-expand-list,
    [class^="helperbar--"], [class*=" helperbar--"], [class^="Panel--"],
    #wrap-news, .wrap-news) {
    background-color: #1e232c !important;
    border-color: #343b48 !important;
  }
  html[data-huya-dark] :is(.game-live-item:hover, .host-item a:hover) {
    box-shadow: 0 4px 16px #0005 !important;
  }
  html[data-huya-dark] :is(.game-live-item > .title, .host-item .nick,
    .search-gameCard-fullName, .search-suggest, .hot-search-list li a,
    [class^="ToolName--"], .classify-title, .link-item, .remen-item) {
    color: #e7eaf0 !important;
  }
  html[data-huya-dark] :is(.game-live-item .txt, .game-live-item .txt a,
    .search-main .search-box .box-hd .search-more, .search-suggest .search-title,
    .huya-footer, .huya-footer a, .huya-footer__bd p, .huya-footer__bd span,
    [class^="ToolDesc--"]) { color: #aeb5c2 !important; }
  html[data-huya-dark] .j_newsTabItem {
    background-color: #1e232c !important;
    color: #aeb5c2 !important;
  }
  html[data-huya-dark] .huya-footer {
    background: #171b22 !important;
    border-color: #343b48 !important;
  }
  html[data-huya-dark] :is(.search-nav, .inpage-advice-list li) {
    border-color: #343b48 !important;
  }
  html[data-huya-dark] .search-nav span.current { border-bottom-color: #ffd736 !important; }
  html[data-huya-dark] #search-bar-input {
    background: #1e232c !important;
    color: #e7eaf0 !important;
    caret-color: #ffd736;
  }
  html[data-huya-dark] input::placeholder { color: #8993a4 !important; }
  html[data-huya-dark] :is(.search-suggest .search-item.current,
    .search-suggest .search-item:hover) { background-color: #2c3441 !important; }

  html[data-huya-dark] [class*="search-match-schedule--"] { background-color: #191f29 !important; }
  html[data-huya-dark] [class*="search-match-schedule--"] [class*="schedule-bg--"] {
    background-color: #2d4c92 !important;
  }
  html[data-huya-dark] [class*="schedule-item--"] {
    background-color: #252d3a !important;
    color: #e7eaf0 !important;
  }
  html[data-huya-dark] [class*="schedule-item--"] > h2 { color: #c9d1df !important; }
  html[data-huya-dark] [class*="schedule-item--"] [class*="time--"] { color: #a6b0c1 !important; }
  html[data-huya-dark] [class*="schedule-item--"] :is([class*="score--"], [class*="name--"]) {
    color: #edf1f7 !important;
  }
  html[data-huya-dark] [class*="schedule-item--"] .j_playback {
    background-color: #303c50 !important;
    color: #e0e6f0 !important;
    border-color: #59677e !important;
  }
  html[data-huya-dark] :is([class*="helper-nav--"], [class*="helper-download--"],
    [class*="helper-game--"]) {
    background-color: #1e232c !important;
    border-color: #343b48 !important;
  }
  html[data-huya-dark] [class*="helper-nav--"] a { color: #b2bac8 !important; }
  html[data-huya-dark] [class*="helper-game--"] [class*="game-btn--"] {
    background-color: #303949 !important;
    color: #e7eaf0 !important;
  }
  html[data-huya-dark] .admin-menu a.selected {
    background-color: #3b2d1c !important;
    color: #ffc065 !important;
    border-color: #5b4323 !important;
  }

  html[data-huya-dark] :is(#J_roomHeader, .room-hd, .room-hd-main, .room-sidebar,
    .room-chat, .room-chat-hd, .room-chat-bd, .room-chat-tool,
    .room-chat-notice, #chat-room__wrap, .chat-room__list, .chat-room__input, #tipsOrchat) {
    background-color: #1e232c !important;
    color: #e7eaf0 !important;
    border-color: #343b48 !important;
  }
  html[data-huya-dark] :is(.room-hd-title, .host-name, .msg-normal, .msg.J_msg) {
    color: #e7eaf0 !important;
  }
  html[data-huya-dark] :is([class^="RoomMessageAnchorInfo--"], [class^="msg-content--"]) {
    background-color: #252b35 !important;
  }
  html[data-huya-dark] #pub_msg_input,
  html[data-huya-dark] :is(.chat-room__input, .room-chat-tool) :is(input, textarea) {
    background-color: #252b35 !important;
    color: #e7eaf0 !important;
    border-color: #475160 !important;
  }

  html[data-huya-dark] [data-huya-surface="card"] { background-color: #1e232c !important; }
  html[data-huya-dark] [data-huya-surface="muted"] { background-color: #252b35 !important; }
  html[data-huya-dark] [data-huya-text="primary"] { color: #e7eaf0 !important; }
  html[data-huya-dark] [data-huya-text="secondary"] { color: #aeb5c2 !important; }
  html[data-huya-dark] [data-huya-text="muted"] { color: #969ead !important; }
  html[data-huya-dark] [data-huya-borders~="top"] { border-top-color: #343b48 !important; }
  html[data-huya-dark] [data-huya-borders~="right"] { border-right-color: #343b48 !important; }
  html[data-huya-dark] [data-huya-borders~="bottom"] { border-bottom-color: #343b48 !important; }
  html[data-huya-dark] [data-huya-borders~="left"] { border-left-color: #343b48 !important; }

  #${BUTTON_ID} {
    position: fixed;
    left: 20px;
    bottom: 22px;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid #dce0e6;
    border-radius: 50%;
    background: #fff;
    color: #414957;
    box-shadow: 0 2px 10px #0002;
    cursor: pointer;
  }
  #${BUTTON_ID}:hover { background: #edf0f5; }
  #${BUTTON_ID}.huya-dark-inline {
    position: static;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    margin-right: 8px;
    align-self: center;
    box-shadow: none;
    border: 0;
    background: transparent;
  }
  #${BUTTON_ID}:focus-visible { outline: 2px solid #e29b32; outline-offset: 3px; }
  #${BUTTON_ID} svg { display: block; width: 21px; height: 21px; pointer-events: none; }
  html[data-huya-dark] #${BUTTON_ID} {
    background: #252b35;
    color: #ffbd61;
    border-color: #475160;
  }
  html[data-huya-dark] #${BUTTON_ID}:hover { background: #343d4b; }
}
@media print { #${BUTTON_ID} { display: none !important; } }
`;
    root.append(style);

    const skip = `#${BUTTON_ID}, video, canvas, svg, img, picture, iframe,
      object, embed, script, style, link, meta, template, noscript`;
    const pending = new Set();
    let walker;
    let scheduled = false;
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      scheduled = false;
      if (dark) flush();
    };

    function color(value) {
      if (!value.startsWith('rgb')) return null;
      const [r, g, b, alpha = 1] = value.match(/[\d.]+/g).map(Number);
      return {
        alpha,
        spread: Math.max(r, g, b) - Math.min(r, g, b),
        light: .213 * r + .715 * g + .072 * b,
      };
    }

    function hasDarkBackdrop(element) {
      for (let current = element; current && current !== root; current = current.parentElement) {
        if (current.hasAttribute('data-huya-surface')) return true;
        const css = getComputedStyle(current);
        if (css.backgroundImage !== 'none') return false;
        const background = color(css.backgroundColor);
        if (background && background.alpha >= .85) return background.light < 155;
      }
      return true;
    }

    function adapt(element) {
      element.removeAttribute('data-huya-surface');
      element.removeAttribute('data-huya-text');
      element.removeAttribute('data-huya-borders');
      const css = getComputedStyle(element);
      const background = color(css.backgroundColor);
      const text = color(css.color);
      const borders = [];
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        const border = color(css[`border${side}Color`]);
        if (parseFloat(css[`border${side}Width`]) > 0 && css[`border${side}Style`] !== 'none'
          && border && border.alpha >= .5 && border.spread <= 28 && border.light >= 95) {
          borders.push(side.toLowerCase());
        }
      }
      if (background && background.alpha >= .8 && background.spread <= 24
        && background.light >= 172 && css.backgroundImage === 'none') {
        element.setAttribute('data-huya-surface', background.light >= 238 ? 'card' : 'muted');
      }
      if (text && text.alpha >= .5 && text.spread <= 55 && text.light < 176
        && hasDarkBackdrop(element)) {
        element.setAttribute('data-huya-text', text.light < 90 ? 'primary' : text.light < 135 ? 'secondary' : 'muted');
      }
      if (borders.length) element.setAttribute('data-huya-borders', borders.join(' '));
    }

    function flush() {
      const deadline = performance.now() + 6;
      let count = 0;
      while ((walker || pending.size) && count < 100 && performance.now() < deadline) {
        let element;
        if (!walker) {
          element = pending.values().next().value;
          pending.delete(element);
          if (!element.isConnected || element.closest(skip)) continue;
          walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, {
            acceptNode: node => node.matches(skip) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
          });
        } else {
          element = walker.root.isConnected ? walker.nextNode() : null;
          if (!element) { walker = null; continue; }
        }
        adapt(element);
        count++;
      }
      if (walker || pending.size) schedule();
    }

    function schedule() {
      if (scheduled) return;
      scheduled = true;
      channel.port2.postMessage(null);
    }

    function enqueue(element) {
      if (!element.isConnected || element.closest(skip)) return;
      pending.add(element);
      schedule();
    }

    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) enqueue(node);
        }
      }
    });

    function updateAdaptation() {
      observer.disconnect();
      walker = null;
      pending.clear();
      if (dark) {
        observer.observe(document.body, { childList: true, subtree: true });
        enqueue(document.body);
      }
    }

    function mount() {
      const header = document.getElementById('duya-header');
      const headerNormal = header?.classList.contains('hy-header-style-normal');
      const headerSkr = header?.classList.contains('hy-header-style-skr');
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
        header?.classList.toggle('hy-header-style-normal', dark ? false : headerNormal);
        header?.classList.toggle('hy-header-style-skr', dark ? true : headerSkr);
        const label = dark ? '切换到浅色模式' : '切换到深色模式';
        button.title = label;
        button.setAttribute('aria-label', label);
        button.setAttribute('aria-pressed', String(dark));
        path.setAttribute('d', dark
          ? 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42'
          : 'M20.5 13.2A8.6 8.6 0 0 1 10.8 3.5 8.6 8.6 0 1 0 20.5 13.2Z');
        updateAdaptation();
      }
      button.addEventListener('click', () => {
        dark = !dark;
        GM_setValue('huya-dark', dark);
        render();
      });
      document.body.append(button);
      if (header) {
        const placeButton = () => {
          const headerTools = header.querySelector('#J_duyaHeaderRight > div');
          if (!headerTools) return;
          button.className = 'huya-dark-inline';
          headerTools.prepend(button);
          placement.disconnect();
        };
        const placement = new MutationObserver(placeButton);
        placement.observe(header, { childList: true, subtree: true });
        placeButton();
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
