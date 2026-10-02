const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'admin-core-v406.js'), 'utf8');
const chats = core.slice(core.indexOf('// ============ MEMBER CHATS'), core.indexOf('// ============ NOTIFICATIONS'));
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function harness() {
  const elements = new Map(), requests = [], channels = [], removed = [], alerts = [], timers = new Map();
  let timerId = 0;
  function element(id) {
    if (!elements.has(id)) elements.set(id, { id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, children: [], files: [], disabled: false, scrollHeight: 300, scrollTop: 100, clientHeight: 200, classList: { contains: () => true } });
    return elements.get(id);
  }
  const c = {
    console, Set, Promise, Date, Event, currentAdmin: { id: 'admin' }, APMS: '', aEsc: s => String(s ?? ''), alert: s => alerts.push(s),
    document: { hidden: false, getElementById: element },
    setTimeout: fn => { timers.set(++timerId, fn); return timerId; }, clearTimeout: id => timers.delete(id), setInterval: () => 1,
    dispatchEvent() {}, addEventListener() {},
    sb: {
      from(table) {
        const r = { table, kind: 'select', filters: [], orders: [] };
        const b = {};
        for (const name of ['select','or','eq','in','is','order','limit','maybeSingle','insert','update','delete']) b[name] = (...args) => {
          if (['insert','update','delete'].includes(name)) { r.kind = name; r.payload = args[0]; }
          if (name === 'order') r.orders.push(args);
          if (name === 'eq') r.filters.push(args);
          return b;
        };
        b.then = (ok, fail) => { const d = deferred(); requests.push({ ...r, ...d }); return d.promise.then(ok, fail); };
        return b;
      },
      rpc(name, args) { const d = deferred(); requests.push({ name, args, ...d }); return d.promise; },
      channel(name) { const ch = { name, on() { return ch; }, subscribe() { channels.push(ch); return ch; } }; return ch; },
      removeChannel(ch) { removed.push(ch); return Promise.resolve('ok'); }
    }
  };
  c.window = c; vm.createContext(c); vm.runInContext(chats, c);
  return { c, element, elements, requests, channels, removed, alerts, timers };
}

test('late Live Desk conversation cannot overwrite the selected visitor', async () => {
  const h = harness(), c = h.c; c._aChatTab = 'live';
  const first = c.aLiveOpen('A'), second = c.aLiveOpen('B');
  h.requests[1].resolve({ data: [{ body: 'B message', sender_type: 'visitor' }] }); await second;
  h.requests[0].resolve({ data: [{ body: 'A message', sender_type: 'visitor' }] }); await first;
  assert.match(h.element('aLiveBody').innerHTML, /B message/);
  assert.doesNotMatch(h.element('aLiveBody').innerHTML, /A message/);
});

test('new Live Desk search survives an older in-flight inbox response', async () => {
  const h = harness(), c = h.c; c._aChatTab = 'live';
  h.element('aLiveSearch').value = 'old'; const old = c.aLiveLoad(true);
  h.element('aLiveSearch').value = 'new'; const fresh = c.aLiveLoad(true);
  h.requests[1].resolve({ data: [{ id: 'new', visitor_name: 'New visitor' }] }); await fresh;
  h.requests[0].resolve({ data: [{ id: 'old', visitor_name: 'Old visitor' }] }); await old;
  assert.match(h.element('aLiveList').innerHTML, /New visitor/);
  assert.doesNotMatch(h.element('aLiveList').innerHTML, /Old visitor/);
  assert.equal(c._aLiveLoading, false);
});

test('Community group switching rejects a late feed and reentry reloads groups', async () => {
  const h = harness(), c = h.c; c._aChatTab = 'comm'; c._acGid = 'A';
  const old = c.aCommFeed(); await tick(); c._acGid = 'B'; const fresh = c.aCommFeed(); await tick();
  h.requests[1].resolve({ data: [] }); await fresh; h.element('aCommFeed').innerHTML = 'B result';
  h.requests[0].resolve({ data: [] }); await old;
  assert.equal(h.element('aCommFeed').innerHTML, 'B result');
  c._acLoaded = true; c.aCommSwitch('chats'); c.aCommSwitch('comm'); await tick();
  assert.ok(h.requests.some(r => r.table === 'groups'));
});

test('leaving while marking a DM read cannot recreate an abandoned typing channel', async () => {
  const h = harness(), c = h.c;
  const open = c.aOpenDM('A', { id: 'A', full_name: 'Alice' }); await tick();
  h.requests[0].resolve({ data: [{ id: 'm', recipient_id: 'admin', sender_id: 'A', body: 'Hello' }] }); await tick();
  assert.equal(h.requests[1].kind, 'update');
  c.pspAdminChatRealtimeCleanup(); h.requests[1].resolve({ data: [] }); await open;
  assert.equal(h.channels.length, 0);
});

test('DM failures preserve draft, show no sent bubble, and repeated Send inserts once', async () => {
  const h = harness(), c = h.c; c._aDmPeer = { id: 'A' }; h.element('aDmInput').value = 'Keep this draft';
  const send = c.aSendDM(), double = c.aSendDM(); await tick();
  assert.equal(h.requests.length, 1); assert.equal(h.requests[0].payload.recipient_id, 'A');
  h.requests[0].resolve({ error: { message: 'Connection failed' } }); await Promise.all([send, double]);
  assert.equal(h.element('aDmInput').value, 'Keep this draft');
  assert.equal(h.element('aDmInput').disabled, false);
  assert.equal(h.element('aDmBody').innerHTML, ''); assert.equal(h.alerts.length, 1);
});

test('realtime refresh does not interrupt a newly selected member profile', async () => {
  const h = harness(), c = h.c;
  const open = c.aOpenDM('A'); await tick();
  const refresh = c.pspAdminRefreshDM(); await tick();
  assert.equal(h.requests.filter(r => r.table === 'profiles').length, 1);
  h.requests.find(r => r.table === 'profiles').resolve({ data: { id: 'A', full_name: 'Alice' } }); await tick();
  const dmQueries = h.requests.filter(r => r.table === 'dm_messages');
  for (const r of dmQueries) r.resolve({ data: [] }); await Promise.all([open, refresh]); await tick();
  assert.match(h.element('aDmHead').innerHTML, /Alice/);
  assert.equal(h.channels.length, 1);
});

test('support selecting cached tickets performs no extra inbox request and failures keep draft', async () => {
  const h = harness(), c = h.c;
  c._tickets = { A: { key: 'A', user_id: 'A', msgs: [], name: 'Alice' }, B: { key: 'B', user_id: 'B', msgs: [], name: 'Bob' } };
  c.selectTicket('A'); h.element('msgReplyText').value = 'Draft A'; c.selectTicket('B');
  assert.equal(h.element('msgReplyText').value, ''); c.selectTicket('A');
  assert.equal(h.element('msgReplyText').value, 'Draft A'); assert.equal(h.requests.length, 0);
  const first = c.sendSupportReply(), second = c.sendSupportReply(); await tick();
  assert.equal(h.requests.length, 1); h.requests[0].resolve({ error: { message: 'Offline' } }); await Promise.all([first, second]);
  assert.equal(h.element('msgReplyText').value, 'Draft A'); assert.equal(h.element('msgSendBtn').disabled, false);
  assert.doesNotMatch(h.element('msgThreadBody').innerHTML, /Draft A/);
});

test('support realtime detects edits away from the last row, and fetches newest records first', async () => {
  const h = harness(), c = h.c;
  const rows = [{ id: 'new', user_id: 'A', body: 'Latest', created_at: '2026-10-02', sender: 'user' }, { id: 'old', user_id: 'A', body: 'Original', created_at: '2026-10-01', sender: 'user' }];
  const initial = c.loadAdminMessages(); await tick(); h.requests[0].resolve({ data: rows }); await initial;
  assert.equal(h.requests[0].orders[0][1].ascending, false);
  const reload = c.loadAdminMessages(true); await tick(); h.requests[1].resolve({ data: [rows[0], { ...rows[1], body: 'Edited' }] }); await reload;
  assert.equal(c._tickets['A|ACTIVE'].msgs[0].body, 'Edited');
});

test('silent DM refresh preserves search text and the readers scroll position', async () => {
  const h = harness(), c = h.c; c._aDmPeer = { id: 'A', full_name: 'Alice' };
  h.element('aDmNew').value = 'Bob'; h.element('aDmBody').scrollHeight = 1000; h.element('aDmBody').scrollTop = 30;
  const refresh = c.aOpenDM('A', c._aDmPeer, true); await tick();
  h.requests[0].resolve({ data: [{ sender_id: 'admin', recipient_id: 'A', body: 'Latest message' }] }); await refresh;
  assert.equal(h.element('aDmNew').value, 'Bob'); assert.equal(h.element('aDmBody').scrollTop, 30);
});

test('closing a ticket after switching preserves the newly selected conversation', async () => {
  const h = harness(), c = h.c, confirm = deferred(); c.pspConfirm = () => confirm.promise;
  c._tickets = { A: { key: 'A', user_id: 'A', msgs: [], name: 'Alice' }, B: { key: 'B', user_id: 'B', msgs: [], name: 'Bob' } };
  c.selectTicket('A'); const close = c.closeAdminTicket(); c.selectTicket('B'); h.element('msgReplyText').value = 'Draft B';
  confirm.resolve(true); await tick(); assert.equal(h.requests[0].args.p_user, 'A');
  h.requests[0].resolve({ data: true }); await close;
  assert.equal(c._selTicket, 'B'); assert.equal(h.element('msgReplyText').value, 'Draft B');
});

test('central realtime owns only the active chat subtab and does not refresh logged-out pages', async () => {
  const listeners = {}, docListeners = {}, channels = [], removed = [], timers = new Map(); let timerId = 0, refreshes = 0;
  const c = { console, Event, currentAdmin: { id: 'admin' }, _aChatTab: 'chats',
    document: { hidden: false, readyState: 'complete', getElementById(id) { return { id, classList: { contains: () => id !== 'loginOverlay' } }; }, querySelector() { return { id: 'page-chats' }; }, addEventListener(name, fn) { docListeners[name] = fn; } },
    addEventListener(name, fn) { listeners[name] = fn; }, setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); },
    showPage() {}, pspAdminRefreshDM() { refreshes++; }, aLiveLoad() { refreshes++; }, pspAdminChatRealtimeCleanup() {},
    sb: { channel(name) { const ch = { name, tables: [], on(event, filter) { ch.tables.push(filter.table); return ch; }, subscribe() { channels.push(ch); return ch; } }; return ch; }, removeChannel(ch) { removed.push(ch); return Promise.resolve('ok'); } }
  };
  c.window = c; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'realtime-complete.js'), 'utf8'), c);
  for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
  assert.deepEqual(Array.from(channels[0].tables), ['dm_messages']);
  c._aChatTab = 'comm'; listeners['psp-admin-chat-tab']();
  assert.deepEqual(Array.from(channels[1].tables), ['groups','group_posts','post_likes','post_comments']); assert.equal(removed[0], channels[0]);
  c._aChatTab = 'live'; listeners['psp-admin-chat-tab'](); assert.equal(removed[1], channels[1]); assert.equal(channels.length, 2);
  c.currentAdmin = null; docListeners.visibilitychange(); assert.equal(refreshes, 0);
});

test('cache invalidation prevents older responses from repopulating or joining the fresh request', async () => {
  const pending = [], events = {};
  const c = { Headers, Request, Response, URL, Map, Set, Date, location: { href: 'https://pipsepaisa.com/admin/' }, document: { addEventListener() {} }, addEventListener(name, fn) { events[name] = fn; }, fetch() { const d = deferred(); pending.push(d); return d.promise; } };
  c.window = c; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'admin-performance-v398.js'), 'utf8'), c);
  const url = 'https://etfolhinohgmskbfjoyh.supabase.co/rest/v1/profiles?id=eq.A';
  const old = c.fetch(url); await tick(); c.pspAdminPerfClear(); const fresh = c.fetch(url); await tick();
  assert.equal(pending.length, 2);
  pending[0].resolve(new Response('old')); assert.equal(await (await old).text(), 'old');
  const sameFresh = c.fetch(url); await tick(); assert.equal(pending.length, 2);
  pending[1].resolve(new Response('fresh')); assert.equal(await (await fresh).text(), 'fresh'); assert.equal(await (await sameFresh).text(), 'fresh');
  assert.equal(await (await c.fetch(url)).text(), 'fresh'); assert.equal(pending.length, 2);
});
