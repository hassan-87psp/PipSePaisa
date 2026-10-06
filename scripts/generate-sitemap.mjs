import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const base = 'https://www.pipsepaisa.com/';

function walk(dir='') {
  const abs=path.join(root,dir);
  const out=[];
  for (const entry of fs.readdirSync(abs,{withFileTypes:true})) {
    if (['.git','node_modules'].includes(entry.name)) continue;
    const rel=path.posix.join(dir.replaceAll('\\','/'),entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

function attr(html, tagName, attrName, attrValue, wanted) {
  const tags=[...html.matchAll(new RegExp('<'+tagName+'\\b[^>]*>','gi'))].map(m=>m[0]);
  for (const tag of tags) {
    if (attrName && attrValue) {
      const gate=tag.match(new RegExp('\\b'+attrName+'=["\\\']([^"\\\']+)["\\\']','i'))?.[1];
      if ((gate||'').toLowerCase()!==attrValue.toLowerCase()) continue;
    }
    const found=tag.match(new RegExp('\\b'+wanted+'=["\\\']([^"\\\']+)["\\\']','i'))?.[1];
    if (found) return found;
  }
  return null;
}

const urls=new Set();
for (const file of walk('').filter(f=>f.endsWith('.html')&&!/ - Copy|\(\d+\)/i.test(f))) {
  const html=fs.readFileSync(path.join(root,file),'utf8');
  const robots=attr(html,'meta','name','robots','content');
  if (!robots || !/\bindex\b/i.test(robots) || /\bnoindex\b/i.test(robots)) continue;
  const canonical=attr(html,'link','rel','canonical','href');
  if (!canonical || !canonical.startsWith(base)) continue;
  urls.add(canonical.split('#')[0].split('?')[0]);
}

const ordered=[...urls].sort((a,b)=>{
  if (a===base) return -1;
  if (b===base) return 1;
  return a.localeCompare(b);
});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&apos;");
const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+ordered.map(u=>'  <url><loc>'+esc(u)+'</loc></url>').join('\n')+'\n</urlset>\n';
const target=path.join(root,'sitemap.xml');

if (process.argv.includes('--check')) {
  const current=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
  if (current!==xml) {
    console.error('sitemap.xml is out of sync. Run: node scripts/generate-sitemap.mjs');
    process.exit(1);
  }
  console.log('sitemap.xml is in sync with '+ordered.length+' indexable canonical URLs.');
} else {
  fs.writeFileSync(target,xml);
  console.log('Generated sitemap.xml with '+ordered.length+' indexable canonical URLs.');
}
