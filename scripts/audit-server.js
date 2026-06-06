'use strict';

/**
 * scripts/audit-server.js — gs-theme-switcher local audit server
 *
 * Serves the demo.html static assets AND exposes an API for the
 * Repo Theme Adoption dashboard (Section 9 in demo.html).
 *
 * Usage:
 *   node scripts/audit-server.js
 *   npm run audit
 *
 * Endpoints:
 *   GET  /             → demo.html
 *   GET  /api/health   → {"ok":true}
 *   GET  /api/scan     → SSE stream of repo scan results
 *   POST /api/apply    → clone + inject + commit (no push)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { listRepos, scanRepo, applyToRepo } = require('./repo-audit');

const PORT = 3457;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

/* ── static file serving ─────────────────────────────────────────── */

function serveStatic(res, urlPath) {
  var filePath = path.normalize(path.join(ROOT, urlPath === '/' ? 'demo.html' : urlPath));
  // path traversal guard
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, function(err, data) {
    if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    var ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ── /api/scan — SSE stream ──────────────────────────────────────── */

function handleScan(res) {
  res.writeHead(200, {
    'Content-Type':                'text/event-stream',
    'Cache-Control':               'no-cache',
    'Connection':                  'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Flush headers immediately so the browser starts receiving
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  var repos;
  try {
    repos = listRepos(100);
  } catch (e) {
    res.write('data: ' + JSON.stringify({ type: 'error', message: 'gh CLI error: ' + e.message }) + '\n\n');
    res.end();
    return;
  }

  res.write('data: ' + JSON.stringify({ type: 'count', total: repos.length }) + '\n\n');

  var idx = 0;

  function next() {
    if (idx >= repos.length) {
      res.write('data: ' + JSON.stringify({ type: 'done' }) + '\n\n');
      res.end();
      return;
    }
    var repo = repos[idx++];
    var result;
    try {
      result = scanRepo(repo);
    } catch (e) {
      result = Object.assign({}, repo, {
        htmlFiles: [],
        adopted: false,
        reason: e.message,
      });
    }
    res.write('data: ' + JSON.stringify({ type: 'repo', repo: result }) + '\n\n');
    // yield to event loop between repos so connections stay responsive
    setImmediate(next);
  }

  next();
}

/* ── /api/apply ──────────────────────────────────────────────────── */

function handleApply(req, res) {
  var body = '';
  req.on('data', function(chunk) { body += chunk; });
  req.on('end', function() {
    var targets;
    try {
      var parsed = JSON.parse(body);
      targets = parsed.targets;
      if (!Array.isArray(targets) || targets.length === 0) throw new Error('targets must be a non-empty array');
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }

    var results;
    try {
      results = targets.map(function(t) {
        return Object.assign(
          { repo: t.nameWithOwner },
          applyToRepo(t.nameWithOwner, t.htmlPaths || [])
        );
      });
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(results));
  });
}

/* ── router ──────────────────────────────────────────────────────── */

var server = http.createServer(function(req, res) {
  var urlPath = req.url.split('?')[0];

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (urlPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (urlPath === '/api/scan' && req.method === 'GET') {
    handleScan(res);
    return;
  }

  if (urlPath === '/api/apply' && req.method === 'POST') {
    handleApply(req, res);
    return;
  }

  // Static files
  serveStatic(res, urlPath);
});

server.listen(PORT, '127.0.0.1', function() {
  console.log('');
  console.log('  gs-theme-switcher · repo audit server');
  console.log('  ─────────────────────────────────────');
  console.log('  http://localhost:' + PORT);
  console.log('');
  console.log('  GET  /api/health  →  server status');
  console.log('  GET  /api/scan    →  SSE: stream repo scan results');
  console.log('  POST /api/apply   →  clone + inject + commit (no push)');
  console.log('');
  console.log('  Press Ctrl-C to stop');
  console.log('');
});

process.on('SIGINT',  function() { server.close(); process.exit(0); });
process.on('SIGTERM', function() { server.close(); process.exit(0); });
