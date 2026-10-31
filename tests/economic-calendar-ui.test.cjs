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
  assert.match(html,/class="filter-btn active" onclick="setNewsTime\('today', this\)">Today<\/button>/,route);
  assert.doesNotMatch(html,/class="filter-btn active" onclick="setNewsTime\('week', this\)">This Week<\/button>/,route);
  assert.match(html,/id="pspEconomicAlertsBtn"/,route);
 assert.ok(html.includes("setNewsTime('nextweek', this)"),route);
 assert.ok(html.includes("setNewsTime('upcoming', this)"),route);
  assert.match(html,/economic-calendar-alerts-v1\.js\?v=20261031-v533-timezone-reminders/,route);
  assert.match(html,/user-app-core-v29\.js\?v=20261031-v536-today-refresh/,route);
 }
});
test('Calendar runtime uses DST-aware zone labels and authenticated source age',()=>{
 const js=read('user-app-core-v29.js');
 assert.match(js,/Intl\.DateTimeFormat\('en-US',\{timeZone:zone,timeZoneName:'short'\}\)/);
 assert.match(js,/X-Calendar-Feed-Checked-At/);
 assert.match(js,/pspNewsSourceCheckedAt/);
 assert.match(js,/FEED VERIFIED/);
 assert.match(js,/Feed delayed/);
 assert.match(js,/Awaiting result/);
 assert.doesNotMatch(js,/if\(ms<=0\)return \['● LIVE'/);
 assert.doesNotThrow(()=>new Function(js));
});
test('Daylight saving offset changes in America/New_York without changing actual UTC release instant',()=>{
 const fmt=iso=>new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false,timeZoneName:'short'}).format(new Date(iso));
 assert.match(fmt('2026-10-31T13:30:00Z'),/EDT/);
 assert.match(fmt('2026-11-02T13:30:00Z'),/EST/);
});
test('Low, Medium and High filters include all equal-or-higher impact tiers',()=>{
 const js=read('user-app-core-v29.js');
 assert.match(js,/if \(!pspCalendarMatchesImpact\(n\.impact, newsState\.impact\)\) return false;/);
 const start=js.indexOf('  function pspCalendarMatchesImpact(');
 assert.ok(start>0,'Cumulative impact filter helper must exist');
 const end=js.indexOf('\n  }\n',start);
 assert.ok(end>start,'Cumulative impact filter helper must terminate');
 const matches=new Function(js.slice(start,end+4)+'\nreturn pspCalendarMatchesImpact;')();
 const events=['Low','Medium','High','Holiday'];
 const expected={Low:[true,true,true,false],Medium:[false,true,true,false],High:[false,false,true,false],all:[true,true,true,true]};
 for(const [selected,results] of Object.entries(expected)){
  assert.deepEqual(events.map(impact=>matches(impact,selected)),results,selected);
 }
});
test('Selected timezone controls Today, Tomorrow, weekly rollover and DST',()=>{
 const js=read('user-app-core-v29.js');
 const from=js.indexOf('  function pspCalendarDayKey(');
 const to=js.indexOf('  window.pspEconomicCalendarTimezone=',from);
 assert.ok(from>0&&to>from,'calendar date helpers are installed');
 const functions=new Function(js.slice(from,to)+
   '\nreturn {dayKey:pspCalendarDayKey,addDay:pspCalendarAddDay};')();
 const utc=new Date('2026-10-31T20:30:00.000Z');
 assert.equal(functions.dayKey(utc,'Asia/Karachi'),'2026-11-01');
 assert.equal(functions.dayKey(utc,'America/New_York'),'2026-10-31');
 assert.equal(functions.addDay('2026-10-31',1),'2026-11-01');
 assert.equal(functions.addDay('2026-12-31',1),'2027-01-01');
 const saturday='2026-10-31';
 const weekday=new Date(saturday+'T12:00:00Z').getUTCDay();
 const monday=functions.addDay(saturday,-(weekday===0?6:weekday-1));
 assert.equal(monday,'2026-10-26');
 assert.equal(functions.addDay(monday,6),'2026-11-01');
 assert.equal(functions.addDay(monday,7),'2026-11-02');
 assert.equal(functions.addDay(monday,13),'2026-11-08');
 assert.match(js,/newsState\.time === 'nextweek'/);
 assert.match(js,/newsState\.time === 'upcoming'/);
 assert.match(js,/pspCalendarRenderedDateKey/);
 assert.match(js,/No Economic Events Today/);
 assert.match(js,/No more matching releases scheduled this week/);
});
test('Foreground high-impact reminders display user-selected timezone, never hardcoded PKT',()=>{
 const js=read('economic-calendar-alerts-v1.js');
 assert.match(js,/window\.pspEconomicCalendarTimezone/);
 assert.match(js,/timeZone:tz/);
 assert.doesNotMatch(js,/toLocaleTimeString\('en-US',\{timeZone:'Asia\/Karachi'/);
});
test('Released statements are not mislabeled as missing numerical Actual',()=>{
 const js=read('user-app-core-v29.js');
 const start=js.indexOf('  function pspCalendarHasNumericActual(');
 const end=js.indexOf('\n  }\n',start);
 assert.ok(start>0&&end>start);
 const needsActual=new Function(js.slice(start,end+4)+'\nreturn pspCalendarHasNumericActual;')();
 for(const label of ['RBNZ Press Conference','FOMC Statement','BOC Monetary Policy Report'])
  assert.equal(needsActual(label),false,label);
 for(const label of ['CPI m/m','Federal Funds Rate','Unemployment Claims'])
  assert.equal(needsActual(label),true,label);
 assert.match(js,/pspCalendarHasNumericActual\(n\.title\) \? 'Not reported'/);
});
test('Today is initial date filter and reopening Economic News triggers a fresh-source check',()=>{
 const js=read('user-app-core-v29.js');
 assert.match(js,/time: 'today',\s*\/\/ today/);
 assert.match(js,/page === 'news'/);
 assert.match(js,/pspNewsLastAttemptAtV536/);
 assert.match(js,/Date\.now\(\)-pspNewsLastAttemptAtV536>120000/);
});
console.log('ECONOMIC_CALENDAR_UI_TESTS: four routes; cumulative impact tiers; filter default; reminders; DST; source timestamp; release status');
