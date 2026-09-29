import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const activeJs = [
  'psp-link-tracking-v42.js','psp-direct-signup-v1.js','psp-performance-v218.js','user-news-hub-v29.js',
  'user-app-core-v29.js','user-signals-core-v29.js','course-auth-path-v207.js','course-enrollment.js',
  'course-marketplace-v3.js','course-post-auth-v207.js','psp-v28-fixes.js','push-subscribe-prompt.js',
  'psp-v49-auth-compat.js','psp-v29-final.js','account-verification-v49.js','user-dashboard-v56.js',
  'course-enrollments-admin.js','admin-final-overrides.js','admin-payments-ux-v222.js','psp-v18-admin-control.js',
  'realtime-complete.js','admin-v28-fixes.js','admin-v29-final.js','email-campaign-admin-v296.js',
  'admin-users-v56-clean.js','admin-users-export-v299.js','link-manager-v221.js','team-performance-admin-v56.js',
  'ad-link-admin-v307.js','ad2-admin-v307.js','admin-team-performance-v206.js','admin-account-verification-v49.js',
  'admin-dashboard-v181.js','admin-suite-v90.js','psp-pairs-v216.js','admin-ea-indicator-v238.js',
  'audit-agent-v174.js','admin-v174-ux.js','signals-workspace-v154.js','finance-management-v179.js',
  'admin-premium-v182.js','admin-manual-paid-course-v221.js','admin-clean-route-v238.js','public-upgrades.js',
  'psp-public-performance-v40.js','live-desk-v242.js','psp-clean-routes-v44.js','freecourse2-attribution-v304.js'
];

const criticalPages = [
  'index.html','admin/index.html','admin-panel.html','team/index.html','freecourse2/index.html','courses/index.html',
  'sign-in/index.html','sign-up/index.html','sajid-khan-ghori/index.html','ghulam-abbas/index.html',
  'ad/technical/index.html','ad/fundamental/index.html'
];

const failures = [];
const exists = p => fs.existsSync(path.join(root, p));

for (const file of activeJs) {
  if (!exists(file)) {
    failures.push('Missing active JS: ' + file);
    continue;
  }
  try {
    execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
  } catch (error) {
    failures.push('JS syntax error: ' + file + '\n' + String(error.stderr || error.message));
  }
}

function resolveLocal(page, baseHref, ref) {
  ref = String(ref || '').split('?')[0].split('#')[0];
  if (!ref || /^(https?:|mailto:|tel:|data:|javascript:|\/\/|\$\{)/i.test(ref)) return null;
  let baseDir = page.includes('/') ? page.slice(0, page.lastIndexOf('/') + 1) : '';
  if (baseHref) {
    if (baseHref.startsWith('/')) baseDir = baseHref.slice(1);
    else baseDir += baseHref;
    if (baseDir && !baseDir.endsWith('/')) baseDir = baseDir.slice(0, baseDir.lastIndexOf('/') + 1);
  }
  let candidate = ref.startsWith('/') ? ref.slice(1) : baseDir + ref;
  candidate = path.posix.normalize(candidate).replace(/^\.\//, '');
  if (!candidate || candidate === '.') candidate = 'index.html';
  if (exists(candidate)) return candidate;
  if (exists(path.posix.join(candidate, 'index.html'))) return path.posix.join(candidate, 'index.html');
  return candidate;
}

for (const page of criticalPages) {
  if (!exists(page)) {
    failures.push('Missing critical page: ' + page);
    continue;
  }
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const baseMatch = html.match(/<base[^>]*href=["']([^"']+)["']/i);
  const baseHref = baseMatch?.[1] || null;
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);
  for (const ref of refs) {
    const resolved = resolveLocal(page, baseHref, ref);
    if (resolved && !exists(resolved)) failures.push('Missing local reference in ' + page + ': ' + ref + ' -> ' + resolved);
  }
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => m[1]).filter(s => s.trim());
  inline.forEach((code, index) => {
    try { new Function(code); }
    catch (error) { failures.push('Inline JS syntax error in ' + page + ' block ' + (index + 1) + ': ' + error.message); }
  });
}

for (const adminPage of ['admin/index.html','admin-panel.html']) {
  const html = fs.readFileSync(path.join(root, adminPage), 'utf8');
  if (/ad-link-admin-v305\.js|ad2-admin-v305\.js/.test(html)) failures.push('Old V305 Ad admin script still active in ' + adminPage);
  if (!/ad-link-admin-v307\.js/.test(html) || !/ad2-admin-v307\.js/.test(html)) failures.push('V307 Ad scripts missing in ' + adminPage);
}

const sql49 = fs.readFileSync(path.join(root, 'supabase/sql/049_signal_push_webhook.sql'), 'utf8');
if (/vjqvoinsspgsrcyhwspy\.supabase\.co/.test(sql49)) failures.push('Old Supabase project URL remains in SQL 049');
if (!/etfolhinohgmskbfjoyh\.supabase\.co/.test(sql49)) failures.push('Current PipSePaisa Supabase project URL missing from SQL 049');

const frontendFiles = [...activeJs, ...criticalPages];
for (const file of frontendFiles) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  if (/sb_secret_[A-Za-z0-9_-]+|service_role\s*[:=]\s*["'][^"']+/i.test(content)) {
    failures.push('Possible privileged Supabase secret in frontend file: ' + file);
  }
}

const rootHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (/cdn\.jsdelivr\.net\/npm\/\[email protected\]/i.test(rootHtml)) failures.push('Malformed Bootstrap CDN reference is back in index.html');

if (failures.length) {
  console.error('\nPipSePaisa quality check FAILED:\n');
  failures.forEach(x => console.error('- ' + x));
  process.exit(1);
}

console.log('PipSePaisa quality check passed.');
console.log('Checked ' + activeJs.length + ' active JS files and ' + criticalPages.length + ' critical pages.');
