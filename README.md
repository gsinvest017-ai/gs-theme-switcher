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

## Quick start — CDN (fastest, no install)

```html
<head>
  <!-- Load BEFORE any other CSS that uses var(--…) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/themes.css">
  <script src="https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/theme-switcher.js"></script>
</head>
<body>
  <header>…</header>   <!-- picker is appended here automatically -->
</body>
```

Pin to a specific commit for stability:
```
https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@<commit-sha>/themes.css
```

Minified versions (smaller payload):
```
https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/dist/themes.min.css
https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/dist/theme-switcher.min.js
```

---

## Quick start — local copy

```bash
# copy files into your project
curl -O https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/themes.css
curl -O https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/theme-switcher.js
```

```html
<head>
  <link rel="stylesheet" href="themes.css">
  <script src="theme-switcher.js"></script>
</head>
```

---

## CLI inject (auto-insert into HTML)

```bash
# one-time inject — inserts two lines before </head>, uses CDN by default
npx gs-theme-switcher inject index.html

# use local copy instead of CDN
npx gs-theme-switcher inject index.html --local

# custom base path (e.g. served from /static/)
npx gs-theme-switcher inject index.html --base /static/gs-theme

# preview without writing
npx gs-theme-switcher inject index.html --dry-run

# undo
npx gs-theme-switcher inject index.html --revert
```

---

## Framework integrations

### Flask / Jinja2

In your base template (`templates/base.html`):

```html
<head>
  <link rel="stylesheet" href="{{ url_for('static', filename='gs-theme/themes.css') }}">
  <script src="{{ url_for('static', filename='gs-theme/theme-switcher.js') }}"></script>
</head>
```

Or use CDN — no static files needed:

```html
<head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/themes.css">
  <script src="https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/theme-switcher.js"></script>
</head>
```

Auto-inject into an existing template:

```bash
npx gs-theme-switcher inject templates/base.html
```

---

### Streamlit

Streamlit doesn't expose `<head>` directly, but `st.markdown` with `unsafe_allow_html=True` injects a `<style>` block:

```python
import streamlit as st

CDN = "https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master"

st.markdown(f"""
<link rel="stylesheet" href="{CDN}/themes.css">
<script src="{CDN}/theme-switcher.js"></script>
""", unsafe_allow_html=True)
```

> Note: Streamlit's own theme overrides some global `body` styles.
> Use `:root[data-theme="…"] .stApp` selectors to override Streamlit specifically.

---

### Plotly Dash

```python
import dash
from dash import html

CDN = "https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master"

app = dash.Dash(
    __name__,
    external_stylesheets=[f"{CDN}/themes.css"],
    external_scripts=[f"{CDN}/theme-switcher.js"],
)

app.layout = html.Div([
    html.Header([html.H1("My Dashboard")]),
    # … your layout
])
```

---

### React / Vite

```bash
# copy into your public folder (or use CDN in index.html)
cp node_modules/gs-theme-switcher/themes.css       public/
cp node_modules/gs-theme-switcher/theme-switcher.js public/
```

In `index.html`:
```html
<head>
  <link rel="stylesheet" href="/themes.css">
  <script src="/theme-switcher.js"></script>
</head>
```

Or import from npm (after `npm install gs-theme-switcher`):

```js
// main.jsx / main.ts
import 'gs-theme-switcher/themes.css';
import ThemeSwitcher from 'gs-theme-switcher';

ThemeSwitcher.apply(ThemeSwitcher.current());

// Render picker into a React ref
function ThemePicker() {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && !ref.current.hasChildNodes()) {
      ref.current.appendChild(ThemeSwitcher.buildPicker());
    }
  }, []);
  return <div ref={ref} />;
}
```

---

### Vue / Nuxt

In `nuxt.config.ts`:
```ts
export default defineNuxtConfig({
  app: {
    head: {
      link:   [{ rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/themes.css' }],
      script: [{ src: 'https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master/theme-switcher.js' }],
    },
  },
});
```

In a Vue SFC:
```vue
<script setup>
onMounted(() => {
  // ThemeSwitcher is available as window.ThemeSwitcher after the script loads
  window.ThemeSwitcher?._autoInit();
});
</script>
```

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

## npm install

```bash
npm install gs-theme-switcher
```

After install, files are in `node_modules/gs-theme-switcher/` — copy or reference via your bundler.

---

## Live demo

Open `demo.html` in a browser, or:

```bash
npm run demo   # serves on http://localhost:3456
```

---

## File overview

```
themes.css              CSS variables for all three themes + .theme-picker component
theme-switcher.js       IIFE / CJS / AMD — apply(), buildPicker(), injectPicker()
dist/themes.min.css     minified (≈-42%)
dist/theme-switcher.min.js  minified (≈-50%)
bin/inject.js           CLI — npx gs-theme-switcher inject <html-file>
scripts/build.js        build → dist/  (zero npm deps)
demo.html               Self-contained live demo
```

---

## Origin

Extracted from [autogo](https://github.com/gsinvest/autogo) dashboard UI.  
Canonical source: `web/static/themes.css` + `web/static/theme-switcher.js`

MIT License
