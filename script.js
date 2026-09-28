// ==UserScript==
// @name        Tweaks for rule34 by fs2k - Dark Mode, cosmetics, live previews, ad block and more
// @name:de     Tweaks für rule34 von fs2k - Dark Mode, Kosmetik, Live-Vorschau, Werbeblocker und mehr
// @namespace   fs2k-skript
// @version     1.027
//
// @match       https://rule34.xxx/*
// @grant       none
//
// @author      fs2k
// @license     GPL-3.0-or-later
// @description Adds a collapsible "Enhancer" bar with site-wide tweaks: thumbnail/page width, dark mode, sidebar/pagination/nav redesign, accent colors. Post overview/search: color-coded borders, hover zoom, live preview (original file + download button) on hover. Single-post pages: hide nav/ads/status notices, collapse comments, center & restyle content (incl. comment form), download the original file. Off by default, applies instantly, "?" tooltip per setting, saved permanently.
// @description:de Einklappbare "Enhancer"-Leiste mit seitenweiten Anpassungen: Thumbnail-/Seitenbreite, Dark Mode, Sidebar-/Paginierung-/Nav-Redesign, Akzentfarben. Übersicht/Suche: farbcodierte Rahmen, Hover-Zoom, Live-Vorschau (Original-Datei + Download-Button). Einzelpost-Seiten: Nav/Werbung/Status ausblenden, Kommentare einklappen, Inhalt zentrieren/umgestalten (inkl. Kommentarformular), Original-Datei laden. Standardmäßig aus, wirkt sofort, "?"-Tooltip pro Einstellung, dauerhaft gespeichert.
// @downloadURL https://update.sleazyfork.org/scripts/593861/Tweaks%20for%20rule34%20by%20fs2k%20-%20Dark%20Mode%2C%20cosmetics%2C%20live%20previews%2C%20ad%20block%20and%20more.user.js
// @updateURL https://update.sleazyfork.org/scripts/593861/Tweaks%20for%20rule34%20by%20fs2k%20-%20Dark%20Mode%2C%20cosmetics%2C%20live%20previews%2C%20ad%20block%20and%20more.meta.js
// ==/UserScript==

(function () {
    'use strict';
  
    /* ------------------------------ Config ------------------------------ */
  
    const CONFIG = {
      storageKey: 'r34e:settings:v1',
      width: { min: 120, max: 1000, step: 5 },
      // Width button-group presets alongside the free slider. "off" = page's detected default.
      widthPresets: [
        { value: 'off', label: 'Off' },
        { value: 120, label: '120' },
        { value: 350, label: '350' },
        { value: 470, label: '470' },
      ],
      borderColors: {
        image: '#e8c400',   // yellow
        video: '#2ecc71',   // green
        blocked: '#e0473f', // red
        widthPx: 2,
      },
      // Hover-zoom button group (transform:scale() on thumbnail). Values kept as strings.
      hoverZoomPresets: [
        { value: 'off', label: 'Off' },
        { value: '110', label: '110%' },
        { value: '120', label: '120%' },
        { value: '130', label: '130%' },
        { value: '140', label: '140%' },
        { value: '150', label: '150%' },
      ],
      dark: {
        bg0: '#141414', // page background
        bg1: '#1c1c1c', // large containers (sidebar, panel, very light elements)
        bg2: '#242424', // smaller elements (buttons, inputs, table rows ...)
        border: '#3a3a3a',
        text: '#dcdcdc',
        textDim: '#a0a0a0',
        // Non-visited link color = accent.dark below. Visited stays its own
        // color so the visited indicator is actually distinguishable.
        linkVisited: '#c298ff',
      },
      // Shared "brand" color for every interactive highlight (button fills,
      // hovers, current pagination page/menu tab, dark-mode link color).
      // Exposed as CSS custom properties (--r34e-accent/-text/-hover/-active,
      // redefined under html.r34e-dark) in injectBaseStyles() so a change
      // here applies everywhere at once.
      //   - accent: normal highlight — solid fill for always-on elements,
      //     hover/focus fill for neutral buttons
      //   - accent-hover: lighter tint, for elements whose resting state IS
      //     the accent color already (dark-mode text links)
      //   - accent-active: pressed/:active shade
      accent: {
        light: '#3b82f6',
        lightText: '#ffffff',
        lightHover: '#60a5fa',
        lightActive: '#1d4ed8', // was a hardcoded one-off hover color
        dark: '#aae5a4',
        darkText: '#10151c',
        darkHover: '#c3edbd',
        darkActive: '#74c96b',
      },
      // Pastel versions of the site's own tag-type colors (--c-link-artist/
      // -character/-copyright/-metadata), tuned to read on dark backgrounds.
      // One distinct hue per category for at-a-glance recognition.
      tagColors: {
        artist: '#fca5a5',    // light red  (was #cc0000 / #ff6b6b)
        character: '#86efac', // light green (was #00aa00 / #5ee08a)
        copyright: '#f9a8d4', // light pink (was #ff8800 / #ffb454)
        metadata: '#fde047',  // light yellow (was #0891b2 / #7dd3fc)
        general: '#93c5fd',   // light blue (was the plain accent color)
      },
      // Same tag colors at original saturation, for light-mode sidebar/menu accent bars.
      tagColorsLight: {
        artist: '#cc0000',
        character: '#00aa00',
        copyright: '#ff8800',
        metadata: '#0891b2',
        general: '#0000cc',
      },
      // OS-native UI font stack instead of the site's webfont.
      systemFontStack:
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      // Site-width presets. "off" = no cap; panel itself always stays full width.
      layout: {
        widthOptions: [
          { value: 'off', label: 'Off' },
          { value: '3400', label: '3400' },
          { value: '2500', label: '2500' },
          { value: '1700', label: '1700' },
          { value: '1200', label: '1200' },
        ],
      },
    };
  
    const DEFAULT_SETTINGS = {
      width: null,            // read from the page on first run
      originalWidth: null,    // site default detected by the script (used by "Reset")
      darkmode: false,
      linkColors: false,
      hoverZoom: 'off',       // Posts overview: thumbnail hover-zoom scale, 'off'|'110'..'150'
      disableAltText: false,  // Posts overview: blank alt/title so native tag-list tooltip doesn't show
      livePreview: false,     // Posts overview: thumbnail hover shows original file (video autoplays muted/looped); also reveals download button
      systemFont: false,
      pagination: false,
      commentFormStyle: false, // Style: restyles #comment_form to match the script's own look
      menuStyle: false,
      simpleHeader: false,    // Style: removes #site-title's background-image banner
      sidebarStyle: false,
      siteWidth: 'off',       // "Site width": 'off' | '3400' | '2500' | '1700' | '1200' — site default
      stickyPanel: false,     // Layout: pins the enhancer panel to the top while scrolling
      hideAds: false,         // Additions: hide the .postViewSidebarRight ad column + #pv_leaderboard
      hideNav: false,         // Single Post View: hide #navlinksContainer
      hideStatusNotices: false, // Single Post View: hide #status-notices
      roundedBoxes: false,    // Single Post View: card/pill style for status-notice boxes
      collapseComments: false, // Single Post View: comments start collapsed
      centerSingleView: false, // Single Post View: top-align image/video (capped 800px tall) + center media/comments
      downloadButton: false,  // Additions: download button on single-post pages
      expanded: false,        // whether the panel's settings are expanded
    };
  
    /* ------------------------------ Storage ------------------------------ */
  
    // @grant none means this is plain page localStorage, shared with the site
    // and any other extension on this origin. Coerce every field back to a
    // known range/type so a corrupted/tampered value falls back to its
    // DEFAULT_SETTINGS default instead of producing a broken UI/CSS state.
    function sanitizeSettings(raw) {
      const out = { ...DEFAULT_SETTINGS };
      const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
  
      if (isFiniteNumber(raw.width)) {
        out.width = clamp(Math.round(raw.width), CONFIG.width.min, CONFIG.width.max);
      }
      if (isFiniteNumber(raw.originalWidth)) {
        out.originalWidth = clamp(Math.round(raw.originalWidth), CONFIG.width.min, CONFIG.width.max);
      }
      // width/originalWidth otherwise stay null — "not detected yet".
  
      const validHoverZoomValues = CONFIG.hoverZoomPresets.map((p) => p.value);
      if (validHoverZoomValues.includes(raw.hoverZoom)) out.hoverZoom = raw.hoverZoom;
  
      const validSiteWidthValues = CONFIG.layout.widthOptions.map((o) => o.value);
      if (validSiteWidthValues.includes(raw.siteWidth)) out.siteWidth = raw.siteWidth;
  
      // Every remaining setting is a plain on/off checkbox.
      [
        'darkmode', 'linkColors', 'disableAltText', 'livePreview', 'systemFont', 'pagination',
        'commentFormStyle', 'menuStyle', 'simpleHeader', 'sidebarStyle', 'hideAds', 'hideNav',
        'hideStatusNotices', 'roundedBoxes', 'collapseComments',
        'centerSingleView', 'downloadButton', 'expanded', 'stickyPanel',
      ].forEach((key) => {
        if (typeof raw[key] === 'boolean') out[key] = raw[key];
      });
  
      return out;
    }
  
    function loadSettings() {
      try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_SETTINGS };
        return sanitizeSettings(parsed);
      } catch {
        return { ...DEFAULT_SETTINGS };
      }
    }
  
    function saveSettings(settings) {
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(settings));
      } catch {
        // Storage unavailable (private browsing, quota, ...) — won't persist.
      }
    }
  
    let settings = loadSettings();
  
    /* ---------------------------- Utilities ------------------------------ */
  
    function clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    }
  
    // Coalesces rapid-fire calls (e.g. a range-slider drag) to at most one
    // per animation frame, using the most recent args. Not a debounce —
    // no delay before the first update, just skips redundant extra calls.
    function rafThrottle(fn) {
      let scheduled = false;
      let lastArgs = [];
      return (...args) => {
        lastArgs = args;
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          fn(...lastArgs);
        });
      };
    }
  
    function parseRgb(str) {
      const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(str || '');
      if (!m) return null;
      return {
        r: parseFloat(m[1]),
        g: parseFloat(m[2]),
        b: parseFloat(m[3]),
        a: m[4] !== undefined ? parseFloat(m[4]) : 1,
      };
    }
  
    function luminance(r, g, b) {
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }
  
    /* --------------------- Thumbnail discovery & typing -------------------- */
  
    function findThumbnailImages() {
      const tiers = [
        // Confirmed real structure — try this first.
        '.content .image-list span.thumb a[href*="s=view"] img.preview',
        // Generic booru-engine fallback.
        'a[href*="page=post"][href*="s=view"] img',
        'a[href*="s=view"] img',
        // Last-resort class/id guesses.
        '.thumbnail-container img, #post-list img, .thumb img',
      ];
  
      for (const sel of tiers) {
        const found = Array.from(document.querySelectorAll(sel)).filter(
          // Exclude our own panel and the site's r34chibi.png mascot
          // placeholder (shown in the sidebar on a zero-result search page) —
          // avoids feeding a bogus width into detectDefaultWidth().
          (img) => !img.closest('#r34e-panel') && !img.src.endsWith('/images/r34chibi.png')
        );
        if (found.length > 0) {
          return found;
        }
      }
      return [];
    }
  
    function isBlacklisted(el) {
      let node = el;
      // 6 levels: deep enough to cover a thumbnail's typical wrapper nesting
      // (<a>/<span>/<div> ancestors) without walking all the way up to
      // document.body for every single thumbnail on the page.
      for (let depth = 0; node && depth < 6; depth++) {
        const id = (node.id || '').toLowerCase();
        const cls = (node.className && node.className.toString ? node.className.toString() : '').toLowerCase();
        if (id.includes('blacklist') || cls.includes('blacklist') || cls.includes('blocked')) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    }
  
    // Video thumbnails carry an extra class next to "preview" (e.g.
    // "webm-thumb"); plain images carry only "preview".
    function hasExtraPreviewClass(img) {
      const extra = Array.from(img.classList).filter(
        (c) => c.toLowerCase() !== 'preview'
      );
      return extra.length > 0;
    }
  
    function hasVisibleBorder(el) {
      const cs = getComputedStyle(el);
      const width = parseFloat(cs.borderTopWidth) || 0;
      return cs.borderTopStyle !== 'none' && width > 0;
    }
  
    // Determines which element (img or wrapping link) gets the colored border.
    function getBorderTarget(img) {
      // Site's video-border CSS targets <img> itself; fall back to <a>.
      if (hasExtraPreviewClass(img) || hasVisibleBorder(img)) return img;
      const parentA = img.closest('a');
      if (parentA && hasVisibleBorder(parentA)) return parentA;
      return img; // default target when no border exists yet (images)
    }
  
    // Captures this image's own aspect ratio (h/w) so it's preserved when
    // width changes later. Prefers real decoded dimensions over the CSS box
    // size. Returns true if a (new) ratio was captured.
    function captureRatio(img) {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > 0 && h > 0) {
        const ratio = h / w;
        const changed = img.dataset.r34eRatio !== String(ratio);
        img.dataset.r34eRatio = String(ratio);
        return changed;
      }
      return false;
    }
  
    function classifyThumbnail(img) {
      if (img.dataset.r34eType) return; // already classified
  
      if (!captureRatio(img)) {
        // Not decoded yet — use current CSS box size as a temporary
        // estimate, correct it once the image loads.
        const cs = getComputedStyle(img);
        const w0 = parseFloat(cs.width);
        const h0 = parseFloat(cs.height);
        if (w0 > 0 && h0 > 0) {
          img.dataset.r34eRatio = String(h0 / w0);
        }
        img.addEventListener(
          'load',
          () => {
            // Resize only this thumbnail, not every thumbnail on the page.
            // applyWidth(settings.width) would re-query and re-resize ALL
            // matched <img>s — firing that once per image while a page's
            // thumbnails are still loading redundantly reprocesses every
            // already-sized image on each new 'load' event. Do the same
            // per-image work applyWidth()'s loop body does, just for this
            // one <img>.
            if (captureRatio(img)) {
              const ratio = parseFloat(img.dataset.r34eRatio);
              resizeThumbChain(img, settings.width, Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
            }
          },
          { once: true }
        );
      }
  
      let type = 'image';
      if (isBlacklisted(img)) {
        type = 'blocked';
      } else if (
        hasExtraPreviewClass(img) ||
        hasVisibleBorder(img) ||
        hasVisibleBorder(img.closest('a') || img)
      ) {
        type = 'video';
      }
  
      const target = getBorderTarget(img);
      img.dataset.r34eType = type;
      target.classList.add('r34e-thumb', `r34e-type-${type}`);
      img.dataset.r34eTagged = '1';
    }
  
    function discoverAndClassify() {
      const imgs = findThumbnailImages();
      imgs.forEach(classifyThumbnail);
      return imgs;
    }
  
    /* --------------------------- Thumbnail width --------------------------- */
  
    function detectDefaultWidth(imgs) {
      for (const img of imgs) {
        const cs = getComputedStyle(img);
        const w = parseFloat(cs.width);
        if (w > 0) return Math.round(w);
      }
      return 150; // sensible fallback if nothing could be detected
    }
  
    // Walks up img's ancestor chain and resizes each wrapper whose width
    // looks like part of the thumbnail sizing chain. Both width AND height
    // are set on every level — a wrapper's leftover fixed height (from the
    // default square layout) would otherwise clip a portrait image.
    function resizeThumbChain(img, newWidth, ratio) {
      const newHeight = Math.round(newWidth * ratio);
  
      // Chain length must be decided ONCE, before any override exists —
      // re-deriving via getComputedStyle() on every call would read our own
      // prior !important override instead of the site's original layout,
      // breaking shrink-after-grow. Cache on the <img>, reuse on every resize.
      //
      // Read before write: this walk calls getComputedStyle() up the parent
      // chain, so it has to run before this call's own width/height writes
      // below — reading after writing would force the browser to flush a
      // synchronous layout just to answer it, and on this very first call
      // would measure the chain against a size this script just changed
      // instead of the site's untouched original layout.
      let chainLen = img.dataset.r34eChainLen;
      if (chainLen === undefined) {
        const originalDefault = settings.originalWidth || newWidth;
        let node = img.parentElement;
        let steps = 0;
        // 3 levels: covers the deepest wrapper nesting seen around a
        // thumbnail (<a> > <span> > <div>) without walking arbitrarily far
        // up the tree. 2.5×: a wrapper can legitimately be somewhat wider
        // than the thumbnail itself (padding/border/site chrome) — this
        // margin still excludes an unrelated, much wider ancestor (e.g. the
        // whole grid row or page body) from being treated as part of the
        // sizing chain.
        while (node && steps < 3) {
          const w = parseFloat(getComputedStyle(node).width);
          if (w > 0 && w <= originalDefault * 2.5) {
            steps++;
            node = node.parentElement;
          } else {
            break;
          }
        }
        chainLen = steps;
        img.dataset.r34eChainLen = String(chainLen);
      } else {
        chainLen = parseInt(chainLen, 10) || 0;
      }
  
      img.style.setProperty('width', newWidth + 'px', 'important');
      img.style.setProperty('height', newHeight + 'px', 'important');
  
      let node = img.parentElement;
      for (let i = 0; i < chainLen && node; i++) {
        node.style.setProperty('width', newWidth + 'px', 'important');
        node.style.setProperty('height', newHeight + 'px', 'important');
        node = node.parentElement;
      }
    }
  
    function applyWidth(widthPx) {
      const imgs = document.querySelectorAll('img.r34e-thumb, img[data-r34e-tagged="1"]');
      if (imgs.length === 0) return;
  
      // Each image keeps its own aspect ratio (captured in classifyThumbnail).
      imgs.forEach((img) => {
        const ratio = parseFloat(img.dataset.r34eRatio);
        resizeThumbChain(img, widthPx, Number.isFinite(ratio) && ratio > 0 ? ratio : 1);
      });
    }
  
    /* -------------------------------- Dark mode ------------------------------ */
  
    const darkTouched = new Map(); // Element -> { bg: string, color: string }
  
    function revertDarkMode() {
      darkTouched.forEach((orig, el) => {
        if (orig.bg === '') el.style.removeProperty('background-color');
        else el.style.setProperty('background-color', orig.bg);
        if (orig.color === '') el.style.removeProperty('color');
        else el.style.setProperty('color', orig.color);
      });
      darkTouched.clear();
    }
  
    const DARK_SCAN_SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'IMG', 'VIDEO', 'IFRAME', 'CANVAS']);
  
    function darkenSingleElement(el) {
      if (DARK_SCAN_SKIP_TAGS.has(el.tagName)) return;
      if (el.closest('#r34e-panel')) return;
      // #paginator has dedicated dark-mode CSS below — skip the generic scan.
      if (el.closest('#paginator')) return;
      // #tag-sidebar has dedicated per-tag-type colors — generic scan would
      // flatten artist/character/copyright color-coding to plain gray.
      if (el.closest('#tag-sidebar')) return;
      // #navbar/#subnavbar have dedicated styling — avoid inline vs.
      // stylesheet conflicts on chips/current-page highlight.
      if (el.closest('#navbar') || el.closest('#subnavbar')) return;
      // Only the .sidebar container's own background has a dedicated rule;
      // its other descendants still go through the generic scan.
      if (el.classList && el.classList.contains('sidebar')) return;
      // Our own pill buttons (comments toggle, download button, Edit/Respond/
      // Post comment) already have dedicated dark-mode + hover/active CSS.
      // Root cause of a real bug: toggling Dark Mode flips the r34e-dark
      // class, which starts a CSS transition on these elements' own
      // background-color; getComputedStyle() read synchronously right after
      // (same call stack, before the transition has advanced) still reports
      // the OLD light-mode color, so this scan wrongly judges an
      // already-dark button as "light, needs forced dark" and stamps a
      // permanent inline !important override — which then beats every
      // stylesheet rule (including the dedicated dark/hover CSS) forever,
      // since inline !important outranks stylesheet !important regardless
      // of specificity. Skipping these elements here avoids that entirely.
      if (
        el.classList &&
        (el.classList.contains('r34e-comments-toggle') ||
          el.classList.contains('r34e-download-btn') ||
          el.classList.contains('r34e-inline-btn') ||
          el.classList.contains('r34e-postnav-btn'))
      ) {
        return;
      }
  
      const cs = getComputedStyle(el);
  
      const bg = parseRgb(cs.backgroundColor);
      // alpha > 0.05: skip a background that's effectively transparent —
      // there's nothing visibly light there that would need darkening.
      if (bg && bg.a > 0.05) {
        const lum = luminance(bg.r, bg.g, bg.b);
        // >= 0.5: only force-dark a background that reads as light (mid-gray
        // or brighter); anything already darker than that is left alone.
        if (lum >= 0.5) {
          // >= 0.85 (near-white): use the lighter bg1 shade — CONFIG.dark.bg1
          // is documented above as "large containers... very light elements".
          // Everything else in the 0.5-0.85 range gets the standard bg2.
          const shade = lum >= 0.85 ? CONFIG.dark.bg1 : CONFIG.dark.bg2;
          if (!darkTouched.has(el)) {
            darkTouched.set(el, { bg: el.style.backgroundColor || '', color: el.style.color || '' });
          }
          el.style.setProperty('background-color', shade, 'important');
        }
      }
  
      const fg = parseRgb(cs.color);
      if (fg) {
        const lum = luminance(fg.r, fg.g, fg.b);
        // < 0.4: only force-light a text color that reads as dark; text
        // already lighter than that is presumably readable on a dark
        // background as-is and is left untouched.
        if (lum < 0.4) {
          if (!darkTouched.has(el)) {
            darkTouched.set(el, { bg: el.style.backgroundColor || '', color: el.style.color || '' });
          }
          el.style.setProperty('color', CONFIG.dark.text, 'important');
        }
      }
    }
  
    // `roots`, if given, scans only those subtrees instead of the whole
    // page — avoids re-walking every element (layout thrashing via
    // getComputedStyle) on every MutationObserver batch. The observer
    // passes just newly-added elements; a bare call still does a full pass.
    function scanAndDarken(roots) {
      const scanRoots = roots && roots.length ? roots : [document.body];
      scanRoots.forEach((root) => {
        if (!root || root.nodeType !== 1) return;
        darkenSingleElement(root);
        root.querySelectorAll('*').forEach(darkenSingleElement);
      });
    }
  
    function applyDarkMode(enabled) {
      document.documentElement.classList.toggle('r34e-dark', enabled);
      if (enabled) {
        scanAndDarken();
      } else {
        revertDarkMode();
      }
    }
  
    /* -------------------------------- Link colors ----------------------------- */
  
    function applyLinkColors(enabled) {
      document.documentElement.classList.toggle('r34e-linkcolors', enabled);
    }
  
    /* -------------------------------- Hover zoom ------------------------------- */
  
    // Scale factor exposed as a CSS custom property so the CSS side stays
    // a single rule regardless of which preset is picked.
    function applyHoverZoom(value) {
      const enabled = value !== 'off';
      document.documentElement.classList.toggle('r34e-hoverzoom', enabled);
      if (enabled) {
        document.documentElement.style.setProperty('--r34e-hoverzoom-scale', String(parseInt(value, 10) / 100));
      } else {
        document.documentElement.style.removeProperty('--r34e-hoverzoom-scale');
      }
    }
  
    /* -------------------------------- Disable alt text -------------------------- */
  
    // Thumbnail alt/title carry the full tag list, which the browser shows
    // as a native hover tooltip. Blank BOTH attributes (on <img> and its
    // enclosing <a>) to reliably suppress it regardless of which one the
    // browser keys off.
    //
    // Revertible via altTitleTouched (Map, not WeakMap — reverting needs to
    // iterate every touched element), same pattern as darkTouched.
    const altTitleTouched = new Map();
  
    function applyDisableAltText(enabled) {
      if (!enabled) {
        altTitleTouched.forEach((original, el) => {
          if ('alt' in original) {
            if (original.alt === null) el.removeAttribute('alt');
            else el.setAttribute('alt', original.alt);
          }
          if (original.title === null) el.removeAttribute('title');
          else el.setAttribute('title', original.title);
        });
        altTitleTouched.clear();
        return;
      }
  
      document.querySelectorAll('img.r34e-thumb, img[data-r34e-tagged="1"]').forEach((img) => {
        if (img.closest('#r34e-panel')) return;
        if (!altTitleTouched.has(img)) {
          altTitleTouched.set(img, { alt: img.getAttribute('alt'), title: img.getAttribute('title') });
        }
        // Blanked, not removed: alt="" is valid markup for "no useful alt
        // text"; removing the attribute entirely leaves no explicit signal.
        img.setAttribute('alt', '');
        img.removeAttribute('title');
  
        const link = img.closest('a[href*="s=view"]');
        if (link) {
          if (!altTitleTouched.has(link)) {
            altTitleTouched.set(link, { title: link.getAttribute('title') });
          }
          link.removeAttribute('title');
        }
      });
    }
  
    /* -------------------------------- Pagination style -------------------------- */
  
    function applyPaginationStyle(enabled) {
      document.documentElement.classList.toggle('r34e-pagination', enabled);
    }
  
    /* -------------------------------- Pagination: custom labels ------------------ */
  
    // Site pagination uses terse arrow-only text ("<<", "<", ">", ">>") for
    // jump links; relabeled here with emoji, same for the manual page-jump
    // submit button. Bound to the same "Pagination" checkbox as the
    // paginator redesign — same feature, extended to labels.
    //
    // Idempotent: only matches the site's original raw text, never its own
    // emoji output, so repeat calls (mutation observer) never double-apply.
    // Covers both the post-listing and comment paginators (same markup).
    const PAGINATION_ARROW_LABELS = {
      '<<': '⏮️ First',
      '<': '◀️ Previous',
      '>': 'Next ▶️',
      '>>': 'Last ⏭️',
    };
  
    function applyPaginationLabels(enabled) {
      // The page reuses id="paginator" for both listing and comment
      // paginator. querySelectorAll('#paginator .pagination') matches all
      // of them (duplicate ids are spec-legal for selector matching); don't
      // nest a second id-selector, that risks matching only the first one.
      const paginations = document.querySelectorAll('#paginator .pagination');
      paginations.forEach((pagination) => {
        pagination.querySelectorAll('a').forEach((a) => {
          const current = a.textContent.trim();
          if (enabled) {
            const replacement = PAGINATION_ARROW_LABELS[current];
            if (replacement) {
              a.dataset.r34eOrigLabel = current;
              a.textContent = replacement;
            }
          } else if (a.dataset.r34eOrigLabel) {
            a.textContent = a.dataset.r34eOrigLabel;
            delete a.dataset.r34eOrigLabel;
          }
        });
        pagination.querySelectorAll('form.manual-page-chooser input[type="submit"]').forEach((btn) => {
          if (enabled) {
            if (!btn.dataset.r34eOrigLabel) btn.dataset.r34eOrigLabel = btn.value;
            btn.value = 'Go ↗️';
          } else if (btn.dataset.r34eOrigLabel) {
            btn.value = btn.dataset.r34eOrigLabel;
            delete btn.dataset.r34eOrigLabel;
          }
        });
      });
    }
  
    /* -------------------------------- Post navigation (prev/next above media) ---- */
  
    // #navlinksContainer sits above the media on single-post pages and holds
    // the prev/next-post links. Matched defensively by trimmed, case-
    // insensitive text ("< previous" / "next >") since their class/id isn't
    // confirmed — a text mismatch is simply a no-op.
    //
    // Bound to the same "Pagination" checkbox as the paginator redesign.
    // Idempotent like applyPaginationLabels: matches the stored original
    // label, never the current possibly-already-emoji'd text.
    function applyPostNav(enabled) {
      const container = document.getElementById('navlinksContainer');
      if (!container) return;
  
      container.querySelectorAll('a').forEach((a) => {
        const original = (a.dataset.r34eOrigLabel || a.textContent).trim();
        const key = original.toLowerCase();
        const isPrev = key === '< previous';
        const isNext = key === 'next >';
        if (!isPrev && !isNext) return;
  
        a.classList.toggle('r34e-postnav-btn', enabled);
        a.classList.toggle('r34e-postnav-prev', enabled && isPrev);
        a.classList.toggle('r34e-postnav-next', enabled && isNext);
  
        if (enabled) {
          if (!a.dataset.r34eOrigLabel) a.dataset.r34eOrigLabel = original;
          a.textContent = isPrev ? '◀️ Previous' : 'Next ▶️';
        } else if (a.dataset.r34eOrigLabel) {
          a.textContent = a.dataset.r34eOrigLabel;
          delete a.dataset.r34eOrigLabel;
        }
      });
    }
  
    /* -------------------------------- Menu style (nav bars only) ----------------- */
  
    function applyMenuStyle(enabled) {
      document.documentElement.classList.toggle('r34e-menustyle', enabled);
    }
  
    /* -------------------------------- Simple header (independent toggle) -------- */
  
    // Removes #site-title's decorative background-image banner. Independent
    // of "Site navigation" above; the title text itself is untouched.
    function applySimpleHeader(enabled) {
      document.documentElement.classList.toggle('r34e-simpleheader', enabled);
    }
  
    /* -------------------------------- Sidebar style (independent toggle) --------- */
  
    function applySidebarStyle(enabled) {
      document.documentElement.classList.toggle('r34e-sidebarstyle', enabled);
    }
  
    /* -------------------------------- Tag counts (readability) ------------------- */
  
    // Matches a bare or parenthesized, optionally comma-grouped number, e.g.
    // "1234", "(1234)", "12,345" — the shape a tag's post count takes.
    function isCountLike(text) {
      return /^\(?\s*\d[\d,]*\s*\)?$/.test((text || '').trim());
    }
  
    // Finds each tag's post-count (end of its <li> in #tag-sidebar) and
    // tags it with "r34e-tag-count" for CSS styling; a bare text node is
    // wrapped in a <span> first since text nodes can't carry a class.
    function markTagCounts() {
      const items = document.querySelectorAll('#tag-sidebar li');
      items.forEach((li) => {
        if (li.dataset.r34eCountMarked) return;
        li.dataset.r34eCountMarked = '1';
  
        const nodes = Array.from(li.childNodes);
        for (let i = nodes.length - 1; i >= 0; i--) {
          const node = nodes[i];
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (text.trim() === '') continue; // skip whitespace-only trailing text
            if (isCountLike(text)) {
              const span = document.createElement('span');
              span.className = 'r34e-tag-count';
              span.textContent = text;
              li.replaceChild(span, node);
            }
            break;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (isCountLike(node.textContent)) {
              node.classList.add('r34e-tag-count');
            }
            break;
          }
        }
      });
    }
  
    /* -------------------------------- Layout: site width limit ------------------- */
  
    // Caps the page to `value` pixels wide (except our own panel) via a CSS
    // custom property; 'off' (or falsy) removes the cap.
    function applySiteWidth(value) {
      const enabled = !!value && value !== 'off';
      document.documentElement.classList.toggle('r34e-limitwidth', enabled);
      if (enabled) {
        document.documentElement.style.setProperty('--r34e-max-width', value + 'px');
      } else {
        document.documentElement.style.removeProperty('--r34e-max-width');
      }
    }
  
    /* -------------------------------- Layout: sticky panel ----------------------- */
  
    // Pins the panel to the top while scrolling. See the
    // "html.r34e-stickypanel #r34e-panel" rule for the actual position:sticky.
    function applyStickyPanel(enabled) {
      document.documentElement.classList.toggle('r34e-stickypanel', enabled);
    }
  
    /* -------------------------------- Layout: disable ads ------------------------ */
  
    // Hides two ad slots: div.postViewSidebarRight and #pv_leaderboard. The
    // image wrapper next to postViewSidebarRight already grows to fill freed
    // space automatically. If "Center post content" is on, its centering
    // math depends on postViewSidebarRight's width, so refresh that too.
    function applyHideAds(enabled) {
      document.documentElement.classList.toggle('r34e-hideads', enabled);
      if (settings.centerSingleView) updateCommentsGutter();
    }
  
    /* -------------------------------- System font ------------------------------- */
  
    function applySystemFont(enabled) {
      document.documentElement.classList.toggle('r34e-sysfont', enabled);
    }
  
    /* -------------------------------- Single Post View: hide navigation ---------- */
  
    function applyHideNav(enabled) {
      document.documentElement.classList.toggle('r34e-hidenav', enabled);
    }
  
    /* -------------------------------- Single Post View: hide status notes -------- */
  
    // <div id="status-notices"> — the site's status/notice bar.
    function applyHideStatusNotices(enabled) {
      document.documentElement.classList.toggle('r34e-hidestatus', enabled);
    }
  
    /* -------------------------------- Single Post View: rounded corners ---------- */
  
    // Card/pill redesign of the site's ".status-notice" boxes (status
    // notices, pool/parent-post notices, post-navigation bar) to match
    // "Sidebar"/"Site navigation" instead of plain squared boxes.
    function applyRoundedBoxes(enabled) {
      document.documentElement.classList.toggle('r34e-roundedboxes', enabled);
    }
  
    /* -------------------------------- Layout: tidy status-notice spacing --------- */
  
    // Site hardcodes "<br/><br/>" between multiple notices in #status-notices,
    // producing uneven gaps alongside each notice's own margin. Removed so
    // the uniform margin-bottom does all the spacing. Always on, no toggle —
    // scoped to direct children only, so unrelated <br> elsewhere is untouched.
    function removeStatusNoticeBreaks() {
      document.querySelectorAll('#status-notices > br').forEach((br) => br.remove());
    }
  
    /* -------------------------------- Single Post View: center image/comments ---- */
  
    // #post-comments is a sibling of #fit-to-screen, not nested in .flexi, so
    // it spans the FULL #right-col width while the image above is narrowed by
    // the ~325px ad sidebar column. Plain margin:auto would center comments on
    // a wider basis, shifting them right of the image. Measure the ads
    // column's real footprint (0 if hidden/blocked) as a CSS var so comments
    // center on the same effective width as the image.
    function updateCommentsGutter() {
      const adsCol = document.querySelector('.postViewSidebarRight');
      let gutter = 0;
      if (adsCol) {
        const rect = adsCol.getBoundingClientRect();
        if (rect.width > 0) {
          const cs = getComputedStyle(adsCol);
          gutter = rect.width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
        }
      }
      document.documentElement.style.setProperty('--r34e-comments-gutter', `${gutter}px`);
    }
  
    function applyCenterSingleView(enabled) {
      document.documentElement.classList.toggle('r34e-centersingle', enabled);
      if (enabled) updateCommentsGutter();
    }
  
    /* -------------------------------- Additions: download button ----------------- */
  
    // The "Options" sidebar block (.link-list) has a link whose trimmed text
    // is exactly "Original image", pointing directly at the full-res file
    // Only allow http/https. Used both where a URL is first extracted
    // (extractOriginalMediaUrl, below) and again wherever a previously-cached
    // URL is read back out of sessionStorage (getCachedMediaUrl) — @grant none
    // means that storage is shared with the page and any other script running
    // on this origin, not exclusive to this userscript, so a cached value
    // isn't automatically trustworthy just because our own writer validated
    // it once. Re-checking on every read closes that gap.
    function isSafeMediaUrl(url) {
      try {
        const protocol = new URL(url).protocol;
        return protocol === 'http:' || protocol === 'https:';
      } catch {
        return false;
      }
    }
  
    // (its onclick does an in-page swap, which we ignore — only href is used).
    // Simpler and more robust than reconstructing a URL from the inline
    // `image = {...}` script object.
    // Shared by findOriginalMediaUrl() (current page) and the hover-preview
    // feature (a different post's page, fetched in the background).
    // `baseUrl` is required since a DOMParser document has no base URL of
    // its own to resolve a relative href against.
    function extractOriginalMediaUrl(doc, baseUrl) {
      const links = doc.querySelectorAll('.link-list a');
      for (const link of links) {
        if ((link.textContent || '').trim() === 'Original image') {
          const raw = link.getAttribute('href');
          if (!raw) return null;
          try {
            const resolved = new URL(raw, baseUrl);
            // This becomes a clickable <a> href/download target — only allow
            // http/https so a malformed response can't yield a "javascript:" link.
            if (!isSafeMediaUrl(resolved.href)) return null;
            return resolved.href;
          } catch {
            return null;
          }
        }
      }
      return null;
    }
  
    function findOriginalMediaUrl() {
      return extractOriginalMediaUrl(document, location.href);
    }
  
    // While a Cloudflare challenge is up, the hover-preview background fetch
    // gets served the challenge page instead of the real post — otherwise
    // indistinguishable from "no Original image link". Detecting it here
    // lets classifyHoverFetchResult() below tell the two apart.
    //
    // Matched on response BODY, not HTTP status (Cloudflare uses a mix of
    // 403/503/200 depending on challenge type). Several independent
    // fingerprints of Cloudflare's own template, so it's resilient to a
    // template tweak breaking just one of them.
    function isCloudflareChallengeHtml(html) {
      if (!html) return false;
      return (
        html.includes('Just a moment...') ||
        html.includes('cf-browser-verification') ||
        html.includes('cf_chl_opt') ||
        html.includes('challenge-platform') ||
        html.includes('Checking if the site connection is secure') ||
        html.includes('cf-chl-')
      );
    }
  
    // Turns a hover fetch into one of three outcomes:
    //  - a real media URL: normal case.
    //  - 'cloudflare': response was the challenge page — see showHoverPreviewError().
    //  - 'http-error': non-OK status, not Cloudflare (maintenance page, deleted post, ...).
    //  - null/null: 2xx but genuinely no "Original image" link — not an error.
    function classifyHoverFetchResult(html, baseUrl, ok) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const mediaUrl = extractOriginalMediaUrl(doc, baseUrl);
      if (mediaUrl) return { url: mediaUrl, reason: null };
      if (isCloudflareChallengeHtml(html)) return { url: null, reason: 'cloudflare' };
      if (!ok) return { url: null, reason: 'http-error' };
      return { url: null, reason: null };
    }
  
    // Derives a filename from the CDN URL's path. Filters empty segments —
    // CDN URLs contain a doubled slash after the domain.
    function filenameFromUrl(url) {
      try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        return parts.length ? parts[parts.length - 1] : 'download';
      } catch {
        return 'download';
      }
    }
  
    // #navlinksContainer, #note-container, and the media element are all
    // direct children of the same wrapper that becomes a centering flex
    // column under r34e-centersingle. Inserting the button as a sibling
    // right before the media element makes it left-aligned by default and
    // auto-centered under "Center Media" — no dedicated positioning CSS
    // needed either way.
    function applyDownloadButton(enabled) {
      let btn = document.getElementById('r34e-download-btn');
  
      if (!enabled) {
        if (btn) btn.remove();
        return;
      }
  
      if (btn) return; // already set up on this page
  
      const mediaEl =
        document.getElementById('image') || document.getElementById('gelcomVideoContainer');
      if (!mediaEl || !mediaEl.parentElement) return;
  
      const url = findOriginalMediaUrl();
      if (!url) return;
  
      btn = document.createElement('a');
      btn.id = 'r34e-download-btn';
      btn.className = 'r34e-download-btn';
      btn.href = url;
      btn.download = filenameFromUrl(url);
      // Plain <a href>, no click handler — a fetch-as-blob approach was tried
      // but the CDN (different origin) never let it succeed. Left-click opens
      // the file directly; right-click offers native "Save Target As...".
      btn.textContent = '💾 Download';
  
      mediaEl.parentElement.insertBefore(btn, mediaEl);
    }
  
    /* -------------------------------- Style: live preview on hover --------------- */
  
    // Hovering a thumbnail on any post-listing page shows the ORIGINAL file
    // instead of the static thumbnail: video autoplays muted/looped, image
    // swaps in the original. Reuses extractOriginalMediaUrl() against a
    // background fetch of that post's own page (same-origin, unlike the CDN).
    //
    // Delegated on `document`: covers thumbnails added later (infinite
    // scroll) with one pair of listeners. mouseover/mouseout (they bubble,
    // mouseenter/leave don't) + `relatedTarget` check avoids re-triggering
    // when the pointer moves onto our own overlay elements.
    //
    // Many posts hovered in quick succession can trip Cloudflare's rate
    // limit. The debounce/queue/cache below cut down traffic this feature
    // generates on its own; they can't do anything once a challenge is shown.
  
    // Debounce: only fetch once the pointer stays on a thumbnail a bit, so
    // sweeping across a row doesn't fire a fetch per thumbnail.
    const HOVER_DEBOUNCE_MS = 500;
  
    // Gap between queued fetch starts — caps worst-case rate at ~5/s.
    const HOVER_FETCH_GAP_MS = 200;
  
    // sessionStorage, not localStorage: self-cleans per tab session, never
    // serves a stale URL from a much later reopened tab, and doesn't need to
    // be shared across tabs. Separate key from CONFIG.storageKey — disposable
    // cache, not a user setting, kept out of settings export/import.
    const HOVER_CACHE_STORAGE_KEY = 'r34e:hovermediacache:v1';
    // Cap entry count so a very long session doesn't grow the
    // JSON.stringify cost (and sessionStorage quota use) unbounded. `Map`
    // makes LRU eviction cheap: re-inserting a key moves it to the end.
    const HOVER_CACHE_MAX_ENTRIES = 500;
    let hoverMediaCache = null;
  
    function loadHoverMediaCache() {
      if (hoverMediaCache) return hoverMediaCache;
      try {
        const raw = sessionStorage.getItem(HOVER_CACHE_STORAGE_KEY);
        hoverMediaCache = raw ? new Map(Object.entries(JSON.parse(raw))) : new Map();
      } catch {
        hoverMediaCache = new Map();
      }
      return hoverMediaCache;
    }
  
    function getCachedMediaUrl(key) {
      const cache = loadHoverMediaCache();
      if (!cache.has(key)) return undefined;
      const value = cache.get(key);
      // A non-empty entry must still pass the same http/https check as a
      // freshly-extracted URL (see isSafeMediaUrl above) — it's about to
      // become a clickable <a href>/download target, and this cache lives in
      // storage this script doesn't exclusively own. Drop anything that
      // fails instead of reusing it; the caller re-fetches a fresh one.
      if (value && !isSafeMediaUrl(value)) {
        cache.delete(key);
        return undefined;
      }
      // Refresh recency on read so eviction is truly LRU, not just
      // insertion-order.
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
  
    function setCachedMediaUrl(key, url) {
      const cache = loadHoverMediaCache();
      cache.delete(key); // re-insert below either way, so it's at the (most-recent) end
      cache.set(key, url);
      while (cache.size > HOVER_CACHE_MAX_ENTRIES) {
        cache.delete(cache.keys().next().value); // oldest entry, per Map's insertion-order iteration
      }
      try {
        sessionStorage.setItem(HOVER_CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(cache)));
      } catch {
        // Storage unavailable — in-memory cache still serves this page load.
      }
    }
  
    // Serializes hover fetches behind one promise chain (never more than one
    // in flight), HOVER_FETCH_GAP_MS between one settling and the next
    // starting. `task().catch(() => null)` keeps one failed fetch from
    // wedging the queue for every preview after it.
    let hoverFetchChain = Promise.resolve();
  
    function queueHoverFetch(task) {
      const result = hoverFetchChain.then(() => task().catch(() => null));
      hoverFetchChain = result.then(() => new Promise((resolve) => setTimeout(resolve, HOVER_FETCH_GAP_MS)));
      return result;
    }
  
    function findHoverThumbLink(target) {
      const a = target.closest && target.closest('a[href*="s=view"]');
      if (!a || a.closest('#r34e-panel')) return null;
      const img = a.querySelector('img.r34e-thumb, img[data-r34e-tagged="1"]');
      if (!img || img.dataset.r34eType === 'blocked') return null;
      return { a, img };
    }
  
    function showHoverPreview(a, img, url) {
      if (img.dataset.r34eType === 'video') {
        let video = a.querySelector('.r34e-hover-video');
        if (!video) {
          video = document.createElement('video');
          video.className = 'r34e-hover-video';
          video.src = url;
          // Without a poster the video paints solid black until the first
          // frame decodes. Reuse the thumbnail as a placeholder instead.
          video.poster = img.src;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute('playsinline', ''); // attribute form too, for older WebViews
          video.tabIndex = -1;
          // No controls/click handler — pointer-events:none (CSS) makes it
          // fully unclickable, so the thumbnail's <a> receives every click.
          a.appendChild(video);
        }
        // play() returns a Promise per spec; guard anyway since autoplay can
        // be legitimately blocked before a user gesture — harmless no-op.
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
      } else {
        // Image posts get the same treatment via a full-bleed overlay <img>
        // (.r34e-hover-image, shares positioning with .r34e-hover-video).
        // No poster needed: an unloaded <img> paints nothing, so the
        // thumbnail shows through until the original is ready.
        let hiRes = a.querySelector('.r34e-hover-image');
        if (!hiRes) {
          hiRes = document.createElement('img');
          hiRes.className = 'r34e-hover-image';
          hiRes.src = url;
          hiRes.alt = '';
          hiRes.tabIndex = -1;
          // Set data-r34eTagged BEFORE this enters the DOM — otherwise the
          // mutation observer's untagged-<img>-in-s=view-link discovery
          // selector sweeps it into classifyThumbnail(), whose
          // hasExtraPreviewClass() heuristic misreads "r34e-hover-image" as
          // a video-thumbnail marker and paints it with a green border.
          hiRes.dataset.r34eTagged = '1';
          // Fully unclickable (CSS) — clicks land on the thumbnail's own <a>.
          a.appendChild(hiRes);
        }
      }
  
      if (settings.downloadButton && !a.querySelector('.r34e-hover-download')) {
        const dlBtn = document.createElement('a');
        dlBtn.className = 'r34e-hover-download r34e-download-btn';
        dlBtn.href = url;
        dlBtn.download = filenameFromUrl(url);
        // Visible label, not just an icon — `title` alone only shows after
        // a hover pause, so it can't stand in for the label by itself.
        dlBtn.textContent = '💾 Download';
        dlBtn.title = 'Download original file';
        // Unlike the click-through video/image, this needs its click
        // stopped so it doesn't also navigate to the single-post view.
        dlBtn.addEventListener('click', (e) => e.stopPropagation());
        a.appendChild(dlBtn);
      }
    }
  
    // Surfaces the three distinguishable failure reasons from
    // classifyHoverFetchResult() as a small badge over the thumbnail, same
    // slot as the download button (never shown together). 'cloudflare' gets
    // its own wording/color since it's the one actionable case; the other
    // two collapse into one generic message.
    function showHoverPreviewError(a, reason) {
      if (a.querySelector('.r34e-hover-error')) return; // already shown for this hover
      // Cloudflare case links straight to the post's own page (a.href, same
      // request that got challenged) in a new tab, so solving it there
      // clears the same cookie this tab's fetches rely on.
      const isCloudflare = reason === 'cloudflare';
      const badge = document.createElement(isCloudflare ? 'a' : 'div');
      badge.className = 'r34e-hover-error';
      if (isCloudflare) {
        // Reuses the download button's two classes (shared pill shape) —
        // .r34e-hover-error-cloudflare below only overrides the color.
        badge.classList.add('r34e-hover-error-cloudflare', 'r34e-download-btn', 'r34e-hover-download');
        badge.href = a.href;
        badge.target = '_blank';
        badge.rel = 'noopener noreferrer'; // never hand the new tab a window.opener
        // Kept short — a narrow thumbnail isn't much wider than this text.
        badge.textContent = '⚠️ Cloudflare check ↗';
        badge.title =
          'Opens this post in a new tab, where the Cloudflare security check can be solved. Preview and download won’t work again until it has been solved once — just hover here again afterwards.';
        // Nested inside the thumbnail's own <a> — stop propagation so a
        // click doesn't also navigate the current tab.
        badge.addEventListener('click', (e) => e.stopPropagation());
      } else if (reason === 'network') {
        badge.textContent = '⚠️ No connection';
        badge.title = 'The preview could not be loaded (network error). Hovering again will retry it.';
      } else {
        badge.textContent = '⚠️ Preview failed';
        badge.title = 'The original file could not be loaded (server error). Hovering again will retry it.';
      }
      a.appendChild(badge);
    }
  
    function stopHoverPreview(a) {
      const video = a.querySelector('.r34e-hover-video');
      if (video) {
        video.pause();
        video.remove();
      }
      const hiRes = a.querySelector('.r34e-hover-image');
      if (hiRes) hiRes.remove();
      const dlBtn = a.querySelector('.r34e-hover-download');
      if (dlBtn) dlBtn.remove();
      const errBadge = a.querySelector('.r34e-hover-error');
      if (errBadge) errBadge.remove();
    }
  
    function startHoverPreview(a, img) {
      // Fill the per-page dataset cache from the cross-page cache first, if
      // this <a> hasn't already resolved its URL on this page.
      if (a.dataset.r34eMediaUrl === undefined) {
        const cached = getCachedMediaUrl(a.href);
        if (cached !== undefined) a.dataset.r34eMediaUrl = cached;
      }
      if (a.dataset.r34eMediaUrl !== undefined) {
        if (a.dataset.r34eMediaUrl) showHoverPreview(a, img, a.dataset.r34eMediaUrl);
        return;
      }
      if (a.dataset.r34eMediaFetching) return; // a fetch for this thumbnail is already in flight
      a.dataset.r34eMediaFetching = '1';
  
      queueHoverFetch(() =>
        fetch(a.href, { credentials: 'same-origin' }).then((res) =>
          res.text().then((html) => classifyHoverFetchResult(html, res.url, res.ok))
        )
      )
        // A rejected fetch never reaches classifyHoverFetchResult —
        // queueHoverFetch() already catches it and resolves to `null`.
        .then((result) => {
          delete a.dataset.r34eMediaFetching;
          const { url, reason } = result || { url: null, reason: 'network' };
          if (reason) {
            // Deliberately not caching a failure — keeps the thumbnail
            // retry-able on the next hover (e.g. once Cloudflare is solved).
            if (a.dataset.r34eHoverActive) showHoverPreviewError(a, reason);
            return;
          }
          a.dataset.r34eMediaUrl = url || '';
          setCachedMediaUrl(a.href, url || ''); // caches "not found" too
          // Only show it if the pointer is still over this thumbnail once
          // the (possibly queued) fetch resolves.
          if (url && a.dataset.r34eHoverActive) showHoverPreview(a, img, url);
        });
    }
  
    // Pending debounce timers keyed by thumbnail <a>. WeakMap (not a dataset
    // field) since a timer id has no string form, and entries auto-drop if
    // the thumbnail leaves the DOM.
    const hoverDebounceTimers = new WeakMap();
  
    function setupLivePreviewDelegation() {
      document.addEventListener('mouseover', (e) => {
        if (!settings.livePreview) return;
        const hit = findHoverThumbLink(e.target);
        // Bail if a timer's already pending — moving between this
        // thumbnail's child elements refires mouseover with a different
        // e.target each time, which would otherwise schedule extra timers.
        if (!hit || hit.a.dataset.r34eHoverActive || hoverDebounceTimers.has(hit.a)) return;
        const timer = setTimeout(() => {
          hoverDebounceTimers.delete(hit.a);
          // Re-check: the setting may have been switched off during this
          // debounce delay — without this, a preview could still start
          // right after being turned off (applyLivePreview()'s own cleanup,
          // below, only catches previews already showing at that moment).
          if (!settings.livePreview) return;
          hit.a.dataset.r34eHoverActive = '1';
          startHoverPreview(hit.a, hit.img);
        }, HOVER_DEBOUNCE_MS);
        hoverDebounceTimers.set(hit.a, timer);
      });
      document.addEventListener('mouseout', (e) => {
        if (!settings.livePreview) return;
        const hit = findHoverThumbLink(e.target);
        if (!hit) return;
        if (hit.a.contains(e.relatedTarget)) return; // moved to a child (our own overlay), not actually left
        // Cancel a still-pending debounce timer regardless of whether a
        // preview ever actually became active.
        const timer = hoverDebounceTimers.get(hit.a);
        if (timer !== undefined) {
          clearTimeout(timer);
          hoverDebounceTimers.delete(hit.a);
        }
        if (!hit.a.dataset.r34eHoverActive) return;
        delete hit.a.dataset.r34eHoverActive;
        stopHoverPreview(hit.a);
      });
    }
  
    function applyLivePreview(enabled) {
      document.documentElement.classList.toggle('r34e-livepreview', enabled);
      if (enabled) return;
      // Turning the setting off mid-hover previously left any preview that
      // was already showing (video still playing, overlay still visible)
      // stuck in the DOM forever, since only a later mouseout would have
      // cleaned it up — and mouseout's own handler bails immediately once
      // settings.livePreview is false. Tear down every still-active preview
      // right here instead of waiting for that mouseout to (not) happen.
      document.querySelectorAll('[data-r34e-hover-active]').forEach((a) => {
        delete a.dataset.r34eHoverActive;
        stopHoverPreview(a);
      });
    }
  
    /* -------------------------------- Single Post View: Edit/Respond buttons ----- */
  
    // <h4 class="image-sublinks"> holds "Edit"/"Respond", separated by a
    // bare "|" text node that CSS can't target — removed here in JS, both
    // links then tagged to match other buttons. Always on, no toggle.
    // Idempotent via a marker on the container.
    function applyEditRespondButtons() {
      const container = document.querySelector('h4.image-sublinks');
      if (!container || container.dataset.r34eButtons) return;
      container.dataset.r34eButtons = '1';
  
      Array.from(container.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.remove();
      });
      container.querySelectorAll('a').forEach((a) => {
        a.classList.add('r34e-inline-btn');
      });
    }
  
    /* -------------------------------- Style: comment form ------------------------ */
  
    // #comment_form is present in the page's initial markup (just hidden via
    // inline style until "Respond" is clicked), so a single call at init is
    // enough — no MutationObserver re-check needed. The submit button reuses
    // the shared .r34e-inline-btn pill-button look (see applyEditRespondButtons
    // above) rather than duplicating that CSS under a new selector.
    function applyCommentFormStyle(enabled) {
      document.documentElement.classList.toggle('r34e-commentformstyle', enabled);
      const submitBtn = document.querySelector('#comment_form input[type="submit"]');
      if (submitBtn) submitBtn.classList.toggle('r34e-inline-btn', enabled);
    }
  
    /* -------------------------------- Post list: "no results" page --------------- */
  
    // Zero-result page has no class/id to hook into, so match the h1's
    // exact text instead. No-op on every other page. Always on, no toggle.
    // Idempotent via a marker.
    function applyNoResultsStyle() {
      const h1 = Array.from(document.querySelectorAll('h1')).find(
        (el) => (el.textContent || '').trim() === 'Nobody here but us chickens!'
      );
      if (!h1 || !h1.parentElement || h1.parentElement.dataset.r34eNoresults) return;
      h1.parentElement.dataset.r34eNoresults = '1';
      h1.parentElement.classList.add('r34e-noresults');
    }
  
    /* -------------------------------- Single Post View: collapse comments -------- */
  
    // #post-comments wraps #comment-list (comments are #c<ID> children,
    // plus a "(N hidden)" link with id="ci") and #paginator (reuses the
    // main paginator's id/markup style).
    //
    // No-op where #post-comments doesn't exist. Idempotent and reversible —
    // `enabled: false` removes the toggle and restores normal display.
    function applyCollapseComments(enabled) {
      const container = document.getElementById('post-comments');
      if (!container) return;
  
      const commentList = document.getElementById('comment-list');
      if (!commentList) return;
      const paginator = container.querySelector('#paginator');
  
      // Computed unconditionally (even when the "Collapse comments" feature
      // itself is off) so the empty-paginator fix below always has it.
      const commentEls = Array.from(commentList.children).filter(
        (el) => el.tagName === 'DIV' && /^c\d+$/.test(el.id)
      );
      const total = commentEls.length;
  
      let toggleBtn = document.getElementById('r34e-comments-toggle');
  
      if (!enabled) {
        commentList.style.removeProperty('display');
        // Site always renders a #paginator even with zero comments (a lone
        // un-clickable "1") — hide it whenever there's nothing to paginate,
        // independent of the collapse feature.
        if (paginator) {
          if (total === 0) paginator.style.setProperty('display', 'none', 'important');
          else paginator.style.removeProperty('display');
        }
        if (toggleBtn) toggleBtn.remove();
        return;
      }
  
      if (toggleBtn) {
        // Already set up — still ensure an empty paginator stays hidden.
        if (paginator && total === 0) paginator.style.setProperty('display', 'none', 'important');
        return;
      }
  
      let hidden = 0;
      const hiddenLink = document.getElementById('ci');
      if (hiddenLink) {
        const m = /\((\d+)\s*hidden\)/i.exec(hiddenLink.textContent || '');
        if (m) hidden = parseInt(m[1], 10) || 0;
      }
  
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.id = 'r34e-comments-toggle';
      toggleBtn.className = 'r34e-comments-toggle';
  
      let collapsed = total > 0;
  
      function updateLabel() {
        if (total === 0) {
          toggleBtn.textContent = 'No comments';
          return;
        }
        toggleBtn.textContent = collapsed
          ? `Show ${total} comment${total === 1 ? '' : 's'} (${hidden} hidden)`
          : 'Hide comments';
      }
  
      // setProperty(..., 'important'): the "Pagination" CSS sets #paginator's
      // display via a stylesheet !important rule, which a plain style.display
      // assignment can't beat — only an inline !important can.
      function setCollapsed(next) {
        collapsed = next;
        if (collapsed) {
          commentList.style.setProperty('display', 'none', 'important');
          if (paginator) paginator.style.setProperty('display', 'none', 'important');
        } else {
          commentList.style.removeProperty('display');
          // Expanding must not reveal an empty paginator (zero comments).
          if (paginator) {
            if (total === 0) paginator.style.setProperty('display', 'none', 'important');
            else paginator.style.removeProperty('display');
          }
        }
        updateLabel();
      }
  
      toggleBtn.disabled = total === 0;
      toggleBtn.addEventListener('click', () => {
        if (toggleBtn.disabled) return;
        setCollapsed(!collapsed);
      });
  
      container.insertBefore(toggleBtn, commentList);
      setCollapsed(total > 0); // nothing to collapse if there are no comments
    }
  
    /* -------------------------------- Base styles ------------------------------ */
  
    function injectBaseStyles() {
      const css = `
        /* --- Global colors ---
           Shared CSS custom properties for every interactive highlight
           (buttons, hovers, current pagination page/menu tab, tag-sidebar
           hover, dark-mode links, focus ring). Redefined for dark mode
           below; --link-visited stays its own identity from --accent so
           "visited" reads differently from the main highlight color. */
        :root {
          --r34e-accent: ${CONFIG.accent.light};
          --r34e-accent-text: ${CONFIG.accent.lightText};
          --r34e-accent-hover: ${CONFIG.accent.lightHover};
          --r34e-accent-active: ${CONFIG.accent.lightActive};
          --r34e-link-visited: #8b5cf6;
          /* "Warning" identity for the Cloudflare hover badge — reuses the
             existing image-border yellow rather than a new hex value. Text
             stays dark in both modes (bright yellow fill always needs dark text). */
          --r34e-warn: ${CONFIG.borderColors.image};
          --r34e-warn-text: ${CONFIG.accent.darkText};
          /* Single border tone works against both yellow fills (light + dark). */
          --r34e-warn-border: #a67c00;
        }
        html.r34e-dark {
          --r34e-accent: ${CONFIG.accent.dark};
          --r34e-accent-text: ${CONFIG.accent.darkText};
          --r34e-accent-hover: ${CONFIG.accent.darkHover};
          --r34e-accent-active: ${CONFIG.accent.darkActive};
          --r34e-link-visited: ${CONFIG.dark.linkVisited};
          --r34e-warn: ${CONFIG.tagColors.metadata};
        }
        /* A consistent focus-visible ring (keyboard navigation only, so it
           never flashes on an ordinary mouse click) for every interactive
           element this script styles — previously no element anywhere had
           any focus indicator at all. */
        #r34e-panel button:focus-visible,
        #r34e-panel input:focus-visible,
        #r34e-panel .r34e-btn-group button:focus-visible,
        html.r34e-pagination #paginator .pagination a:focus-visible,
        html.r34e-menustyle #navbar li a:focus-visible,
        html.r34e-menustyle #subnavbar li a:focus-visible,
        .r34e-comments-toggle:focus-visible,
        .r34e-download-btn:focus-visible,
        .r34e-inline-btn:focus-visible,
        html.r34e-sidebarstyle div.tag-search input:focus-visible,
        html.r34e-commentformstyle #comment_form textarea:focus-visible,
        .r34e-postnav-btn:focus-visible {
          outline: 2px solid var(--r34e-accent) !important;
          outline-offset: 2px !important;
        }
  
        html.r34e-dark, html.r34e-dark body {
          background-color: ${CONFIG.dark.bg0} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark a { color: var(--r34e-accent) !important; }
        html.r34e-dark a:visited { color: var(--r34e-link-visited) !important; }
        html.r34e-dark a:hover { color: var(--r34e-accent-hover) !important; }
        html.r34e-dark a:active { color: var(--r34e-accent-active) !important; }
  
        /* Reinforce link colors for the sidebar and main navigation
           (confirmed real IDs: #tag-sidebar, #navbar, #subnavbar), in case
           the site's own CSS for these areas is more specific than the
           blanket "a" rule above. */
        html.r34e-dark .sidebar a,
        html.r34e-dark #tag-sidebar a,
        html.r34e-dark #navbar a,
        html.r34e-dark #subnavbar a {
          color: var(--r34e-accent) !important;
        }
  
        /* Site title: confirmed markup is "#site-title a", and the site
           already styles it deliberately (white text with a black outline
           via text-shadow) rather than leaving it unstyled. That already
           reads well on a dark background, so dark mode preserves it
           instead of flattening it to the regular link color. */
        html.r34e-dark #site-title a {
          color: rgba(255, 255, 255, 1) !important;
        }
  
        /* --- "Simple header" (independent toggle) -----------------------------
           Confirmed via the site's own desktop.css: "#site-title" carries
           "background-image: url(/images/topb.png); background-repeat:
           no-repeat; background-position-x: 120px;" — the decorative anime
           banner behind the "Rule 34" title. Only the image is cleared; the
           title text/link itself (and its dark-mode color rule above) is
           untouched, it already reads fine against a plain background. */
        html.r34e-simpleheader #site-title {
          background-image: none !important;
        }
  
        /* Tag sidebar: give every tag type its own dark-mode-friendly
           color instead of flattening them all to gray (confirmed markup:
           <li class="tag-type-artist tag">, "-character", "-copyright",
           "-general" inside <ul id="tag-sidebar">). */
        html.r34e-dark #tag-sidebar li,
        html.r34e-dark #tag-sidebar h6 {
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark #tag-sidebar .tag-type-artist,
        html.r34e-dark #tag-sidebar .tag-type-artist a {
          color: ${CONFIG.tagColors.artist} !important;
        }
        html.r34e-dark #tag-sidebar .tag-type-character,
        html.r34e-dark #tag-sidebar .tag-type-character a {
          color: ${CONFIG.tagColors.character} !important;
        }
        html.r34e-dark #tag-sidebar .tag-type-copyright,
        html.r34e-dark #tag-sidebar .tag-type-copyright a {
          color: ${CONFIG.tagColors.copyright} !important;
        }
        html.r34e-dark #tag-sidebar .tag-type-metadata,
        html.r34e-dark #tag-sidebar .tag-type-metadata a {
          color: ${CONFIG.tagColors.metadata} !important;
        }
        html.r34e-dark #tag-sidebar .tag-type-general,
        html.r34e-dark #tag-sidebar .tag-type-general a {
          color: ${CONFIG.tagColors.general} !important;
        }
  
        /* Search-suggestions dropdown ("Awesomplete" widget, .awesomplete > ul).
           Site's light-mode colors are unreadable on dark — baseline dark-mode
           fix independent of the "Sidebar" toggle. Hover/selected uses shared accent. */
        html.r34e-dark .awesomplete > ul {
          background: ${CONFIG.dark.bg2} !important;
          border: 1px solid ${CONFIG.dark.border} !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
        }
        html.r34e-dark .awesomplete > ul > li {
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark .awesomplete > ul > li:hover,
        html.r34e-dark .awesomplete > ul > li[aria-selected="true"] {
          background: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
  
        /* Baseline dark-mode backgrounds for sidebar + nav bars, independent
           of "Style menu & sidebar" below — set directly to avoid conflicting
           with the generic scan. */
        html.r34e-dark .sidebar {
          background-color: ${CONFIG.dark.bg1} !important;
        }
        html.r34e-dark #navbar,
        html.r34e-dark #subnavbar {
          background-color: transparent !important;
        }
        html.r34e-dark #navbar li.current-page,
        html.r34e-dark #navbar li.current-page a,
        html.r34e-dark #subnavbar li.current-page,
        html.r34e-dark #subnavbar li.current-page a {
          background-color: ${CONFIG.dark.bg2} !important;
          background-image: none !important;
          color: var(--r34e-accent) !important;
        }
  
        /* --- "Site navigation": tab-look redesign of the retro nav
           bars. #navbar/#subnavbar li/li.current-page. current-page's inline
           background-image needs an explicit reset — background-color alone
           doesn't clear it. --- */
        html.r34e-menustyle #navbar li.current-page a,
        html.r34e-menustyle #subnavbar li.current-page a {
          background-image: none !important;
        }
        html.r34e-menustyle #navbar,
        html.r34e-menustyle #subnavbar {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: flex-end !important;
          gap: 4px !important;
          list-style: none !important;
          margin: 0 !important;
          padding: 8px 10px 0 10px !important;
          border-bottom: 2px solid rgba(0, 0, 0, 0.15) !important;
        }
        /* Site's own CSS pads the <li> directly, and the dark-mode rule above
           colors li.current-page separately from the <a>'s tab background —
           left alone that's a mismatched frame. Reset <li> to plain/transparent;
           <a> alone controls padding/background. */
        html.r34e-menustyle #navbar li,
        html.r34e-menustyle #subnavbar li {
          margin: 0 !important;
          padding: 0 !important;
          list-style: none !important;
        }
        html.r34e-menustyle #navbar li.current-page,
        html.r34e-menustyle #subnavbar li.current-page,
        html.r34e-dark.r34e-menustyle #navbar li.current-page,
        html.r34e-dark.r34e-menustyle #subnavbar li.current-page {
          background: transparent !important;
        }
        /* Tab look: rounded top corners, no bottom border, nudged down 1px to
           sit on the strip's baseline. font-weight forced normal — site bolds
           current-page, which reads too heavy once background/border already mark it. */
        html.r34e-menustyle #navbar li a,
        html.r34e-menustyle #subnavbar li a {
          display: inline-flex !important;
          align-items: center !important;
          position: relative !important;
          top: 1px !important;
          padding: 6px 14px !important;
          border-radius: 7px 7px 0 0 !important;
          border: 1px solid rgba(0, 0, 0, 0.15) !important;
          border-bottom: none !important;
          background: rgba(0, 0, 0, 0.04) !important;
          text-decoration: none !important;
          font-weight: normal !important;
          transition: background-color .15s ease, border-color .15s ease, color .15s ease;
        }
        html.r34e-menustyle #navbar li a:hover,
        html.r34e-menustyle #subnavbar li a:hover {
          background: rgba(0, 0, 0, 0.09) !important;
        }
        html.r34e-menustyle #navbar li a:active,
        html.r34e-menustyle #subnavbar li a:active {
          background: rgba(0, 0, 0, 0.14) !important;
        }
        html.r34e-menustyle #navbar li.current-page a,
        html.r34e-menustyle #subnavbar li.current-page a {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-menustyle #navbar,
        html.r34e-dark.r34e-menustyle #subnavbar {
          border-bottom-color: rgba(255, 255, 255, 0.15) !important;
        }
        html.r34e-dark.r34e-menustyle #navbar li a,
        html.r34e-dark.r34e-menustyle #subnavbar li a {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
          border-bottom: none !important;
          color: var(--r34e-accent) !important;
        }
        html.r34e-dark.r34e-menustyle #navbar li a:hover,
        html.r34e-dark.r34e-menustyle #subnavbar li a:hover {
          background: rgba(255, 255, 255, 0.13) !important;
        }
        html.r34e-dark.r34e-menustyle #navbar li a:active,
        html.r34e-dark.r34e-menustyle #subnavbar li a:active {
          background: rgba(255, 255, 255, 0.20) !important;
        }
        html.r34e-dark.r34e-menustyle #navbar li.current-page a,
        html.r34e-dark.r34e-menustyle #subnavbar li.current-page a {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
  
        /* --- "Sidebar": card/chip redesign of the tag list, independent of
           "Site navigation". div.sidebar > ul#tag-sidebar > li.tag-type-X
           rows + bare li > h6 headers. --- */
        html.r34e-sidebarstyle .sidebar {
          border-radius: 10px !important;
          padding: 12px !important;
          box-sizing: border-box !important;
          border: 1px solid rgba(0, 0, 0, 0.10) !important;
          background: rgba(0, 0, 0, 0.02) !important;
        }
        html.r34e-dark.r34e-sidebarstyle .sidebar {
          border-color: ${CONFIG.dark.border} !important;
          background: ${CONFIG.dark.bg1} !important;
        }
        html.r34e-sidebarstyle #tag-sidebar {
          display: flex !important;
          flex-direction: column !important;
          gap: 3px !important;
          padding: 0 !important;
          margin: 0 !important;
          list-style: none !important;
        }
        html.r34e-sidebarstyle #tag-sidebar li {
          margin: 0 !important;
          list-style: none !important;
        }
        html.r34e-sidebarstyle #tag-sidebar li[class*="tag-type-"] {
          border-radius: 6px !important;
          padding: 3px 8px !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-left-width: 3px !important;
          background: rgba(0, 0, 0, 0.03) !important;
          transition: background-color .15s ease;
        }
        html.r34e-sidebarstyle #tag-sidebar li[class*="tag-type-"]:hover {
          background: rgba(0, 0, 0, 0.07) !important;
        }
        html.r34e-sidebarstyle #tag-sidebar li.tag-type-artist { border-left-color: ${CONFIG.tagColorsLight.artist} !important; }
        html.r34e-sidebarstyle #tag-sidebar li.tag-type-character { border-left-color: ${CONFIG.tagColorsLight.character} !important; }
        html.r34e-sidebarstyle #tag-sidebar li.tag-type-copyright { border-left-color: ${CONFIG.tagColorsLight.copyright} !important; }
        html.r34e-sidebarstyle #tag-sidebar li.tag-type-metadata { border-left-color: ${CONFIG.tagColorsLight.metadata} !important; }
        html.r34e-sidebarstyle #tag-sidebar li.tag-type-general { border-left-color: ${CONFIG.tagColorsLight.general} !important; }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li[class*="tag-type-"] {
          background: rgba(255, 255, 255, 0.04) !important;
          border-color: rgba(255, 255, 255, 0.10) !important;
        }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li[class*="tag-type-"]:hover {
          background: rgba(255, 255, 255, 0.09) !important;
        }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li.tag-type-artist { border-left-color: ${CONFIG.tagColors.artist} !important; }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li.tag-type-character { border-left-color: ${CONFIG.tagColors.character} !important; }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li.tag-type-copyright { border-left-color: ${CONFIG.tagColors.copyright} !important; }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li.tag-type-metadata { border-left-color: ${CONFIG.tagColors.metadata} !important; }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar li.tag-type-general { border-left-color: ${CONFIG.tagColors.general} !important; }
        html.r34e-sidebarstyle #tag-sidebar h6 {
          margin: 10px 0 4px 0 !important;
          padding-bottom: 3px !important;
          border-bottom: 2px solid rgba(0, 0, 0, 0.15) !important;
          letter-spacing: 0.3px !important;
        }
        html.r34e-dark.r34e-sidebarstyle #tag-sidebar h6 {
          border-bottom-color: rgba(255, 255, 255, 0.15) !important;
        }
  
        /* --- Sidebar search field: match the panel's own pill input styling,
           so it doesn't look like a leftover unstyled element next to the
           card list above. Scoped to the "Sidebar" toggle. */
        html.r34e-sidebarstyle div.tag-search input[type="text"] {
          height: 34px !important;
          padding: 0 10px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          box-sizing: border-box !important;
          font-size: 13px !important;
          font-family: inherit !important;
        }
        html.r34e-sidebarstyle div.tag-search input[type="submit"] {
          height: 34px !important;
          padding: 0 14px !important;
          margin: 4px 0 0 0 !important;
          border-radius: 8px !important;
          border: 1px solid var(--r34e-accent) !important;
          background: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          font-family: inherit !important;
          cursor: pointer !important;
          box-sizing: border-box !important;
          transition: background-color .15s ease, border-color .15s ease;
        }
        html.r34e-sidebarstyle div.tag-search input[type="submit"]:hover {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
        }
        html.r34e-sidebarstyle div.tag-search input[type="submit"]:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          transform: translateY(1px);
        }
        html.r34e-dark.r34e-sidebarstyle div.tag-search input[type="text"] {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark.r34e-sidebarstyle div.tag-search input[type="submit"] {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-sidebarstyle div.tag-search input[type="submit"]:hover,
        html.r34e-dark.r34e-sidebarstyle div.tag-search input[type="submit"]:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
        }
  
        /* --- Post list: "no results" page ---
           Zero-match search shows the site's r34chibi.png mascot instead of
           a tag list — hidden outright, always on. The message box next to
           it (.r34e-noresults, tagged in applyNoResultsStyle()) gets the
           same Card & Pill look as Sidebar/Rounded boxes; centered only
           when "Center post content" is on.
  
           ".content" is a flex item with no flex-grow, so it shrinks to fit
           its (short) text instead of filling the column — same underlying
           bug as #right-col below. Scoped via ">" to a direct child of
           #post-list specifically, since ".content" is also used (with its
           own fix) by #right-col elsewhere. width:100% on the message box
           itself is still needed on top of this to actually fill the column. */
        #post-list > .content {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
        img[src$="/images/r34chibi.png"] {
          display: none !important;
        }
        .r34e-noresults {
          width: 100%;
          border-radius: 10px;
          padding: 16px 20px;
          box-sizing: border-box;
          border: 1px solid rgba(0, 0, 0, 0.10);
          background: rgba(0, 0, 0, 0.02);
        }
        html.r34e-dark .r34e-noresults {
          border-color: ${CONFIG.dark.border};
          background: ${CONFIG.dark.bg1};
          color: ${CONFIG.dark.text};
        }
        .r34e-noresults h1 {
          margin: 0 0 6px 0;
          font-size: 20px;
        }
        html.r34e-centersingle .r34e-noresults {
          text-align: center;
        }
  
        /* Tag counts: always slightly smaller; recolored only in dark mode
           where the site's soft-gray count color is hard to read. */
        .r34e-tag-count {
          font-size: 0.85em;
        }
        html.r34e-dark .r34e-tag-count {
          color: ${CONFIG.dark.textDim} !important;
        }
  
        html.r34e-dark input,
        html.r34e-dark select,
        html.r34e-dark textarea,
        html.r34e-dark button {
          background-color: ${CONFIG.dark.bg2} !important;
          color: ${CONFIG.dark.text} !important;
          border-color: ${CONFIG.dark.border} !important;
        }
  
        /* Same 10px radius as other "card" surfaces. overflow:hidden covers
           the wrapping-<a> case (see getBorderTarget()), where the image
           would otherwise poke square corners past its rounded parent. */
        html.r34e-linkcolors .r34e-type-image,
        html.r34e-linkcolors .r34e-type-video,
        html.r34e-linkcolors .r34e-type-blocked {
          border-radius: 10px !important;
          overflow: hidden !important;
        }
        html.r34e-linkcolors .r34e-type-image {
          border: ${CONFIG.borderColors.widthPx}px solid ${CONFIG.borderColors.image} !important;
          box-sizing: border-box !important;
        }
        html.r34e-linkcolors .r34e-type-video {
          border: ${CONFIG.borderColors.widthPx}px solid ${CONFIG.borderColors.video} !important;
          box-sizing: border-box !important;
        }
        html.r34e-linkcolors .r34e-type-blocked {
          border: ${CONFIG.borderColors.widthPx}px solid ${CONFIG.borderColors.blocked} !important;
          box-sizing: border-box !important;
        }
  
        /* --- Posts overview & search: "Zoom on hover" ---
           Scales span.thumb (not the <img>/<a> inside, whose target varies
           with "Borders" — see getBorderTarget()), so any border/rounding
           scales along for free. transform:scale() is paint-only, no
           reflow. z-index/position:relative added defensively even though
           flex items already paint in z-index order. Scale factor comes
           from --r34e-hoverzoom-scale (applyHoverZoom()). */
        html.r34e-hoverzoom span.thumb {
          transition: transform .15s ease;
        }
        html.r34e-hoverzoom span.thumb:hover {
          position: relative;
          z-index: 5;
          transform: scale(var(--r34e-hoverzoom-scale, 1.1));
        }
  
        /* --- Posts overview & search: "Live preview" ---
           Only the thumbnail <a> gets position:relative (overlays are
           appended as its children), only while this option is on.
  
           MUST be "span.thumb > a[...]" — a CHILD combinator, not a plain
           descendant selector. The Cloudflare badge is itself a nested <a>
           with an "s=view" href (see showHoverPreviewError()); a descendant
           selector would also match it and get position:relative from its
           OWN computed position, breaking its absolute placement.
  
           !important kept regardless — this targets a real site element a
           same-specificity site rule could still contest. */
        html.r34e-livepreview span.thumb > a[href*="s=view"] {
          position: relative !important;
        }
        /* .r34e-hover-image (image posts) shares this rule with
           .r34e-hover-video — only one is ever present per thumbnail. */
        .r34e-hover-video,
        .r34e-hover-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Unclickable on purpose: clicks must land on the underlying <a>,
             never toggle video play/pause. */
          pointer-events: none;
          z-index: 1;
        }
        /* With "Border colors and corners" on, the border lives on the
           <img> (getBorderTarget()), a sibling of this overlay — the
           overlay's own inset:0 would otherwise paint over the border
           pixels. Inset by the same border width, radius shrunk to match. */
        html.r34e-linkcolors .r34e-hover-video,
        html.r34e-linkcolors .r34e-hover-image {
          /* Explicit calc(), not "auto"/"100%" — <video> is a replaced
             element ("auto" resolves from its intrinsic size), and "100%"
             plus a non-zero inset is over-constrained and drops the inset. */
          inset: ${CONFIG.borderColors.widthPx}px;
          width: calc(100% - ${CONFIG.borderColors.widthPx * 2}px);
          height: calc(100% - ${CONFIG.borderColors.widthPx * 2}px);
          border-radius: ${10 - CONFIG.borderColors.widthPx}px;
        }
        /* .r34e-hover-download's size/position override is further below,
           after the shared .r34e-download-btn pill rules — source order
           (not !important) makes it win. */
  
        #r34e-panel {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          line-height: 1.4;
          box-sizing: border-box;
          width: 100%;
          margin: 0;
          border: 1px solid #999;
          border-width: 0 0 1px 0;
          background: #f2f2f2;
          color: #222;
        }
        html.r34e-dark #r34e-panel {
          background: ${CONFIG.dark.bg1} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        /* --- Layout: "Sticky enhancer" ---
           #r34e-panel is always the first element in <body>, so position:sticky
           needs no extra setup. z-index (30) clears everything else in this
           file (highest elsewhere is 10) so scrolled content never pokes
           through. box-shadow keeps it reading as an intentional floating bar. */
        html.r34e-stickypanel #r34e-panel {
          position: sticky;
          top: 0;
          z-index: 30;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        }
        #r34e-panel-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          font-weight: bold;
          text-align: center;
          cursor: pointer;
          user-select: none;
        }
        #r34e-panel-header:hover {
          background: rgba(0, 0, 0, 0.06);
        }
        html.r34e-dark #r34e-panel-header:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        #r34e-panel-arrow {
          font-size: 11px;
          transition: transform 0.15s ease;
        }
        #r34e-panel-body {
          display: none;
          box-sizing: border-box;
          padding: 10px 14px 14px 14px;
          gap: 16px;
          /* auto-fit + 1fr: every category gets an equal share of the width
             (however many happen to fit per row), and grid's default
             align-items/justify-items: stretch makes every category in the
             same row exactly as tall as the tallest one — a uniform grid of
             cards instead of a jagged row of differently-sized columns. */
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          border-top: 1px solid #ccc;
        }
        html.r34e-dark #r34e-panel-body {
          border-top-color: ${CONFIG.dark.border} !important;
        }
        #r34e-panel.r34e-expanded #r34e-panel-body {
          display: grid;
        }
        /* Category sections ("Layout", "Style", ...) — a bordered card so the
           uniform width/height from the grid above is visible even when a
           category has fewer rows than its neighbours. */
        .r34e-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.35);
          /* Grid items default to a content-based min-width floor (same trap
             as flex items) and won't shrink past it — without this, a card
             refuses to shrink to its assigned grid-track width and pokes
             into its neighbours at narrow viewport widths. */
          min-width: 0;
        }
        html.r34e-dark .r34e-section {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
        }
        .r34e-section-title {
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          opacity: 0.65;
          text-align: center;
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        }
        html.r34e-dark .r34e-section-title {
          border-bottom-color: rgba(255, 255, 255, 0.15);
        }
        .r34e-section-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        #r34e-panel .r34e-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          white-space: nowrap;
        }
        /* Flex items default to a min-width floor of their own content size
           and refuse to shrink past it, which is what pushed controls (the
           width slider above all) outside a narrowed card instead of
           wrapping or shrinking with it. min-width: 0 removes that floor;
           flex-wrap above is the fallback once even a shrunk child no
           longer fits next to its siblings. */
        #r34e-panel .r34e-row > * {
          min-width: 0;
        }
        /* A "field": label on its own line, control(s) below — used for the
           width slider and "Site width" button group. */
        #r34e-panel .r34e-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        /* Only section titles (e.g. "Layout") are bold, not row labels. */
        #r34e-panel .r34e-row label,
        #r34e-panel .r34e-field > .r34e-row span {
          font-weight: normal !important;
        }
        /* --- Panel: per-setting help icon + tooltip ---
           Muted "?" glyph, CSS-only tooltip (not native title) so it's
           styled consistently in both modes with no native hover delay. */
        #r34e-panel .r34e-help {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid currentColor;
          font-size: 10px;
          font-weight: bold;
          line-height: 1;
          opacity: 0.45;
          cursor: help;
          position: relative;
          transition: opacity .15s ease;
        }
        #r34e-panel .r34e-help:hover,
        #r34e-panel .r34e-help:focus-visible {
          opacity: 0.9;
          outline: none;
        }
        #r34e-panel .r34e-help::after {
          content: attr(data-tooltip);
          position: absolute;
          top: 130%;
          left: 50%;
          transform: translateX(-50%);
          width: max-content;
          max-width: 220px;
          padding: 6px 9px;
          border-radius: 6px;
          background: #222;
          color: #fff;
          font-size: 11px;
          font-weight: normal;
          line-height: 1.35;
          text-align: left;
          white-space: normal;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity .12s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          z-index: 10;
        }
        #r34e-panel .r34e-help:hover::after,
        #r34e-panel .r34e-help:focus-visible::after {
          opacity: 1;
          visibility: visible;
        }
        html.r34e-dark #r34e-panel .r34e-help::after {
          background: ${CONFIG.dark.bg2};
          border: 1px solid ${CONFIG.dark.border};
          color: ${CONFIG.dark.text};
        }
        #r34e-panel input[type="range"] {
          vertical-align: middle;
        }
        /* Same pill look as the pagination "Go" field. */
        #r34e-panel input[type="number"] {
          width: 60px;
          height: 28px;
          padding: 0 8px;
          margin: 0;
          border-radius: 8px;
          border: 1px solid #ccc;
          background: #fff;
          color: #333;
          box-sizing: border-box;
          font-size: 13px;
          font-family: inherit;
        }
        html.r34e-dark #r34e-panel input[type="number"] {
          background: ${CONFIG.dark.bg2};
          border-color: ${CONFIG.dark.border};
          color: ${CONFIG.dark.text};
        }
        /* Same shared pill-button look as .r34e-comments-toggle/
           .r34e-download-btn, scaled to the width number input's 28px height. */
        #r34e-panel button.r34e-reset {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 12px;
          margin: 0;
          border-radius: 8px;
          border: 1px solid #ccc;
          background: #fff;
          color: #333;
          font-weight: 600;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: background-color .15s ease, border-color .15s ease, color .15s ease, transform .05s ease;
        }
        #r34e-panel button.r34e-reset:hover {
          background: var(--r34e-accent);
          border-color: var(--r34e-accent);
          color: var(--r34e-accent-text);
        }
        #r34e-panel button.r34e-reset:active {
          background: var(--r34e-accent-active);
          border-color: var(--r34e-accent-active);
          color: var(--r34e-accent-text);
          transform: translateY(1px);
        }
        html.r34e-dark #r34e-panel button.r34e-reset {
          background: ${CONFIG.dark.bg2};
          border-color: ${CONFIG.dark.border};
          color: ${CONFIG.dark.text};
        }
        /* Dark-mode hover/active: the plain (non-dark) :hover/:active rules
           above lose to the generic "html.r34e-dark button {...!important}"
           rule far above (it matches every <button> unconditionally and DOES
           use !important), so dark mode needs its own answering rule here —
           same fix already applied to .r34e-comments-toggle/.r34e-download-btn/
           .r34e-inline-btn (see the shared pill-button block below). */
        html.r34e-dark #r34e-panel button.r34e-reset:hover {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark #r34e-panel button.r34e-reset:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
          transform: translateY(1px);
        }
  
        /* --- Pagination: always centered, regardless of any other toggle --- */
        #paginator {
          text-align: center;
        }
  
        /* Baseline dark mode, independent of "pretty pagination" — avoids a
           bright white block on an otherwise dark page. */
        html.r34e-dark #paginator {
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark #paginator a,
        html.r34e-dark #paginator b {
          color: var(--r34e-accent) !important;
        }
        html.r34e-dark #paginator input[type="text"],
        html.r34e-dark #paginator input[type="submit"],
        html.r34e-dark #paginator input[type="button"] {
          background-color: ${CONFIG.dark.bg2} !important;
          color: ${CONFIG.dark.text} !important;
          border-color: ${CONFIG.dark.border} !important;
        }
  
        /* --- Pagination: optional "pretty" redesign (checkbox) -------------- */
        html.r34e-pagination #paginator {
          margin: 16px 0 !important;
        }
        html.r34e-pagination #paginator .pagination {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
        }
        html.r34e-pagination #paginator .pagination a,
        html.r34e-pagination #paginator .pagination b {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 34px !important;
          height: 34px !important;
          padding: 0 10px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
          transition: background-color .15s ease, color .15s ease, border-color .15s ease;
        }
        html.r34e-pagination #paginator .pagination a:hover {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-pagination #paginator .pagination b {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-pagination #paginator .pagination a:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-pagination #paginator .pagination form.manual-page-chooser {
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          margin-left: 6px !important;
        }
        html.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="text"] {
          height: 34px !important;
          padding: 0 10px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          box-sizing: border-box !important;
          font-size: 13px !important;
          width: 70px !important;
        }
        html.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"] {
          height: 34px !important;
          padding: 0 14px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          border: 1px solid var(--r34e-accent) !important;
          background: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          cursor: pointer !important;
          box-sizing: border-box !important;
          transition: background-color .15s ease;
        }
        html.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"]:hover {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
        }
        html.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"]:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          transform: translateY(1px);
        }
  
        /* --- Pagination: pretty redesign, dark-mode accent colors ----------- */
        html.r34e-dark.r34e-pagination #paginator .pagination a,
        html.r34e-dark.r34e-pagination #paginator .pagination b {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination a:hover,
        html.r34e-dark.r34e-pagination #paginator .pagination b {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination a:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="text"] {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"] {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"]:hover {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
        }
        html.r34e-dark.r34e-pagination #paginator .pagination form.manual-page-chooser input[type="submit"]:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          transform: translateY(1px);
        }
  
        /* --- Post navigation ("< previous" / "next >" above the media) ------
           Bound to the same "Pagination" checkbox as the paginator redesign.
           Matched/relabeled by exact link text (applyPostNav()), since no
           class/id is confirmed — a text mismatch is a harmless no-op.
  
           #navlinksContainer is a flex row (.flexi) with justify-content:
           flex-start by default, which bunched "previous"/"next" on the
           left — overridden to space-between so they sit at opposite ends
           regardless of what's between them. Padding kept small-but-nonzero
           (not 0) so buttons don't touch/collide with rounded corners.
           align-items:center also fixes vertical alignment of text between them. */
        html.r34e-pagination #navlinksContainer {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        html.r34e-pagination .r34e-postnav-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 34px !important;
          padding: 0 14px !important;
          margin: 4px 0 !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
          transition: background-color .15s ease, color .15s ease, border-color .15s ease;
        }
        html.r34e-pagination .r34e-postnav-btn:hover {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-pagination .r34e-postnav-btn:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination .r34e-postnav-btn {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark.r34e-pagination .r34e-postnav-btn:hover {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination .r34e-postnav-btn:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
  
        /* --- Use system font ---
           Icon fonts (FontAwesome, Material Icons, ...) excluded so glyphs
           don't turn into garbled characters. */
        html.r34e-sysfont *:not([class*="fa-"]):not([class*="icon"]):not(.material-icons):not(.material-symbols-outlined) {
          font-family: ${CONFIG.systemFontStack} !important;
        }
  
        /* --- Layout: optional page-width cap ---
           Caps every direct child of <body> EXCEPT #r34e-panel (must stay
           full width), so it covers the whole page without needing to know
           every element the site might add. Value from --r34e-max-width
           (applySiteWidth()). */
        html.r34e-limitwidth body > *:not(#r34e-panel) {
          max-width: var(--r34e-max-width, 1700px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
        }
  
        /* --- Layout: disable ads ---
           div.postViewSidebarRight holds ad slots; the image wrapper next to
           it grows to fill freed space automatically. #pv_leaderboard is a
           second ad slot (banner above the image) — a block element, so
           display:none needs no layout compensation. */
        html.r34e-hideads .postViewSidebarRight,
        html.r34e-hideads #pv_leaderboard {
          display: none !important;
        }
  
        /* --- Panel: small button-group control (used by "Site width") ------- */
        #r34e-panel .r34e-btn-group {
          display: inline-flex;
          flex-wrap: wrap;
          max-width: 100%;
          min-width: 0;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #ccc;
        }
        html.r34e-dark #r34e-panel .r34e-btn-group {
          border-color: ${CONFIG.dark.border};
        }
        #r34e-panel .r34e-btn-group button {
          cursor: pointer;
          border: none;
          border-right: 1px solid #ccc;
          background: #fff;
          color: #333;
          padding: 4px 10px;
          font-size: 12px;
          font-family: inherit;
        }
        #r34e-panel .r34e-btn-group button:last-child {
          border-right: none;
        }
        #r34e-panel .r34e-btn-group button:hover {
          background: #f0f0f0;
        }
        #r34e-panel .r34e-btn-group button:active {
          background: #e0e0e0;
        }
        #r34e-panel .r34e-btn-group button.r34e-btn-active {
          background: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark #r34e-panel .r34e-btn-group button {
          background: ${CONFIG.dark.bg2};
          color: ${CONFIG.dark.text};
          border-right-color: ${CONFIG.dark.border};
        }
        /* !important needed: without it, this loses to the generic
           "html.r34e-dark button {...!important}" rule far above, which
           matches every <button> unconditionally and would otherwise fully
           suppress hover/active feedback here (see button.r34e-reset above
           for the same fix applied to the width-reset button). */
        html.r34e-dark #r34e-panel .r34e-btn-group button:hover {
          background: ${CONFIG.dark.bg1} !important;
        }
        html.r34e-dark #r34e-panel .r34e-btn-group button:active {
          background: ${CONFIG.dark.bg0} !important;
        }
        html.r34e-dark #r34e-panel .r34e-btn-group button.r34e-btn-active {
          background: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
  
        /* --- Single Post View: hide navigation --- */
        html.r34e-hidenav #navlinksContainer {
          display: none !important;
        }
  
        /* --- Single Post View: hide status notes ------------------------------ */
        html.r34e-hidestatus #status-notices {
          display: none !important;
        }
  
        /* --- Single Post View: let .flexi use the full remaining width ---
           Always on — otherwise leaves unused whitespace when other layout
           changes (e.g. "Site width") widen the containing column. Scoped to
           the DIRECT child of #fit-to-screen: "flexi" is also used elsewhere
           (e.g. #navlinksContainer), which this must not touch. */
        #fit-to-screen > .flexi {
          width: 100% !important;
          box-sizing: border-box !important;
        }
  
        /* --- Single Post View: status notes / navigation always full width ---
           Same reasoning as .flexi above. #navlinksContainer carries classes
           "status-notice flexi" — targeting the shared .status-notice class
           (not just that one id) covers every notice bar, present and future. */
        #status-notices,
        #navlinksContainer,
        .status-notice {
          width: 100% !important;
          box-sizing: border-box !important;
        }
  
        /* --- Single Post View: status-notice boxes had a stray side margin ---
           Site's div.status-notice carries margin:1em, which width:100%
           doesn't subtract — insets/overflows past the container edge.
           Horizontal margin zeroed to line up flush; bottom margin kept for
           uniform vertical spacing (replaces the site's <br><br>, see
           removeStatusNoticeBreaks()). */
        .status-notice {
          margin: 0 0 1em 0 !important;
        }
  
        /* --- Single Post View: "Rounded corners for boxes" ---
           Opt-in Card & Pill look for .status-notice, matching "Sidebar".
           Border fully redefined (not just border-color) since the site
           sets a plain 2px solid border; box-sizing:border-box already
           guaranteed above, so outer width is unaffected. */
        html.r34e-roundedboxes .status-notice {
          border-radius: 10px !important;
          border: 1px solid rgba(0, 0, 0, 0.10) !important;
          background: rgba(0, 0, 0, 0.02) !important;
        }
        html.r34e-dark.r34e-roundedboxes .status-notice {
          border-color: ${CONFIG.dark.border} !important;
          background: ${CONFIG.dark.bg1} !important;
        }
  
        /* --- Single Post View: #right-col must actually grow ---
           #post-view is a flex row [.sidebar (180px), .content#right-col];
           #right-col has no flex-grow of its own (site's flex-basis:100% is
           commented out), so it and everything nested inside (.flexi,
           #post-comments) never receive the extra width. Always on. */
        #right-col {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
  
        /* --- Single Post View: the image wrapper must actually grow too ---
           Once #right-col/.flexi are forced full-width, the unnamed image
           wrapper (first child of .flexi, next to the ads column) stays
           shrink-to-fit, leaving blank space when centering is off. #image
           already has inline width:100% of its parent, so growing the
           wrapper is enough. Always on. */
        .flexi > div[id=""] {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
  
        /* --- Single Post View: media element is always block-level AND
           naturally sized ---
           display:block prevents #image from flowing inline next to the
           download button inserted right before it.
  
           Site's inline #image style is width:100%; object-fit:contain,
           which — once the wrapper has no ads column to constrain it —
           stretches the box wider than the picture, and object-fit centers
           the visible content inside, faking margin-centering even with
           "Center Media" off. Natural sizing removes that always, not just
           when centersingle is on.
  
           IMPORTANT: media must never scale ABOVE its intrinsic size.
           width/height:auto (not %) + max-width/max-height guarantees that.
           Do not swap "auto" for a percentage or reintroduce object-fit. */
        #image {
          display: block !important;
          width: auto !important;
          height: auto !important;
          max-width: 100% !important;
          /* 85vh, not 100vh: leaves a little headroom above/below so the
             image doesn't butt up against the viewport edges or get flush
             against the enhancer panel/browser chrome above it. */
          max-height: 85vh !important;
        }
  
        /* --- Single Post View: "Center post content" also centers status-
           notice text (pool/parent notices, "Tag search: ..."), which is
           otherwise always left-aligned regardless of the box width set
           above. Shared .status-notice class covers #navlinksContainer too. */
        html.r34e-centersingle .status-notice {
          text-align: center !important;
        }
  
        /* --- Single Post View: "Center post content" ---
           #image is already naturally sized above; this just adds centering
           via a flex column + auto side margins. #post-comments is centered
           separately, further down the same column. */
        html.r34e-centersingle .flexi > div[id=""] {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        html.r34e-centersingle #image {
          margin: 0 auto !important;
        }
  
        /* --- Single Post View: video posts (the "Media" half of the option) ---
           #gelcomVideoContainer wraps <video id="gelcomVideoPlayer">, both
           with site inline width:100% and no height cap. Target: up to 100%
           wide but never taller than 800px, aspect ratio preserved — so a
           portrait video's CONTAINER must shrink too, not just letterbox.
           Same width/height:auto + max-height pattern as #image, 800px cap
           instead of 85vh. Centering comes free from the flex column above.
           Same never-upscale invariant as #image applies here too.
  
           Do NOT add a max-width override on the container: without one, the
           cascade falls through to the site's own inline max-width:1000px,
           keeping this box equal-or-smaller than non-centered. Adding one
           previously let a wide 16:9 video render bigger under Center than
           without it (~1422px vs 1000px) even though never upscaled past
           its own resolution. */
        html.r34e-centersingle #gelcomVideoContainer {
          width: auto !important;
          height: auto !important;
        }
        html.r34e-centersingle #gelcomVideoPlayer {
          display: block !important;
          width: auto !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: 800px !important;
          margin: 0 auto !important;
        }
        html.r34e-centersingle #post-comments {
          /* Site already caps this at max-width:680px — only centering added.
             #post-comments is a sibling of #fit-to-screen, so plain margin:auto
             would center on the full #right-col width, wider than the ads-
             squeezed image. --r34e-comments-gutter (updateCommentsGutter())
             is subtracted so it centers on the same effective width. Only
             margin-left computed; margin-right stays auto. Wrapped in max(0px, ...):
             the container has no min-width, so on a viewport narrower than
             680px + gutter the raw calc() goes negative and would otherwise
             push this off-screen to the left instead of just going flush left. */
          margin-left: max(0px, calc((100% - var(--r34e-comments-gutter, 0px) - 680px) / 2)) !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
          /* Centers the "Show N comments" toggle; text stays left-aligned
             via the #comment-list override below. */
          text-align: center !important;
        }
        html.r34e-centersingle #post-comments #comment-list {
          text-align: left !important;
        }
  
        /* --- Single Post View: "Center post content" also covers the reply
           form ---
           #comment_form is a sibling of #post-comments (both direct children
           of #right-col), hidden via inline style="display:none" until
           "Respond" is clicked (site's own toggleCommentForm()). NEVER touch
           display here — an !important display value beats that inline
           style regardless of value, which previously forced the form
           visible even before "Respond" was clicked. margin/max-width alone
           are enough to center the outer box; they're inert while
           display:none. The <table> inside is shrink-to-fit, so it's
           centered via plain margin:auto on the table itself (the classic
           technique for centering a table) rather than flex — same reasoning
           as #post-comments above, minus a display override. */
        html.r34e-centersingle #comment_form {
          max-width: 680px !important;
          /* Same max(0px, ...) clamp as #post-comments above, and for the
             same reason — avoid a negative margin-left pushing this off-screen
             on a viewport narrower than 680px + gutter. */
          margin-left: max(0px, calc((100% - var(--r34e-comments-gutter, 0px) - 680px) / 2)) !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
        }
        html.r34e-centersingle #comment_form table {
          margin: 0 auto !important;
        }
        /* When "Comment form" style is also on, its table is already
           width:100% (blockified below) so margin:auto is a no-op there —
           but its non-full-width children (captcha widget, submit button)
           still need explicit centering, done via the td flex rule further
           down. */
  
        /* --- Single Post View: "Comment form" style ---
           Opt-in restyle of #comment_form (revealed via "Respond") to match
           this script's own look, mirroring "Rounded corners for boxes" for
           the card and the panel's own input[type="number"] for the textarea.
           Top margin keeps the card from touching the Edit/Respond links
           above it. The site's <table>/<tr>/<td> markup is kept (rewriting
           it risks breaking the site's own validate_comment() JS), but the
           WHOLE table structure — table/tbody/tr/td — is switched to plain
           block boxes: leaving <tr> as display:block while <table>/<td> stay
           at their table defaults breaks the column-width algorithm (each
           row ends up auto-sized to its own content, ignoring the table's
           own width), which is why the textarea previously stayed at its
           native ~493px instead of filling the card. As plain blocks, a
           child's width:100% resolves normally against its full-width
           parent. The submit button reuses the shared .r34e-inline-btn pill
           look via classList.toggle() in applyCommentFormStyle(), so its own
           hover/dark-mode CSS lives in the "Shared pill button" block below,
           not here. */
        html.r34e-commentformstyle #comment_form {
          margin-top: 16px !important;
          padding: 12px !important;
          border-radius: 10px !important;
          border: 1px solid rgba(0, 0, 0, 0.10) !important;
          background: rgba(0, 0, 0, 0.02) !important;
          box-sizing: border-box !important;
        }
        html.r34e-dark.r34e-commentformstyle #comment_form {
          border-color: ${CONFIG.dark.border} !important;
          background: ${CONFIG.dark.bg1} !important;
        }
        html.r34e-commentformstyle #comment_form table,
        html.r34e-commentformstyle #comment_form tbody,
        html.r34e-commentformstyle #comment_form tr,
        html.r34e-commentformstyle #comment_form td {
          display: block !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        html.r34e-commentformstyle #comment_form table {
          width: 100% !important;
        }
        html.r34e-commentformstyle #comment_form tr {
          margin: 0 0 10px 0 !important;
        }
        html.r34e-commentformstyle #comment_form tr:last-child {
          margin-bottom: 0 !important;
        }
        /* "Center post content" also on: the textarea already spans full
           width regardless (below), but the captcha widget and submit
           button size to their own content — center them like everything
           else in the centered column. Higher specificity (two classes)
           than the plain #comment_form td rule above, so no source-order
           dependency. */
        html.r34e-centersingle.r34e-commentformstyle #comment_form td {
          display: flex !important;
          justify-content: center !important;
        }
        html.r34e-commentformstyle #comment_form textarea {
          width: 100% !important;
          min-height: 100px !important;
          padding: 8px 10px !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          box-sizing: border-box !important;
          font-size: 13px !important;
          font-family: inherit !important;
          resize: vertical !important;
        }
        html.r34e-dark.r34e-commentformstyle #comment_form textarea {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
  
        /* --- Shared "pill button" look ---
           One consistent design for every action button this script adds:
           comments toggle, download button, Edit/Respond links. All
           three share the Normal/Hover/Active/Visited system driven by the
           global --r34e-accent properties. */
        .r34e-comments-toggle,
        .r34e-download-btn,
        .r34e-inline-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          margin: 0;
          border-radius: 8px;
          border: 1px solid #ccc;
          background: #fff;
          color: #333;
          font-weight: 600;
          font-size: 13px;
          font-family: inherit;
          text-decoration: none;
          cursor: pointer;
          transition: background-color .15s ease, border-color .15s ease, color .15s ease, transform .05s ease;
        }
        /* Action buttons, not content links — never show the default
           "visited" purple. !important needed to beat the also-!important
           "html.r34e-dark a:visited" rule below. */
        .r34e-comments-toggle:visited,
        .r34e-download-btn:visited,
        .r34e-inline-btn:visited {
          color: #333 !important;
        }
        .r34e-comments-toggle:hover:not(:disabled),
        .r34e-download-btn:hover,
        .r34e-inline-btn:hover {
          background: var(--r34e-accent);
          border-color: var(--r34e-accent);
          color: var(--r34e-accent-text);
        }
        .r34e-comments-toggle:active:not(:disabled),
        .r34e-download-btn:active,
        .r34e-inline-btn:active {
          background: var(--r34e-accent-active);
          border-color: var(--r34e-accent-active);
          color: var(--r34e-accent-text);
          transform: translateY(1px);
        }
        .r34e-comments-toggle:disabled {
          opacity: 0.5;
          cursor: default;
        }
        html.r34e-dark .r34e-comments-toggle,
        html.r34e-dark .r34e-download-btn,
        html.r34e-dark .r34e-inline-btn {
          background: ${CONFIG.dark.bg2};
          border-color: ${CONFIG.dark.border};
          color: ${CONFIG.dark.text};
        }
        html.r34e-dark .r34e-comments-toggle:visited,
        html.r34e-dark .r34e-download-btn:visited,
        html.r34e-dark .r34e-inline-btn:visited {
          color: ${CONFIG.dark.text} !important;
        }
        /* Dark-mode hover/active — two separate rules were beating the
           plain (non-dark) :hover/:active rules above, so both need
           answering here:
           1) "html.r34e-dark .r34e-*" (0,2,1) outranks ".r34e-*:hover"
              (0,2,0) on specificity alone (the extra "html" type selector),
              even though neither uses !important — fixed by adding the
              :hover/:active pseudo-classes here too (0,3,1), no !important
              needed for that part.
           2) .r34e-comments-toggle is a <button> and (once "Comment form"
              enables it) .r34e-inline-btn also lands on an
              <input type="submit"> — both also match the much older,
              generic "html.r34e-dark input/button {...!important}" rule
              far above, which DOES use !important and would otherwise still
              win. !important here beats that on equal footing (a is not
              affected, so Edit/Respond needed only the specificity fix). */
        html.r34e-dark .r34e-comments-toggle:hover:not(:disabled),
        html.r34e-dark .r34e-download-btn:hover,
        html.r34e-dark .r34e-inline-btn:hover {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark .r34e-comments-toggle:active:not(:disabled),
        html.r34e-dark .r34e-download-btn:active,
        html.r34e-dark .r34e-inline-btn:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
          transform: translateY(1px);
        }
        /* Per-element layout: comment toggle sits inline with margin both
           sides; download button only needs a bottom margin. */
        .r34e-comments-toggle {
          margin: 10px 0;
        }
        .r34e-download-btn {
          margin: 0 0 10px 0;
        }
        /* --- Single Post View: download button, enlarged ---
           ID selector (0,1,0,0) beats the shared .r34e-download-btn class
           (0,0,1,0) on specificity alone, no !important needed — and only
           matches the one, uniquely-id'd single-post-view button, not the
           small .r34e-hover-download thumbnail variant (never carries this
           id) nor the comments-toggle/Edit/Respond buttons (share the class,
           not the id). Midpoint between the original pill size (8px 16px /
           8px / 13px / 10px margin) and the initial doubled size (16px 32px
           / 16px / 26px / 20px margin) — every metric scaled together so it
           stays one consistent shape, not just bigger text. */
        #r34e-download-btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 19.5px;
          margin: 0 0 15px 0;
        }
  
        /* --- Posts overview & search: "Live preview" hover-download button override
           Smaller than the standard button, pinned to bottom-center of the
           thumbnail. Deliberately NOT !important: same specificity as
           .r34e-download-btn, so it wins on source order alone (appears
           later) while still inheriting the unchanged pill color/hover rules. */
        .r34e-hover-download {
          position: absolute;
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%);
          z-index: 2;
          padding: 4px 10px;
          margin: 0;
          font-size: 11px;
          white-space: nowrap;
          /* !important needed on width/height: site's ".thumb a" rule
             (specificity 0,1,1) beats ".r34e-hover-download" (0,1,0) on
             specificity regardless of source order, stretching the button
             to 100% of the thumbnail. width:max-content sizes to the text. */
          width: max-content !important;
          height: max-content !important;
        }
        /* transform is a single property — the shared :active rule's
           translateY(1px) would otherwise REPLACE this element's own
           translateX(-50%) centering instead of combining with it.
           Restate both together, winning on source order (later rule). */
        .r34e-hover-download:active {
          transform: translateX(-50%) translateY(1px);
        }
  
        /* --- Posts overview & search: hover-preview failure badge ---
           Same bottom-center slot as .r34e-hover-download (never shown
           together). Dark semi-transparent pill (not the light/dark pair)
           reads clearly over any thumbnail regardless of site theme. */
        .r34e-hover-error {
          position: absolute;
          left: 50%;
          bottom: 6px;
          transform: translateX(-50%);
          z-index: 2;
          max-width: calc(100% - 16px);
          box-sizing: border-box;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(20, 20, 20, 0.85);
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          /* Clicks fall through to the thumbnail's <a> by default; the
             Cloudflare variant below re-enables pointer-events itself. */
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        /* 'cloudflare' is the one actionable failure — rendered as a real
           <a target="_blank">, sharing .r34e-download-btn/.r34e-hover-download
           classes with the standard download button for identical form/size.
           Below overrides only what differs: warn color + clickable cursor. */
        .r34e-hover-error-cloudflare {
          /* !important needed: site's ".thumb a" (0,1,1) beats this single
             class (0,1,0) on specificity, same issue as .r34e-hover-download. */
          width: max-content !important;
          height: max-content !important;
          /* max-width:max-content so the longer actionable label isn't
             clipped by the base rule's calc(100% - 16px) + ellipsis. */
          max-width: max-content !important;
          /* Matches .r34e-download-btn's shape, wins on source order. */
          border-radius: 8px;
          box-shadow: none;
          /* !important needed: beats .r34e-download-btn's dark-mode rule and
             the global "html.r34e-dark a" rule, both higher/equal specificity. */
          background: var(--r34e-warn) !important;
          border-color: var(--r34e-warn-border) !important;
          color: var(--r34e-warn-text) !important;
          /* Restated to override .r34e-hover-error's bold (700) with the
             download button's 600 — wins on source order (declared later). */
          font-weight: 600;
          pointer-events: auto;
          cursor: pointer;
          text-decoration: none;
        }
        /* filter, not new hex shades — brightness(1.1)/(0.85) on the same
           --r34e-warn fill without needing extra warn-hover/active variables.
           Underlying color is already locked in via the base rule's !important. */
        .r34e-hover-error-cloudflare:hover,
        .r34e-hover-error-cloudflare:focus {
          filter: brightness(1.1);
        }
        .r34e-hover-error-cloudflare:active {
          filter: brightness(0.85);
          /* Same transform-replaces-transform fix as .r34e-hover-download:active. */
          transform: translateX(-50%) translateY(1px);
        }
        .r34e-hover-error-cloudflare:visited {
          color: var(--r34e-warn-text) !important;
        }
        /* In dark mode, "html.r34e-dark a { color: var(--r34e-accent)
           !important }" (0,1,2 specificity) beat this badge's own !important
           color (0,1,0) — both !important, higher specificity wins. Fixed by
           matching the same (html, .r34e-dark, a) shape plus this class,
           (0,2,2), which outranks it regardless of source order. */
        html.r34e-dark a.r34e-hover-error-cloudflare {
          color: var(--r34e-warn-text) !important;
        }
  
        /* --- Single Post View: Edit/Respond, restyled as buttons ---
           The "|" separator between them is removed in JS
           (applyEditRespondButtons()) since a text node can't be styled. */
        h4.image-sublinks {
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
  
        /* Comment paginator: same pill design as the main paginator, gated by
           the same "Pagination" checkbox. Targets <a>/<b> children directly
           (no nested .pagination wrapper confirmed for multi-page). */
        html.r34e-pagination #post-comments #paginator {
          display: flex !important;
          flex-wrap: wrap !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
          margin: 12px 0 !important;
        }
        html.r34e-pagination #post-comments #paginator a,
        html.r34e-pagination #post-comments #paginator b {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 34px !important;
          height: 34px !important;
          padding: 0 10px !important;
          margin: 0 !important;
          border-radius: 8px !important;
          border: 1px solid #ccc !important;
          background: #fff !important;
          color: #333 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          text-decoration: none !important;
          box-sizing: border-box !important;
          transition: background-color .15s ease, color .15s ease, border-color .15s ease;
        }
        html.r34e-pagination #post-comments #paginator a:hover,
        html.r34e-pagination #post-comments #paginator b {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-pagination #post-comments #paginator a:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination #post-comments #paginator a,
        html.r34e-dark.r34e-pagination #post-comments #paginator b {
          background: ${CONFIG.dark.bg2} !important;
          border-color: ${CONFIG.dark.border} !important;
          color: ${CONFIG.dark.text} !important;
        }
        html.r34e-dark.r34e-pagination #post-comments #paginator a:hover,
        html.r34e-dark.r34e-pagination #post-comments #paginator b {
          background: var(--r34e-accent) !important;
          border-color: var(--r34e-accent) !important;
          color: var(--r34e-accent-text) !important;
        }
        html.r34e-dark.r34e-pagination #post-comments #paginator a:active {
          background: var(--r34e-accent-active) !important;
          border-color: var(--r34e-accent-active) !important;
          color: var(--r34e-accent-text) !important;
        }
      `;
      const style = document.createElement('style');
      style.id = 'r34e-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }
  
    /* ---------------------------------- Panel ----------------------------------- */
  
    function buildPanel() {
      const panel = document.createElement('div');
      panel.id = 'r34e-panel';
  
      // Header is the only click target that toggles the panel — controls
      // inside the body have no click listener that could also trigger it.
      // It's a <div>, not a <button>, so role/tabindex/keydown make it
      // reachable and operable via keyboard too, and aria-expanded exposes
      // its state (kept in sync inside setExpanded below).
      const header = document.createElement('div');
      header.id = 'r34e-panel-header';
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', String(!!settings.expanded));
  
      const headerLabel = document.createElement('span');
      headerLabel.textContent = 'Enhancer';
  
      const arrow = document.createElement('span');
      arrow.id = 'r34e-panel-arrow';
      arrow.textContent = settings.expanded ? '▾' : '▸';
  
      header.appendChild(headerLabel);
      header.appendChild(arrow);
      panel.appendChild(header);
  
      const body = document.createElement('div');
      body.id = 'r34e-panel-body';
      panel.appendChild(body);
  
      function setExpanded(expanded, persist) {
        settings.expanded = expanded;
        panel.classList.toggle('r34e-expanded', expanded);
        arrow.textContent = expanded ? '▾' : '▸';
        header.setAttribute('aria-expanded', String(expanded));
        if (persist) saveSettings(settings);
      }
  
      header.addEventListener('click', () => {
        setExpanded(!settings.expanded, true);
      });
  
      header.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        setExpanded(!settings.expanded, true);
      });
  
      panel.classList.toggle('r34e-expanded', !!settings.expanded);
  
      // Builds a labelled category section (e.g. "Layout", "Style"). Always a
      // single column of rows — the containing grid (#r34e-panel-body) is what
      // gives every category an equal width and height, not this function.
      function makeSection(titleText) {
        const section = document.createElement('div');
        section.className = 'r34e-section';
  
        const title = document.createElement('div');
        title.className = 'r34e-section-title';
        title.textContent = titleText;
        section.appendChild(title);
  
        const rows = document.createElement('div');
        rows.className = 'r34e-section-rows';
        section.appendChild(rows);
  
        return { section, rows };
      }
  
      // Small muted "?" glyph with a CSS-only tooltip (see .r34e-help above).
      // The tooltip text itself is only shown on hover/focus via ::after, so
      // aria-label repeats it as the icon's accessible name for screen readers.
      function makeHelpIcon(tooltip) {
        const icon = document.createElement('span');
        icon.className = 'r34e-help';
        icon.textContent = '?';
        icon.tabIndex = 0;
        icon.dataset.tooltip = tooltip;
        icon.setAttribute('aria-label', tooltip);
        return icon;
      }
  
      // Builds a single checkbox + label row. `tooltip`, if given, adds a
      // "?" help icon after the label explaining the setting on hover/focus.
      function makeCheckboxRow(id, labelText, checked, onChange, tooltip) {
        const row = document.createElement('div');
        row.className = 'r34e-row';
  
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = id;
        checkbox.checked = !!checked;
  
        const label = document.createElement('label');
        label.htmlFor = id;
        label.textContent = labelText;
  
        checkbox.addEventListener('change', () => onChange(checkbox.checked));
  
        row.appendChild(checkbox);
        row.appendChild(label);
        if (tooltip) row.appendChild(makeHelpIcon(tooltip));
        return row;
      }
  
      // Labelled field of segmented button-group options (used by "Site
      // width"): label on its own line, buttons below, one active at a time.
      function makeButtonGroupRow(labelText, options, currentValue, onChange, tooltip) {
        const field = document.createElement('div');
        field.className = 'r34e-field';
  
        const labelRow = document.createElement('div');
        labelRow.className = 'r34e-row';
        const label = document.createElement('span');
        label.textContent = labelText;
        labelRow.appendChild(label);
        if (tooltip) labelRow.appendChild(makeHelpIcon(tooltip));
  
        const groupRow = document.createElement('div');
        groupRow.className = 'r34e-row';
        const group = document.createElement('div');
        group.className = 'r34e-btn-group';
        // The active option is otherwise only conveyed visually (the
        // .r34e-btn-active class) — role/aria-label name the group, and
        // aria-pressed below exposes which button is current, for anyone
        // not seeing the highlight.
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', labelText);
  
        const buttons = options.map((opt) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = opt.label;
          btn.dataset.value = opt.value;
          const active = opt.value === currentValue;
          btn.classList.toggle('r34e-btn-active', active);
          btn.setAttribute('aria-pressed', String(active));
          group.appendChild(btn);
          return btn;
        });
  
        buttons.forEach((btn, i) => {
          btn.addEventListener('click', () => {
            buttons.forEach((b) => {
              const active = b === btn;
              b.classList.toggle('r34e-btn-active', active);
              b.setAttribute('aria-pressed', String(active));
            });
            onChange(options[i].value);
          });
        });
  
        groupRow.appendChild(group);
        field.appendChild(labelRow);
        field.appendChild(groupRow);
        return field;
      }
  
      /* --- Width --- */
      const widthField = document.createElement('div');
      widthField.className = 'r34e-field';
  
      const widthLabelRow = document.createElement('div');
      widthLabelRow.className = 'r34e-row';
  
      const widthRow = document.createElement('div');
      widthRow.className = 'r34e-row';
  
      const widthLabel = document.createElement('label');
      widthLabel.textContent = 'Thumbnail width:';
      widthLabel.htmlFor = 'r34e-width-range';
      const widthHelp = makeHelpIcon(
        'Thumbnail width in pixels. Drag the slider, type a value, or use the quick-size buttons below (Off resets to the page\'s own default).'
      );
  
      const widthRange = document.createElement('input');
      widthRange.type = 'range';
      widthRange.id = 'r34e-width-range';
      widthRange.min = String(CONFIG.width.min);
      widthRange.max = String(CONFIG.width.max);
      widthRange.step = String(CONFIG.width.step);
      widthRange.value = String(settings.width);
  
      const widthNumber = document.createElement('input');
      widthNumber.type = 'number';
      widthNumber.id = 'r34e-width-number';
      widthNumber.min = String(CONFIG.width.min);
      widthNumber.max = String(CONFIG.width.max);
      widthNumber.step = String(CONFIG.width.step);
      widthNumber.value = String(settings.width);
  
      const widthUnit = document.createElement('span');
      widthUnit.textContent = 'px';
  
      const resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'r34e-reset';
      resetBtn.textContent = 'Reset';
      resetBtn.title = 'Reset to the default value detected on the page';
  
      function setWidth(value, persist) {
        const v = clamp(Math.round(value), CONFIG.width.min, CONFIG.width.max);
        widthRange.value = String(v);
        widthNumber.value = String(v);
        settings.width = v;
        applyWidth(v);
        updateWidthPresetActive(v);
        if (persist) saveSettings(settings);
      }
  
      // Routed through rafThrottle() so the expensive per-thumbnail apply +
      // localStorage write happens at most once per frame, not once per
      // "input" event — shared by the slider and the number field alike, so
      // rapid-fire input from either one coalesces onto the same frame. The
      // slider still tracks the pointer instantly; the number field's own
      // typed characters aren't touched, only the resulting resize/save.
      const throttledSetWidth = rafThrottle((v) => setWidth(v, true));
      widthRange.addEventListener('input', () => throttledSetWidth(parseFloat(widthRange.value)));
      widthNumber.addEventListener('input', () => {
        if (widthNumber.value === '') return;
        throttledSetWidth(parseFloat(widthNumber.value));
      });
      resetBtn.addEventListener('click', () => {
        setWidth(settings.originalWidth || settings.width, true);
      });
  
      widthLabelRow.appendChild(widthLabel);
      widthLabelRow.appendChild(widthHelp);
      widthRow.appendChild(widthRange);
      widthRow.appendChild(widthNumber);
      widthRow.appendChild(widthUnit);
      widthRow.appendChild(resetBtn);
      widthField.appendChild(widthLabelRow);
      widthField.appendChild(widthRow);
  
      /* --- Width quick presets --- */
      // Button group below the slider for jumping to a common width. No
      // label of its own (folded into the "Thumbnail width" tooltip above).
      // Kept as a bespoke field, not the generic makeButtonGroupRow, since
      // it must stay bidirectionally in sync with the slider/number input.
      const widthPresetsField = document.createElement('div');
      widthPresetsField.className = 'r34e-field';
  
      const widthPresetsRow = document.createElement('div');
      widthPresetsRow.className = 'r34e-row';
      const widthPresetsGroup = document.createElement('div');
      widthPresetsGroup.className = 'r34e-btn-group';
      // Same reasoning as makeButtonGroupRow above: role/aria-label name the
      // group, aria-pressed exposes the active preset to non-visual users.
      widthPresetsGroup.setAttribute('role', 'group');
      widthPresetsGroup.setAttribute('aria-label', 'Thumbnail width presets');
  
      const widthPresetButtons = CONFIG.widthPresets.map((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = opt.label;
        btn.dataset.value = String(opt.value);
        widthPresetsGroup.appendChild(btn);
        return btn;
      });
  
      function widthPresetTarget(opt) {
        return opt.value === 'off' ? settings.originalWidth || settings.width : opt.value;
      }
  
      function updateWidthPresetActive(value) {
        widthPresetButtons.forEach((btn, i) => {
          const opt = CONFIG.widthPresets[i];
          const active = widthPresetTarget(opt) === value;
          btn.classList.toggle('r34e-btn-active', active);
          btn.setAttribute('aria-pressed', String(active));
        });
      }
  
      widthPresetButtons.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          setWidth(widthPresetTarget(CONFIG.widthPresets[i]), true);
        });
      });
  
      widthPresetsRow.appendChild(widthPresetsGroup);
      widthPresetsField.appendChild(widthPresetsRow);
      updateWidthPresetActive(settings.width);
  
      /* --- Section: Layout --- */
      // "Site width" listed first — broadest scope (whole page, not just thumbnails).
      const layoutSection = makeSection('Layout');
      layoutSection.rows.appendChild(
        makeButtonGroupRow(
          'Site width',
          CONFIG.layout.widthOptions,
          settings.siteWidth,
          (value) => {
            settings.siteWidth = value;
            applySiteWidth(value);
            saveSettings(settings);
          },
          'Caps the page to this many pixels wide (this panel stays full width); "Off" removes the limit.'
        )
      );
      layoutSection.rows.appendChild(widthField);
      layoutSection.rows.appendChild(widthPresetsField);
      layoutSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-stickypanel',
          'Sticky enhancer',
          settings.stickyPanel,
          (checked) => {
            settings.stickyPanel = checked;
            applyStickyPanel(checked);
            saveSettings(settings);
          },
          'Keeps this panel pinned to the top of the window while scrolling, instead of scrolling away with the page — still collapsible/expandable at any scroll position.'
        )
      );
      body.appendChild(layoutSection.section);
  
      /* --- Section: Style (formerly "Custom Design") ---
         Row order: Dark mode, Use system font, Simple header, Site
         navigation, Sidebar, Comment form, Pagination. */
      const designSection = makeSection('Style');
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-darkmode',
          'Dark mode',
          settings.darkmode,
          (checked) => {
            settings.darkmode = checked;
            applyDarkMode(checked);
            saveSettings(settings);
          },
          'Dark background and text colors across the whole site.'
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-sysfont',
          'Use system font',
          settings.systemFont,
          (checked) => {
            settings.systemFont = checked;
            applySystemFont(checked);
            saveSettings(settings);
          },
          "Switches all site text to your OS's native UI font."
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-simpleheader',
          'Simple header',
          settings.simpleHeader,
          (checked) => {
            settings.simpleHeader = checked;
            applySimpleHeader(checked);
            saveSettings(settings);
          },
          'Removes the decorative background image behind the "Rule 34" site title.'
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-menustyle',
          'Site navigation',
          settings.menuStyle,
          (checked) => {
            settings.menuStyle = checked;
            applyMenuStyle(checked);
            saveSettings(settings);
          },
          'Restyles the top navigation bars as rounded tabs, with normal (not bold) text.'
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-sidebarstyle',
          'Sidebar',
          settings.sidebarStyle,
          (checked) => {
            settings.sidebarStyle = checked;
            applySidebarStyle(checked);
            saveSettings(settings);
          },
          'Restyles the tag sidebar as colored cards, grouped by tag type.'
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-commentformstyle',
          'Comment form',
          settings.commentFormStyle,
          (checked) => {
            settings.commentFormStyle = checked;
            applyCommentFormStyle(checked);
            saveSettings(settings);
          },
          'Restyles the comment-reply form (shown after clicking "Respond") to match this script\'s own look: a themed, rounded textarea and a pill-style submit button.'
        )
      );
  
      designSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-pagination',
          'Paginations',
          settings.pagination,
          (checked) => {
            settings.pagination = checked;
            applyPaginationStyle(checked);
            applyPaginationLabels(checked);
            applyPostNav(checked);
            saveSettings(settings);
          },
          'Restyles page navigation as rounded buttons, with clearer First/Previous/Next/Last labels. Also applies to the "previous"/"next" post links above the media.'
        )
      );
  
      body.appendChild(designSection.section);
  
      /* --- Section: Posts overview & search --- */
      // Split out of "Style": these affect only the thumbnail grid.
      const overviewSection = makeSection('Posts overview & search');
  
      overviewSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-linkcolors',
          'Border colors and corners',
          settings.linkColors,
          (checked) => {
            settings.linkColors = checked;
            applyLinkColors(checked);
            saveSettings(settings);
          },
          'Yellow border = image, green = video, red = blocked. Corners are rounded to match the rest of the design.'
        )
      );
  
      overviewSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-disablealttext',
          'Disable alt text',
          settings.disableAltText,
          (checked) => {
            settings.disableAltText = checked;
            applyDisableAltText(checked);
            saveSettings(settings);
          },
          'Hovering a thumbnail normally pops up the browser\'s own little tooltip at the cursor, showing the post\'s full tag list. This blanks that out so hovering shows nothing extra.'
        )
      );
  
      overviewSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-livepreview',
          'Live preview',
          settings.livePreview,
          (checked) => {
            settings.livePreview = checked;
            applyLivePreview(checked);
            saveSettings(settings);
          },
          'Hovering a thumbnail shows the original file: video posts autoplay muted and looped, image posts swap in the original (usually higher-resolution) image. Clicking still goes to the single-post view as usual. Also shows a small download button on hover if "Download buttons" is on. Hover requests are delayed briefly, queued one at a time, and cached for the rest of this tab\'s session, to help avoid tripping the site\'s Cloudflare rate limit/captcha when browsing quickly. If a Cloudflare check IS up (or the fetch otherwise fails), a small badge on the thumbnail says so instead of just showing nothing — for Cloudflare specifically, clicking the badge opens that post in a new tab to solve it, then just hover here again.'
        )
      );
  
      overviewSection.rows.appendChild(
        makeButtonGroupRow(
          'Zoom on hover',
          CONFIG.hoverZoomPresets,
          settings.hoverZoom,
          (value) => {
            settings.hoverZoom = value;
            applyHoverZoom(value);
            saveSettings(settings);
          },
          'Scales a thumbnail up slightly while you hover over it, using a transform so nothing else on the page shifts around.'
        )
      );
  
      body.appendChild(overviewSection.section);
  
      /* --- Section: Single Post View --- */
      const singlePostSection = makeSection('Single Post View');
  
      singlePostSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-hidenav',
          'Hide post navigation',
          settings.hideNav,
          (checked) => {
            settings.hideNav = checked;
            applyHideNav(checked);
            saveSettings(settings);
          },
          'Hides the top navlinksContainer bar on single-post pages.'
        )
      );
  
      singlePostSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-hidestatus',
          'Hide status notices',
          settings.hideStatusNotices,
          (checked) => {
            settings.hideStatusNotices = checked;
            applyHideStatusNotices(checked);
            saveSettings(settings);
          },
          'Hides the status-notices bar on single-post pages.'
        )
      );
  
      singlePostSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-collapsecomments',
          'Collapse comments',
          settings.collapseComments,
          (checked) => {
            settings.collapseComments = checked;
            applyCollapseComments(checked);
            saveSettings(settings);
          },
          'Comments start collapsed on single-post pages; click the button to reveal them.'
        )
      );
  
      singlePostSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-centersingle',
          'Center post content',
          settings.centerSingleView,
          (checked) => {
            settings.centerSingleView = checked;
            applyCenterSingleView(checked);
            saveSettings(settings);
          },
          'Top-aligns the image/video (no more invisible padding), caps videos at 800px tall (aspect ratio preserved), and centers the media and comment section on single-post pages. Also centers the "Nobody here but us chickens!" message on a zero-result search page.'
        )
      );
  
      singlePostSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-roundedboxes',
          'Rounded corners for boxes',
          settings.roundedBoxes,
          (checked) => {
            settings.roundedBoxes = checked;
            applyRoundedBoxes(checked);
            saveSettings(settings);
          },
          'Restyles the status-notice boxes above the download button (status notices, pool/parent-post notices, post navigation) as rounded cards, matching the look of "Sidebar"/"Site navigation".'
        )
      );
  
      body.appendChild(singlePostSection.section);
  
      /* --- Section: Additions --- */
      const additionsSection = makeSection('Additions');
  
      additionsSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-hideads',
          'Ad blocker',
          settings.hideAds,
          (checked) => {
            settings.hideAds = checked;
            applyHideAds(checked);
            saveSettings(settings);
          },
          'Hides the ad column next to the image and the banner above it on single-post pages.'
        )
      );
      additionsSection.rows.appendChild(
        makeCheckboxRow(
          'r34e-downloadbtn',
          'Download buttons',
          settings.downloadButton,
          (checked) => {
            settings.downloadButton = checked;
            applyDownloadButton(checked);
            saveSettings(settings);
          },
          'Shows a "💾 Download" button between the post navigation bar and the media on single-post pages, linking directly to the original file. Left-click opens the media source directly; right-click and choose "Save Target As..." to save it straight to disk. Left-aligned by default, centered together with "Center post content". Also adds a small download button to a thumbnail\'s hover preview if "Live preview" is on.'
        )
      );
  
      body.appendChild(additionsSection.section);
  
      return panel;
    }
  
    function insertPanel(panel) {
      // Inserting right before #header puts the panel above the site title,
      // spanning the full page width.
      const header = document.getElementById('header');
      if (header && header.parentElement) {
        header.parentElement.insertBefore(panel, header);
        return;
      }
  
      document.body.insertBefore(panel, document.body.firstChild);
    }
  
    /* ------------------------------- Mutation observer --------------------------- */
  
    let observerTimer = null;
    function startObserver() {
      // Accumulates added/removed nodes across every raw callback firing
      // until the 250ms debounce below settles and processes them.
      let pendingAdded = new Set();
      let pendingRemoved = new Set();
  
      // True if any node in `roots` is, contains, or was inserted into an
      // element matching `selector` — i.e. whether this batch's added
      // content could plausibly be relevant to a function scoped to that
      // selector. The observer only watches childList/subtree, so "a
      // matching element was added (as the node itself, an ancestor, or a
      // descendant)" is the only way any of the below functions could have
      // anything new to do — lets the batch handler skip a function
      // entirely, instead of unconditionally re-running all of them (each
      // with its own document.querySelectorAll() pass) on every batch
      // regardless of what actually changed (e.g. only a hover-preview
      // overlay being added/removed).
      function addedRootsMatch(roots, selector) {
        return roots.some((node) => {
          if (node.nodeType !== 1) return false;
          return (node.closest && node.closest(selector)) || (node.querySelector && node.querySelector(selector));
        });
      }
  
      const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node.nodeType === 1) pendingAdded.add(node);
          });
          record.removedNodes.forEach((node) => {
            if (node.nodeType === 1) pendingRemoved.add(node);
          });
        });
  
        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
          const addedRoots = Array.from(pendingAdded);
          const removedRoots = Array.from(pendingRemoved);
          pendingAdded = new Set();
          pendingRemoved = new Set();
  
          // Prune darkTouched/altTitleTouched for nodes removed this batch
          // (plus descendants) — otherwise they leak references forever
          // as content is removed (infinite scroll, ...).
          removedRoots.forEach((node) => {
            darkTouched.delete(node);
            altTitleTouched.delete(node);
            if (node.querySelectorAll) {
              node.querySelectorAll('*').forEach((el) => {
                darkTouched.delete(el);
                altTitleTouched.delete(el);
              });
            }
          });
  
          const newImgs = Array.from(
            document.querySelectorAll('a[href*="s=view"] img:not([data-r34e-tagged])')
          ).filter((img) => !img.closest('#r34e-panel'));
  
          // Each gated on whether this batch's added content could plausibly
          // matter to it (see addedRootsMatch above) — every one of these is
          // already idempotent/cheap on its own (per-function guards), this
          // just avoids the document-wide querySelectorAll() each does on
          // batches that couldn't have changed anything relevant to it.
          if (addedRootsMatch(addedRoots, '#tag-sidebar')) markTagCounts();
          if (addedRootsMatch(addedRoots, '#status-notices')) removeStatusNoticeBreaks();
          if (addedRootsMatch(addedRoots, '#post-comments')) applyCollapseComments(settings.collapseComments);
          if (addedRootsMatch(addedRoots, '#image, #gelcomVideoContainer')) applyDownloadButton(settings.downloadButton);
          if (addedRootsMatch(addedRoots, 'h4.image-sublinks')) applyEditRespondButtons();
          if (addedRootsMatch(addedRoots, '#paginator')) applyPaginationLabels(settings.pagination);
          if (addedRootsMatch(addedRoots, '#navlinksContainer')) applyPostNav(settings.pagination);
          if (addedRootsMatch(addedRoots, 'h1')) applyNoResultsStyle();
          if (settings.centerSingleView) updateCommentsGutter();
  
          // Only scans nodes actually added this batch, not the whole page;
          // not gated on "new thumbnail found" — any new content is scanned.
          if (settings.darkmode && addedRoots.length) scanAndDarken(addedRoots);
  
          if (newImgs.length === 0) return;
          newImgs.forEach(classifyThumbnail);
          // Only newly classified images need this — applyDisableAltText()
          // is idempotent if it re-visits already-handled ones anyway.
          if (settings.disableAltText) applyDisableAltText(true);
          applyWidth(settings.width);
        }, 250);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  
    /* ---------------------------------- Init -------------------------------------- */
  
    function init() {
      // Guard against a second instance running (e.g. an old + renamed
      // version both installed) — would otherwise double up panels,
      // observers, and hover-preview listeners.
      if (document.getElementById('r34e-panel')) return;
  
      injectBaseStyles();
  
      const imgs = discoverAndClassify();
      markTagCounts();
      removeStatusNoticeBreaks();
      applyEditRespondButtons();
      applyNoResultsStyle();
  
      // Only trust detectDefaultWidth()'s result when thumbnails were
      // actually found — its 150px fallback is a guess for "nothing to
      // measure", not a real site default, and committing it here would
      // otherwise persist that guess forever (the null check below only
      // detects once). Leaving both null lets a later page WITH thumbnails
      // still detect the real default.
      const detected = imgs.length > 0 ? detectDefaultWidth(imgs) : null;
      if (detected !== null) {
        if (settings.originalWidth === null) {
          settings.originalWidth = detected;
        }
        if (settings.width === null) {
          settings.width = detected;
        }
      }
  
      const panel = buildPanel();
      insertPanel(panel);
  
      applyWidth(settings.width);
      applyDarkMode(settings.darkmode);
      applyLinkColors(settings.linkColors);
      applyHoverZoom(settings.hoverZoom);
      applyDisableAltText(settings.disableAltText);
      applyLivePreview(settings.livePreview);
      applyPaginationStyle(settings.pagination);
      applyPaginationLabels(settings.pagination);
      applyPostNav(settings.pagination);
      applyMenuStyle(settings.menuStyle);
      applySimpleHeader(settings.simpleHeader);
      applySidebarStyle(settings.sidebarStyle);
      applySiteWidth(settings.siteWidth);
      applyStickyPanel(settings.stickyPanel);
      applyHideAds(settings.hideAds);
      applyHideNav(settings.hideNav);
      applyHideStatusNotices(settings.hideStatusNotices);
      applyRoundedBoxes(settings.roundedBoxes);
      applyCenterSingleView(settings.centerSingleView);
      applyCollapseComments(settings.collapseComments);
      applyDownloadButton(settings.downloadButton);
      applyCommentFormStyle(settings.commentFormStyle);
      applySystemFont(settings.systemFont);
  
      window.addEventListener('resize', () => {
        if (settings.centerSingleView) updateCommentsGutter();
      });
  
      saveSettings(settings);
      startObserver();
      setupLivePreviewDelegation();
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();