// Read-only production SEO and PageSpeed smoke test for PipSePaisa.
// Checks public pages only. No logins, payments, database writes or UI changes.
const site = 'https://www.pipsepaisa.com';
const failures = [];
const warnings = [];

async function get(url, timeout = 25000) {
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { 'User-Agent': 'PipSePaisa-SEO-Healthcheck/1.0' },
    signal: AbortSignal.timeout(timeout)
  });
  const text = await response.text();
  return { response, text };
}
function matches(text, pattern) {
  return [...text.matchAll(pattern)].map(x => x[1]);
}
function attr(tag, name) {
  const re = new RegExp('\\b' + name + '\\s*=\\s*["\x27]([^"\x27]*)["\x27]', 'i');
  return tag.match(re)?.[1] || '';
}
function findTag(html, kind, attribute, value) {
  const tags = html.match(new RegExp('<' + kind + '\\b[^>]*>', 'gi')) || [];
  return tags.find(t => attr(t, attribute).toLowerCase() === value.toLowerCase()) || '';
}
function fail(message) { failures.push(message); console.error('FAIL  ' + message); }
function warn(message) { warnings.push(message); console.log('WARN  ' + message); }

async function checkPage(url) {
  try {
    const { response, text } = await get(url);
    if (!response.ok) { fail('HTTP ' + response.status + ' ' + url); return; }
    const head = text.split(/<\/head>/i)[0];
    const canonical = attr(findTag(head, 'link', 'rel', 'canonical'), 'href');
    const robots = attr(findTag(head, 'meta', 'name', 'robots'), 'content');
    const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
    const description = attr(findTag(head, 'meta', 'name', 'description'), 'content');
    const h1 = (text.match(/<h1\b/gi) || []).length;
    const ld = matches(head, /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const finalUrl = response.url.replace(/#.*$/, '');
    if (canonical !== url) fail('Canonical mismatch ' + url + ' -> ' + canonical);
    if (finalUrl !== url) warn('HTTP redirect ' + url + ' -> ' + finalUrl);
    if (/noindex/i.test(robots)) fail('Unexpected noindex ' + url);
    if (!title) fail('No title ' + url);
    if (!description) fail('No description ' + url);
    if (h1 !== 1) fail('Expected one H1 (' + h1 + ') ' + url);
    if (!ld.length) fail('Missing JSON-LD ' + url);
    for (const item of ld) {
      try { JSON.parse(item); }
      catch (e) { fail('Invalid JSON-LD ' + url + ': ' + e.message); }
    }
    if (response.ok && canonical === url && title && description && h1 === 1 && ld.length) {
      console.log('PASS  ' + url);
    }
  } catch (e) { fail('Network error ' + url + ': ' + String(e.message || e)); }
}
async function runLimited(items, concurrency, callback) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) await callback(items[next++]);
  }));
}
async function inspectPageSpeed(url, strategy) {
  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    + '?url=' + encodeURIComponent(url)
    + '&strategy=' + strategy + '&category=performance';
  try {
    const { response, text } = await get(endpoint, 85000);
    if (!response.ok) {
      warn('PageSpeed API unavailable: ' + strategy + ' ' + url + ' HTTP ' + response.status);
      return;
    }
    const data = JSON.parse(text);
    const score = data.lighthouseResult?.categories?.performance?.score;
    const audit = data.lighthouseResult?.audits || {};
    const metric = key => audit[key]?.displayValue || 'not provided';
    const crux = data.loadingExperience?.overall_category || 'no field sample';
    if (typeof score !== 'number') {
      warn('PageSpeed performance score not returned: ' + strategy + ' ' + url);
      return;
    }
    console.log('PAGESPEED ' + strategy.toUpperCase() + ' ' + url
      + ' | Lighthouse=' + Math.round(score * 100)
      + ' | LCP=' + metric('largest-contentful-paint')
      + ' | CLS=' + metric('cumulative-layout-shift')
      + ' | TBT=' + metric('total-blocking-time')
      + ' | CrUX=' + crux);
  } catch (e) {
    warn('PageSpeed could not run: ' + strategy + ' ' + url + ' (' + String(e.message || e) + ')');
  }
}

console.log('=== LIVE SITE SEO CRAWL (PUBLIC GET REQUESTS ONLY) ===');
let pages = [];
try {
  const sitemap = await get(site + '/sitemap.xml');
  if (!sitemap.response.ok) throw Error('sitemap HTTP ' + sitemap.response.status);
  pages = matches(sitemap.text, /<url>\s*<loc>([^<]+)<\/loc>/g);
  console.log('Sitemap URLs: ' + pages.length);
  if (pages.length < 20) fail('Unexpectedly few sitemap pages: ' + pages.length);
  if (new Set(pages).size !== pages.length) fail('Duplicate sitemap URLs');
  if (!pages.includes(site + '/courses/vsa-volume-spread-analysis/')) fail('Missing VSA mentorship from sitemap');
  if (!pages.includes(site + '/learn/volume-spread-analysis/')) fail('Missing VSA learning guide from sitemap');
  for (const url of pages) if (!url.startsWith(site + '/')) fail('External or noncanonical sitemap URL: ' + url);
  await runLimited(pages.filter(u => u.startsWith(site + '/')), 4, checkPage);
  const [robots, images] = await Promise.all([get(site + '/robots.txt'), get(site + '/image-sitemap.xml')]);
  if (!robots.response.ok || !robots.text.includes('Sitemap: ' + site + '/sitemap.xml')) fail('robots.txt sitemap directive missing');
  if (!images.response.ok || !images.text.includes('assets/courses/vsa-course-banner.webp')) fail('VSA banner missing from image sitemap');
} catch (e) { fail('Sitemap audit could not complete: ' + String(e.message || e)); }

console.log('=== GOOGLE PAGESPEED (WHEN PUBLIC API QUOTA ALLOWS) ===');
await Promise.all([
  inspectPageSpeed(site + '/', 'mobile'),
  inspectPageSpeed(site + '/', 'desktop'),
  inspectPageSpeed(site + '/courses/vsa-volume-spread-analysis/', 'mobile')
]);
console.log('=== RESULT ===');
console.log('Pages listed: ' + pages.length + '; errors: ' + failures.length + '; warnings: ' + warnings.length);
if (failures.length) process.exitCode = 1;
