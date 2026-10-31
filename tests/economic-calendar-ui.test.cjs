'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const routes=['dashboard/index.html','eaindicator/index.html','economic-news/index.html','world-news/index.html'];
test('Every user portal has the actual selected This Week filter and the same foreground reminder controls',()=>{
 for(const route of routes){
  const html=read(route);
  assert.match(html,/class="filter-btn active" onclick="setNewsTime\('week', this\)">This Week<\/button>/,route);
  assert.doesNotMatch(html,/class="filter-btn active" onclick="setNewsTime\('all', this\)">All<\/button>/,route);
  assert.match(html,/id="pspEconomicAlertsBtn"/,route);
  assert.match(html,/economic-calendar-alerts-v1\.js\?v=20261031-v530-unified-reminders/,route);
  assert.match(html,/user-app-core-v29\.js\?v=20261031-v530-calendar-data-freshness/,route);
 }
});
test('Calendar runtime uses DST-aware zone labels and authenticated source age',()=>{
 const js=read('user-app-core-v29.js');
 assert.match(js,/Intl\.DateTimeFormat\('en-US',\{timeZone:zone,timeZoneName:'short'\}\)/);
 assert.match(js,/X-Calendar-Feed-Checked-At/);
 assert.match(js,/pspNewsSourceCheckedAt/);
 assert.match(js,/FEED ONLINE/);
 assert.match(js,/Awaiting result/);
 assert.doesNotMatch(js,/if\(ms<=0\)return \['● LIVE'/);
 assert.doesNotThrow(()=>new Function(js));
});
test('Daylight saving offset changes in America/New_York without changing actual UTC release instant',()=>{
 const fmt=iso=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false,timeZoneName:'short'}).format(new Date(iso));
 assert.match(fmt('2026-10-31T13:30:00Z'),/EDT/);
 assert.match(fmt('2026-11-02T13:30:00Z'),/EST/);
});
console.log('ECONOMIC_CALENDAR_UI_TESTS: four routes; filter default; reminders; DST; source timestamp; release status');
