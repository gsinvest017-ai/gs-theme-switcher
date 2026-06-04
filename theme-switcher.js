/**
 * theme-switcher.js — gs-theme-switcher
 * https://github.com/gsinvest/gs-theme-switcher
 *
 * Drop-in multi-theme switcher for vanilla HTML pages.
 * Works with themes.css — sets <html data-theme="…"> and
 * injects a picker UI into <header>.
 *
 * ── Quick start ──────────────────────────────────────────────────
 * <head>
 *   <link rel="stylesheet" href="themes.css">
 *   <script src="theme-switcher.js"></script>   <!-- before </head> -->
 * </head>
 * <body>
 *   <header>…</header>   <!-- picker is appended here automatically -->
 * </body>
 *
 * ── Configuration (optional) ─────────────────────────────────────
 * Set window.GsThemeSwitcherConfig BEFORE loading this script:
 *
 *   <script>
 *     window.GsThemeSwitcherConfig = {
 *       lsKey:        'my-app-theme',      // localStorage key (default: 'gs-theme')
 *       defaultTheme: 'vscode-dark',       // fallback (default: 'genesis-gold')
 *       headerSelector: '.my-header',      // where to inject picker (default: 'header')
 *       themes: [                          // override full theme list
 *         { id: 'genesis-gold', label: '✦ Genesis Gold' },
 *         { id: 'vscode-dark',  label: '◈ VSCode Dark'  },
 *       ],
 *     };
 *   </script>
 *   <script src="theme-switcher.js"></script>
 *
 * ── ES module import ──────────────────────────────────────────────
 * import ThemeSwitcher from './theme-switcher.js';
 * ThemeSwitcher.apply('gs-portal');
 * document.querySelector('.my-nav').appendChild(ThemeSwitcher.buildPicker());
 */

(function (global, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();          // CommonJS / Node
  } else if (typeof define === 'function' && define.amd) {
    define(factory);                     // AMD
  } else {
    global.ThemeSwitcher = factory();    // browser global
    global.ThemeSwitcher._autoInit();   // run auto-init when loaded as <script>
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  var DEFAULT_THEMES = [
    { id: 'genesis-gold', label: '✦ Genesis Gold' },
    { id: 'vscode-dark',  label: '◈ VSCode Dark'  },
    { id: 'gs-portal',    label: '⬡ GS Portal'    },
  ];

  var cfg = {};

  function _config() {
    var ext = (typeof globalThis !== 'undefined' && globalThis.GsThemeSwitcherConfig) ||
              (typeof window    !== 'undefined' && window.GsThemeSwitcherConfig) || {};
    return {
      lsKey:          ext.lsKey          || 'gs-theme',
      defaultTheme:   ext.defaultTheme   || 'genesis-gold',
      headerSelector: ext.headerSelector || 'header',
      themes:         ext.themes         || DEFAULT_THEMES,
    };
  }

  function apply(id) {
    cfg = _config();
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem(cfg.lsKey, id); } catch (_) {}
  }

  function current() {
    cfg = _config();
    var saved;
    try { saved = localStorage.getItem(cfg.lsKey); } catch (_) {}
    return saved || cfg.defaultTheme;
  }

  function buildPicker(currentId) {
    cfg = _config();
    currentId = currentId || current();

    var wrap = document.createElement('div');
    wrap.id        = 'gs-theme-picker';
    wrap.className = 'theme-picker';

    var label = document.createElement('span');
    label.className   = 'theme-picker-label';
    label.textContent = 'Theme';
    wrap.appendChild(label);

    cfg.themes.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className       = 'theme-btn' + (t.id === currentId ? ' active' : '');
      btn.dataset.themeId = t.id;
      btn.textContent     = t.label;
      btn.title           = t.id;
      btn.addEventListener('click', function () {
        apply(t.id);
        wrap.querySelectorAll('.theme-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.themeId === t.id);
        });
        if (typeof ThemeSwitcher._onChange === 'function') ThemeSwitcher._onChange(t.id);
      });
      wrap.appendChild(btn);
    });

    return wrap;
  }

  function injectPicker() {
    cfg = _config();
    if (document.getElementById('gs-theme-picker')) return;
    var header = document.querySelector(cfg.headerSelector);
    if (!header) return;
    header.appendChild(buildPicker(current()));
  }

  var ThemeSwitcher = {
    /** Apply a theme by ID and persist to localStorage. */
    apply: apply,

    /** Return the currently active theme ID. */
    current: current,

    /** Build and return the picker <div> (does NOT inject it). */
    buildPicker: buildPicker,

    /** Inject the picker into the header (called automatically). */
    injectPicker: injectPicker,

    /** Optional callback: ThemeSwitcher._onChange = function(themeId) {} */
    _onChange: null,

    /** Called automatically when loaded as a plain <script>. */
    _autoInit: function () {
      apply(current());  // apply before DOM renders to avoid FOUC
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectPicker);
      } else {
        injectPicker();
      }
    },
  };

  return ThemeSwitcher;
}));
