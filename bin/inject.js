#!/usr/bin/env node
/**
 * bin/inject.js — gs-theme-switcher CLI
 *
 * Usage:
 *   npx gs-theme-switcher inject <html-file>          # CDN (default)
 *   npx gs-theme-switcher inject <html-file> --local  # relative path in same dir
 *   npx gs-theme-switcher inject <html-file> --base <url-or-path>
 *   npx gs-theme-switcher inject <html-file> --dry-run
 *   npx gs-theme-switcher inject <html-file> --revert
 *
 * Examples:
 *   npx gs-theme-switcher inject templates/base.html
 *   npx gs-theme-switcher inject index.html --base /static/vendor/gs-theme-switcher
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master';

const MARKER_CSS = '<!-- gs-theme-switcher:css -->';
const MARKER_JS  = '<!-- gs-theme-switcher:js -->';

/* ── arg parsing ────────────────────────────────────────────────── */

const args    = process.argv.slice(2);
const command = args[0];

if (!command || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command !== 'inject') {
  console.error(`Unknown command: ${command}. Use: inject`);
  process.exit(1);
}

const htmlFile = args[1];
if (!htmlFile) {
  console.error('Usage: gs-theme-switcher inject <html-file>');
  process.exit(1);
}

const flags = {
  dryRun: args.includes('--dry-run'),
  revert: args.includes('--revert'),
  local:  args.includes('--local'),
  base:   '',
};

const baseIdx = args.indexOf('--base');
if (baseIdx !== -1 && args[baseIdx + 1]) {
  flags.base = args[baseIdx + 1].replace(/\/$/, '');
} else if (flags.local) {
  flags.base = '.';
} else {
  flags.base = CDN_BASE;
}

/* ── read file ───────────────────────────────────────────────────── */

const absPath = path.resolve(htmlFile);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

let html = fs.readFileSync(absPath, 'utf8');

/* ── revert ─────────────────────────────────────────────────────── */

if (flags.revert) {
  const before = html;
  // remove injected lines (with or without markers)
  html = html.replace(/[ \t]*<!-- gs-theme-switcher:css -->[ \t]*<link[^>]+themes[^>]+>\n?/g, '');
  html = html.replace(/[ \t]*<!-- gs-theme-switcher:js -->[ \t]*<script[^>]+theme-switcher[^>]*><\/script>\n?/g, '');
  // also remove bare lines (legacy)
  html = html.replace(/[ \t]*<link[^>]+gs-theme-switcher[^>]+>\n?/g, '');
  html = html.replace(/[ \t]*<script[^>]+gs-theme-switcher[^>]*><\/script>\n?/g, '');

  if (html === before) {
    console.log('Nothing to revert (gs-theme-switcher tags not found).');
    process.exit(0);
  }

  if (!flags.dryRun) {
    fs.writeFileSync(absPath, html, 'utf8');
    console.log(`Reverted: ${htmlFile}`);
  } else {
    console.log('[dry-run] Would revert:', htmlFile);
    console.log(html);
  }
  process.exit(0);
}

/* ── check if already injected ──────────────────────────────────── */

if (html.includes('themes.css') && html.includes('theme-switcher.js')) {
  console.log('Already injected (themes.css + theme-switcher.js found). Use --revert to remove.');
  process.exit(0);
}

/* ── build snippet ───────────────────────────────────────────────── */

const cssUrl = `${flags.base}/themes.css`;
const jsUrl  = `${flags.base}/theme-switcher.js`;

// detect existing indentation before </head>
const headMatch = html.match(/^([ \t]*)<\/head>/m);
const indent    = headMatch ? headMatch[1] : '  ';

const snippet = [
  `${indent}${MARKER_CSS} <link rel="stylesheet" href="${cssUrl}">`,
  `${indent}${MARKER_JS} <script src="${jsUrl}"></script>`,
  '',
].join('\n');

/* ── inject ──────────────────────────────────────────────────────── */

if (!/<\/head>/i.test(html)) {
  console.error('No </head> tag found in', htmlFile);
  process.exit(1);
}

const patched = html.replace(/<\/head>/i, `${snippet}</head>`);

if (flags.dryRun) {
  console.log(`[dry-run] Would inject into: ${htmlFile}`);
  console.log('--- snippet ---');
  console.log(snippet.trimEnd());
  console.log('---------------');
  process.exit(0);
}

fs.writeFileSync(absPath, patched, 'utf8');
console.log(`Injected into: ${htmlFile}`);
console.log(`  CSS: ${cssUrl}`);
console.log(`  JS:  ${jsUrl}`);
console.log('Run with --revert to undo.');

/* ── help ────────────────────────────────────────────────────────── */

function printHelp() {
  console.log(`
gs-theme-switcher inject — auto-insert theme CSS/JS into an HTML file

Usage:
  npx gs-theme-switcher inject <html-file> [options]

Options:
  --base <url>   Base URL/path for themes.css & theme-switcher.js
                 Default: ${CDN_BASE}
  --local        Use relative path "." (same directory as html-file)
  --dry-run      Print what would change, don't write
  --revert       Remove previously injected tags

Examples:
  npx gs-theme-switcher inject index.html
  npx gs-theme-switcher inject templates/base.html --local
  npx gs-theme-switcher inject index.html --base /static/gs-theme
  npx gs-theme-switcher inject index.html --revert
`);
}
