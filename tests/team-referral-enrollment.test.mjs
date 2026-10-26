import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

const flowSource = fs.readFileSync('course-auth-path-v207.js', 'utf8');
const context = {
  window: {},
  location: { pathname: '/courses/', search: '' },
  localStorage: storage(),
  sessionStorage: storage(),
  URLSearchParams
};
vm.runInNewContext(flowSource, context, { timeout: 1000 });
const flow = context.window.PSPCourseAuthFlow;
assert.ok(flow, 'Course auth flow must be available');

const freeAliases = new Map([
  ['basic', 'basic-b4'],
  ['basic-b2', 'basic-b4'],
  ['basic-b3', 'basic-b4'],
  ['basic-b4', 'basic-b4'],
  ['fundamental', 'fundamental-b3'],
  ['fundamental-b2', 'fundamental-b3'],
  ['fundamental-b3', 'fundamental-b3']
]);
for (const [incoming, expected] of freeAliases) {
  assert.equal(flow.cleanKey(incoming), expected, incoming + ' should resolve to ' + expected);
}

context.window.PSPTrack = {
  getAttribution() { return { slug: 'samiyafx' }; },
  restoreAttribution() {}
};
context.location.search = '?psp_course=basic-b4&psp_auth=signup&ref=samiyafx';
const courseResume = new URL(flow.afterAuth(), 'https://pipsepaisa.com');
assert.equal(courseResume.pathname, '/my-courses/');
assert.equal(courseResume.searchParams.get('psp_enroll'), 'basic-b4');
assert.equal(courseResume.searchParams.get('psp_course_from_auth'), '1');
assert.equal(new URL(flow.authUrl('basic-b2', 'signup'), 'https://pipsepaisa.com')
  .searchParams.get('ref'), 'samiyafx', 'Manager referral must survive auth redirect');

const courses = fs.readFileSync('courses/index.html', 'utf8');
const match = courses.match(/<script id="pspV207TrackedCourseAutoOpen">([\s\S]*?)<\/script>/i);
assert.ok(match, 'Tracked link course auto-open script must exist');
const allTrackedTargets = [
  'basic', 'basic-b2', 'basic-b3', 'basic-b4',
  'fundamental', 'fundamental-b2', 'fundamental-b3',
  'advanced', 'advance-fundamental', 'vsa'
];
for (const target of allTrackedTargets) {
  const observed = [];
  vm.runInNewContext(match[1], {
    location: { search: '?psp_enroll=' + encodeURIComponent(target) },
    window: { pspPublicCourseCTA(key) { observed.push(key); } },
    document: { readyState: 'complete' },
    URLSearchParams,
    setTimeout(fn) { fn(); }
  }, { timeout: 1000 });
  assert.deepEqual(observed, [target], target + ' referral link must auto-open');
}
const noTargetActions = [];
vm.runInNewContext(match[1], {
  location: { search: '' },
  window: { pspPublicCourseCTA(key) { noTargetActions.push(key); } },
  document: { readyState: 'complete' },
  URLSearchParams,
  setTimeout(fn) { fn(); }
}, { timeout: 1000 });
assert.deepEqual(noTargetActions, [], 'Normal course visits must never auto-enroll');

for (const path of ['sign-in/index.html', 'sign-up/index.html']) {
  const html = fs.readFileSync(path, 'utf8');
  assert.match(html, /await pspEnsureFreeSignupBatch\(data\.user,requestedCourse,fullName,phone\)/,
    path + ' should enroll the chosen free batch after signup');
  assert.match(html, /PSPTrack\?\.useAuthenticatedClient\?\.\(landingSb\)/,
    path + ' should record attribution as the authenticated user');
  assert.match(html, /enrollmentId:enrolled\.id/,
    path + ' should resolve assigned Team WhatsApp using the saved enrollment');
}
const freePage = fs.readFileSync('free-course/index.html', 'utf8');
assert.match(freePage, /course-auth-path-v207\.js/,
  'Free course entry should preserve auth and referral intent');
const tracker = fs.readFileSync('psp-link-tracking-v42.js', 'utf8');
assert.match(tracker, /useAuthenticatedClient/,
  'Tracker must accept the signed-in Supabase client');
console.log('Team referral enrollment regression checks passed');
