'use strict';

/**
 * scripts/repo-audit.js — gs-theme-switcher repo adoption scanner
 *
 * API:
 *   listRepos(limit)               → array of {name, nameWithOwner, url, isPrivate, isFork}
 *   scanRepo(repo)                 → repo + {branch, htmlFiles, adopted, adoptedCount, reason?}
 *   applyToRepo(nameWithOwner, htmlPaths) → {ok, tmpDir, injected?, pushCmd?, prCmd?, reason?}
 */

const { execSync } = require('child_process');
const os   = require('os');
const path = require('path');
const fs   = require('fs');

const CDN_BASE   = 'https://cdn.jsdelivr.net/gh/gsinvest/gs-theme-switcher@master';
const INJECT_BIN = path.resolve(__dirname, '..', 'bin', 'inject.js');
const MAX_HTML_PER_REPO = 12;

/* ── exec helper ─────────────────────────────────────────────────── */

function run(cmd, opts) {
  return execSync(cmd, Object.assign({ encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }, opts || {}));
}

/* ── adoption detection ──────────────────────────────────────────── */

var SIGS = [
  { name: 'css-link',  re: /themes\.css/i },
  { name: 'js-script', re: /theme-switcher\.js/i },
  { name: 'marker',    re: /gs-theme-switcher:(css|js)/i },
  { name: 'data-theme',re: /data-theme=/i },
];

function detectAdoption(content) {
  var hits = SIGS.filter(function(s) { return s.re.test(content); }).map(function(s) { return s.name; });
  var hasMarker = hits.includes('marker');
  var hasBoth   = hits.includes('css-link') && hits.includes('js-script');
  return { signals: hits, adopted: hasMarker || hasBoth };
}

function decodeBase64Content(b64str) {
  return Buffer.from(b64str.replace(/\s/g, ''), 'base64').toString('utf8');
}

/* ── repo listing ─────────────────────────────────────────────────
 * gh repo list only returns personal repos; org repos need separate
 * calls per org.  We also fetch gh org list to cover all 27 repos.
 * ────────────────────────────────────────────────────────────────── */

var REPO_FIELDS = '--json name,nameWithOwner,url,isPrivate,isFork';

function fetchRepoList(owner, limit) {
  var ownerArg = owner ? ' "' + owner + '"' : '';
  var out = run('gh repo list' + ownerArg + ' ' + REPO_FIELDS + ' --limit ' + limit);
  return JSON.parse(out);
}

function listOrgs() {
  try {
    var out = run('gh org list --limit 50');
    return out.trim().split('\n').map(function(s) { return s.trim(); }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

function listRepos(limit) {
  limit = limit || 100;
  var all  = [];
  var seen = {};

  function add(repos) {
    repos.forEach(function(r) {
      if (!seen[r.nameWithOwner]) {
        seen[r.nameWithOwner] = true;
        all.push(r);
      }
    });
  }

  // Personal repos
  try { add(fetchRepoList(null, limit)); } catch (e) {}

  // Org repos (user may belong to orgs like gsinvest)
  var orgs = listOrgs();
  orgs.forEach(function(org) {
    try { add(fetchRepoList(org, limit)); } catch (e) {}
  });

  return all;
}

/* ── per-repo scan ───────────────────────────────────────────────── */

function getDefaultBranch(nameWithOwner) {
  try {
    var out = run('gh api repos/' + nameWithOwner + ' --jq .default_branch');
    return out.trim() || 'HEAD';
  } catch (e) {
    return 'HEAD';
  }
}

function getHtmlFilesInRepo(nameWithOwner, branch) {
  try {
    var out = run('gh api "repos/' + nameWithOwner + '/git/trees/' + branch + '?recursive=1"');
    var tree = JSON.parse(out).tree || [];
    return tree
      .filter(function(f) { return f.type === 'blob' && /\.(html|htm)$/i.test(f.path); })
      .slice(0, MAX_HTML_PER_REPO);
  } catch (e) {
    return [];
  }
}

function checkHtmlFile(nameWithOwner, filePath) {
  try {
    var out = run('gh api "repos/' + nameWithOwner + '/contents/' + filePath + '"');
    var data = JSON.parse(out);
    var content = decodeBase64Content(data.content || '');
    var result = detectAdoption(content);
    return Object.assign({ path: filePath }, result);
  } catch (e) {
    return { path: filePath, signals: [], adopted: false, error: 'fetch failed' };
  }
}

function scanRepo(repo) {
  var branch = getDefaultBranch(repo.nameWithOwner);
  var fileNodes = getHtmlFilesInRepo(repo.nameWithOwner, branch);

  if (fileNodes.length === 0) {
    return Object.assign({}, repo, {
      branch: branch,
      htmlFiles: [],
      adopted: false,
      adoptedCount: 0,
      reason: 'no HTML files',
    });
  }

  var htmlFiles = fileNodes.map(function(f) {
    return checkHtmlFile(repo.nameWithOwner, f.path);
  });

  var adoptedFiles  = htmlFiles.filter(function(f) { return f.adopted; });

  return Object.assign({}, repo, {
    branch: branch,
    htmlFiles: htmlFiles,
    adopted: adoptedFiles.length > 0,
    adoptedCount: adoptedFiles.length,
  });
}

/* ── apply: clone → inject → commit (no push) ───────────────────── */

function applyToRepo(nameWithOwner, htmlPaths) {
  var slug   = nameWithOwner.replace(/\//g, '__');
  var tmpDir = path.join(os.tmpdir(), 'gs-theme-' + slug + '-' + Date.now());

  try {
    // Clone (shallow)
    run('gh repo clone "' + nameWithOwner + '" "' + tmpDir + '" -- --depth 1');

    // Create branch
    run('git -C "' + tmpDir + '" checkout -b feat/gs-theme-switcher');

    // Inject into each requested HTML file
    var injected = [];
    (htmlPaths || []).forEach(function(relPath) {
      var absHtml = path.join(tmpDir, relPath);
      if (!fs.existsSync(absHtml)) return;
      try {
        var result = run('node "' + INJECT_BIN + '" inject "' + absHtml + '" --base "' + CDN_BASE + '"');
        // inject.js exits 0 for success and "already injected"
        if (!/Already injected/.test(result)) {
          injected.push(relPath);
        }
      } catch (e) {
        // skip files where inject fails (e.g. no </head>)
      }
    });

    if (injected.length === 0) {
      return {
        ok: false,
        reason: 'Nothing injected — files may already be adopted or have no </head> tag',
        tmpDir: tmpDir,
      };
    }

    // Commit
    run('git -C "' + tmpDir + '" add -A');
    run('git -C "' + tmpDir + '" commit -m "feat: apply gs-theme-switcher CSS/JS"');

    return {
      ok: true,
      tmpDir: tmpDir,
      injected: injected,
      pushCmd: 'git -C "' + tmpDir + '" push origin feat/gs-theme-switcher',
      prCmd:   'gh pr create --repo "' + nameWithOwner + '" --head feat/gs-theme-switcher --title "feat: apply gs-theme-switcher" --body "Auto-applied via gs-theme-switcher audit dashboard"',
    };
  } catch (e) {
    return { ok: false, reason: e.message, tmpDir: tmpDir };
  }
}

module.exports = { listRepos, scanRepo, applyToRepo };
