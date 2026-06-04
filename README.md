# gs-theme-switcher

Drop-in multi-theme switcher for vanilla HTML pages.  
Two files, zero dependencies, no build step.

**Three built-in themes:**

| Theme | Style | Accent |
|-------|-------|--------|
| `genesis-gold` | warm-black dark | gold `#d4af37` |
| `vscode-dark`  | cool-blue dark  | blue `#58a6ff` |
| `gs-portal`    | light parchment | teal `#0B5F5A` |

---

## Quick start

```html
<head>
  <!-- Load BEFORE any other CSS that uses var(--…) -->
  <link rel="stylesheet" href="themes.css">
  <script src="theme-switcher.js"></script>
</head>
<body>
  <header>…</header>   <!-- picker is appended here automatically -->
</body>
```

The script:
1. Reads the saved theme from `localStorage('gs-theme')` (or uses `genesis-gold`)
2. Sets `<html data-theme="…">` **immediately** — no flash of wrong theme
3. Appends a `.theme-picker` pill-button row to the first `<header>` once DOM is ready

---

## Configuration

Set `window.GsThemeSwitcherConfig` **before** loading the script:

```html
<script>
  window.GsThemeSwitcherConfig = {
    lsKey:          'my-app-theme',  // localStorage key (default: 'gs-theme')
    defaultTheme:   'vscode-dark',   // fallback (default: 'genesis-gold')
    headerSelector: '.site-nav',     // where to inject picker (default: 'header')
    themes: [                        // restrict / reorder themes
      { id: 'genesis-gold', label: '✦ Gold' },
      { id: 'vscode-dark',  label: '◈ Dark' },
    ],
  };
</script>
<script src="theme-switcher.js"></script>
```

---

## Programmatic API

```js
// Apply a theme
ThemeSwitcher.apply('gs-portal');

// Current theme ID
ThemeSwitcher.current();       // → 'genesis-gold'

// Build picker without injecting it
const picker = ThemeSwitcher.buildPicker();
document.querySelector('.my-nav').appendChild(picker);

// Change callback
ThemeSwitcher._onChange = (id) => console.log('theme →', id);
```

ES module / CommonJS:
```js
import ThemeSwitcher from './theme-switcher.js';
ThemeSwitcher.apply('vscode-dark');
```

---

## CSS variable reference

All themes expose the same properties — components only need `var(--…)`:

| Variable | Role |
|----------|------|
| `--bg-0` `--bg-1` `--bg-2` | background ladder (darkest → lightest / lightest → mid) |
| `--bg-card` `--bg-card-hover` | card / panel surface |
| `--line` `--line-hi` | borders / dividers |
| `--fg-0` `--fg-1` `--fg-2` `--fg-dim` | foreground text ladder |
| `--accent` | interactive accent (links, focus, primary buttons) |
| `--ok` `--warn` `--err` | semantic status colors |
| `--gold` `--gold-light` `--gold-soft` | accent family |
| `--champagne` `--amber` `--rose` `--copper` `--bronze` | extended palette |
| `--font-sans` `--font-mono` | font stacks |
| `--bg` `--panel` `--border` `--fg` `--muted` | compat aliases |

---

## Integration with existing projects

Add to any page that already has a `<header>`:

```html
<!-- Add these two lines; the rest of your CSS continues to work via var(--…) -->
<link rel="stylesheet" href="path/to/themes.css">
<script src="path/to/theme-switcher.js"></script>
```

If your existing CSS uses hardcoded hex colors instead of `var(--…)`, add
`[data-theme="…"]` overrides in `themes.css` to override them
(see the `gs-portal` section in `themes.css` for examples).

---

## Live demo

Open `demo.html` in a browser, or:

```bash
npm run demo   # serves on http://localhost:3456
```

---

## File overview

```
themes.css           CSS variables for all three themes + .theme-picker component
theme-switcher.js    IIFE / CJS / AMD — apply(), buildPicker(), injectPicker()
demo.html            Self-contained live demo
```

---

## Origin

Extracted from [autogo](https://github.com/gsinvest/autogo) dashboard UI.  
Canonical source: `web/static/themes.css` + `web/static/theme-switcher.js`

MIT License
