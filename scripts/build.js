#!/usr/bin/env node
/**
 * scripts/build.js — 最小化 themes.css + theme-switcher.js → dist/
 * Node.js only, zero external dependencies.
 *
 * Usage:  node scripts/build.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

/* ── helpers ─────────────────────────────────────────────────────── */

function minifyCSS(src) {
  return src
    // remove /* … */ block comments (non-greedy)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    // remove space around punctuation
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    // remove trailing ; before }
    .replace(/;}/g, '}')
    .trim();
}

function minifyJS(src) {
  return src
    // remove /* … */ block comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // remove // line comments (not inside strings — good-enough heuristic)
    .replace(/(?<![:"'])\/\/[^\n]*/g, '')
    // collapse blank lines and leading/trailing whitespace per line
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    // collapse adjacent single-char lines only where safe — keep one space between tokens
    .join(' ')
    // collapse multiple spaces
    .replace(/  +/g, ' ')
    .trim();
}

/* ── process files ──────────────────────────────────────────────── */

const COMPONENTS = path.join(ROOT, 'components');

const files = [
  { src: 'themes.css',                              dst: 'themes.min.css',        fn: minifyCSS },
  { src: 'theme-switcher.js',                       dst: 'theme-switcher.min.js', fn: minifyJS  },
  { src: path.join('components', 'ide-chrome.css'), dst: 'ide-chrome.min.css',    fn: minifyCSS },
  { src: path.join('components', 'lucide.css'),     dst: 'lucide.min.css',        fn: minifyCSS },
];

let ok = true;

files.forEach(({ src, dst, fn }) => {
  const srcPath = path.join(ROOT, src);
  const dstPath = path.join(DIST, dst);

  if (!fs.existsSync(srcPath)) {
    console.error(`[build] MISSING: ${src}`);
    ok = false;
    return;
  }

  const raw  = fs.readFileSync(srcPath, 'utf8');
  const mini = fn(raw);
  fs.writeFileSync(dstPath, mini, 'utf8');

  const saved = (((raw.length - mini.length) / raw.length) * 100).toFixed(1);
  console.log(`[build] ${src.padEnd(22)} → dist/${dst}  (${raw.length}B → ${mini.length}B, -${saved}%)`);
});

if (ok) {
  console.log('[build] Done.');
} else {
  process.exit(1);
}
