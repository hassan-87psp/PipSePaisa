// PipSePaisa | Supabase public-schema migration access guard.
// Static lint only: NEVER connects to the database or executes SQL.
// Compares each changed SQL file with Git base to check only NEW tables;
// unchanged historical migrations are not retroactively blocked.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IDENT = '(?:"(?:[^"]|"")*"|[a-z_][\\w$]*)';
const QUAL = '(' + IDENT + ')(?:\\s*\\.\\s*(' + IDENT + '))?';
const tableRE = new RegExp('\\bcreate\\s+(?:unlogged\\s+)?table\\s+(?:if\\s+not\\s+exists\\s+)?' + QUAL + '(?=\\s|[(;]|$)', 'gi');
const normal = s => String(s || '').trim().replace(/^"|"$/g, '').replace(/""/g, '"').toLowerCase();
const clean = input => String(input)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/--[^\r\n]*/g, ' ')
  .replace(/'(?:''|[^'])*'/g, "''");
const isPublic = (a, b) => !b || normal(a) === 'public';
const tableName = (a, b) => normal(b || a);
const tableMatches = (sql, re, name) => [...sql.matchAll(re)].some(m => {
  const a = m[1], b = m[2];
  return isPublic(a, b) && tableName(a, b) === name;
});

export function createdPublicTables(source) {
  return [...new Set([...clean(source).matchAll(tableRE)]
    .filter(m => isPublic(m[1], m[2]))
    .map(m => tableName(m[1], m[2])))];
}

export function checkMigration(source, previous = '') {
  const sql = clean(source);
  const before = new Set(createdPublicTables(previous));
  const newTables = createdPublicTables(source).filter(t => !before.has(t));
  const errors = [];
  const examined = [];

  if (!newTables.length) return { newTables, errors, examined };
  if (/\bgrant\s+all(?:\s+privileges)?\s+on\s+all\s+tables\s+in\s+schema\s+public\b/i.test(sql)) {
    errors.push('Broad GRANT ALL ON ALL TABLES IN SCHEMA public is not allowed.');
  }

  for (const name of newTables) {
    const rlsRE = new RegExp('\\balter\\s+table\\s+(?:if\\s+exists\\s+)?' + QUAL + '\\s+enable\\s+row\\s+level\\s+security\\b', 'gi');
    const rls = tableMatches(sql, rlsRE, name);
    if (!rls) errors.push(name + ': missing ALTER TABLE ... ENABLE ROW LEVEL SECURITY');

    const grantRE = new RegExp('\\bgrant\\s+([^;]+?)\\s+on\\s+(?:table\\s+)?' + QUAL + '\\s+to\\s+([^;]+?)\\s*(?=;|$)', 'gi');
    const grants = [...sql.matchAll(grantRE)].filter(m => isPublic(m[2], m[3]) && tableName(m[2], m[3]) === name)
      .map(m => ({ permissions: m[1].trim().toLowerCase(), roles: m[4].trim().toLowerCase().split(/\s*,\s*/).map(normal) }));

    if (!grants.length) errors.push(name + ': no explicit GRANT on the new table; add only required roles/operations');
    for (const grant of grants) {
      if (/\ball(?:\s+privileges)?\b/.test(grant.permissions) && grant.roles.some(r => ['anon','authenticated','public'].includes(r))) {
        errors.push(name + ': broad GRANT ALL to a browser/public role; choose minimum permissions');
      }
    }
    const browserGrant = grants.some(x => x.roles.some(role => ['anon','authenticated','public'].includes(role)));
    if (browserGrant) {
      const policyRE = new RegExp('\\bcreate\\s+policy\\s+' + IDENT + '\\s+on\\s+(?:table\\s+)?' + QUAL + '(?=\\s|;|$)', 'gi');
      if (!tableMatches(sql, policyRE, name)) {
        errors.push(name + ': browser role granted access but no CREATE POLICY on this table in the migration');
      }
    }
    examined.push({ table: name, rls, grants, browserPolicyRequired: browserGrant });
  }
  return { newTables, errors, examined };
}

function git(...args) { return execFileSync('git', args, { encoding:'utf8', maxBuffer: 15 * 1024 * 1024 }); }
function eligible(f) {
  return /^(?:supabase\/sql\/|supabase\/migrations\/).+\.sql$/i.test(f)
    && !f.includes('../') && !path.isAbsolute(f);
}
function fromGit(ref, file) {
  try { return git('show', ref + ':' + file); }
  catch { return ''; }
}
function test() {
  const privateOk = 'create table public.private_notes(id uuid); alter table public.private_notes enable row level security; grant select, insert on public.private_notes to service_role;';
  const publicOk = 'create table if not exists public.new_guides(id uuid); alter table public.new_guides enable row level security; create policy public_read_guides on public.new_guides for select to anon using (true); grant select on table public.new_guides to anon; grant select, insert, update, delete on public.new_guides to service_role;';
  const cases = [
    ['private service-only',privateOk,'',0],
    ['public read RLS',publicOk,'',0],
    ['missing grant', 'create table public.x(id int); alter table public.x enable row level security;', '',1],
    ['missing RLS', 'create table public.x(id int); grant select on public.x to service_role;', '',1],
    ['no public policy', 'create table public.x(id int); alter table public.x enable row level security; grant select on public.x to anon;', '',1],
    ['broad browser grant', 'create table public.x(id int); alter table public.x enable row level security; create policy xread on public.x for select to anon using (true); grant all on public.x to anon;', '',1],
    ['ignore unrelated schema', 'create table private.internal(id int);', '',0],
    ['skip unchanged legacy table', 'create table public.old(id int);', 'create table public.old(id int);',0],
    ['detect new table in edited file', 'create table public.old(id int); create table public.fresh(id int);', 'create table public.old(id int);',2],
    ['ignore commented fake sql', "-- create table public.fake(id int);\ncreate table public.real(id int); alter table public.real enable row level security; grant select on public.real to service_role;",'',0]
  ];
  for (const [name,sql,old,minErrors] of cases) {
    const a = checkMigration(sql,old);
    if (a.errors.length < minErrors || (minErrors===0 && a.errors.length!==0)) {
      throw Error('FAIL ' + name + ': ' + JSON.stringify(a.errors));
    }
    console.log('TEST PASS ' + name);
  }
  console.log('Migration access guard self-tests passed: ' + cases.length);
}
function run() {
  const args=process.argv.slice(2);
  if (args.includes('--self-test')) { test(); return; }
  const base = process.env.BASE_SHA;
  if (!/^[0-9a-f]{7,40}$/i.test(base || '') || /^0+$/.test(base)) {
    throw Error('BASE_SHA is missing or invalid; refusing to silently skip changes');
  }
  const changed=git('diff','--name-only','--diff-filter=ACMR',base,'HEAD','--','supabase/sql','supabase/migrations')
    .trim().split(/\r?\n/).filter(Boolean).filter(eligible);
  console.log('New-table migration guard: changed SQL files=' + changed.length);
  const issues=[];
  let total=0;
  for (const file of changed) {
    if (!fs.existsSync(file)) continue;
    const sql=fs.readFileSync(file,'utf8');
    const old=fromGit(base,file);
    const result=checkMigration(sql,old);
    total+=result.newTables.length;
    if (result.newTables.length) {
      console.log('CHECK '+file+' new public tables: '+result.newTables.join(', '));
      for (const item of result.examined) console.log('  '+item.table+': RLS='+item.rls+' GRANTs='+item.grants.length+' browserPolicyRequired='+item.browserPolicyRequired);
    }
    for (const msg of result.errors) issues.push(file+': '+msg);
  }
  console.log('New public tables reviewed='+total+'; errors='+issues.length);
  for (const issue of issues) console.error('MIGRATION_SECURITY_FAIL '+issue);
  if (issues.length) process.exitCode=1;
  else console.log('MIGRATION_SECURITY_PASS Required RLS and scoped GRANT review complete.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
