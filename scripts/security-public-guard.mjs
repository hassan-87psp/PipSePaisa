// Read-only security guard for source files delivered to browsers.
// Intentionally does not print matching values. Never scans user data or calls auth/payment APIs.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const skippedDirs=new Set(['.git','.github','node_modules','supabase','scripts','.next','dist']);
const suspects=[];
let checked=0;

function visit(rel='') {
  const dir=path.join(root,rel);
  for(const item of fs.readdirSync(dir,{withFileTypes:true})){
    const next=path.posix.join(rel,item.name);
    if(item.isDirectory()){
      if(!skippedDirs.has(item.name))visit(next);
    }else if(item.isFile()){
      if(!/\.(?:html|js|css|json)$/i.test(item.name))continue;
      if(/(?: - Copy|\(\d+\))\./i.test(item.name))continue;
      if(fs.statSync(path.join(root,next)).size>5_000_000)continue;
      checked++;
      const s=fs.readFileSync(path.join(root,next),'utf8');
      const tests=[
        ['Supabase secret key',/\bsb_secret_[A-Za-z0-9_-]{12,}/g],
        ['Private key material',/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g],
        ['GitHub personal token',/\b(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{28,}\b/g],
        ['GitHub fine-grained token',/\bgithub_pat_[A-Za-z0-9_]{30,}/g],
        ['Stripe live secret',/\bsk_live_[A-Za-z0-9]{16,}/g],
        ['Hardcoded Supabase service_role JWT',/\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\s*[:=]\s*['"]eyJ[A-Za-z0-9_-]{80,}\./gi]
      ];
      for(const [type,re] of tests) if(re.test(s))suspects.push({file:next,type});
    }
  }
}

visit();
console.log('Production browser assets examined: '+checked);
if(suspects.length){
  for(const {file,type} of suspects)console.error('SECURITY_FAIL '+file+' : '+type+' pattern (value intentionally hidden)');
  process.exitCode=1;
}else console.log('SECURITY_PASS No recognized high-risk server/private key patterns in browser assets.');

const checks=[
  ['Homepage','index.html'],
  ['Courses','courses/index.html'],
  ['VSA mentorship','courses/vsa-volume-spread-analysis/index.html'],
  ['Login','sign-in/index.html'],
  ['Signup','sign-up/index.html']
];
for(const [label,p] of checks){
  if(!fs.existsSync(path.join(root,p))){console.error('SECURITY_FAIL missing critical page: '+p);process.exitCode=1;continue}
  const html=fs.readFileSync(path.join(root,p),'utf8');
  if(/\b(?:sb_secret_|sk_live_|github_pat_)\b/.test(html)){
    console.error('SECURITY_FAIL sensitive key prefix on '+label);process.exitCode=1;
  }else console.log('SECURITY_PASS '+label+' frontend source checked');
}
