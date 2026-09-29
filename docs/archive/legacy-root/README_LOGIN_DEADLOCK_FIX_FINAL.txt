PipSePaisa Login Deadlock Fix — Final

Confirmed runtime problem
=========================
The Supabase SIGNED_IN callback was declared async and awaited loadUserProfile().
loadUserProfile() performs database queries. Running awaited Supabase/database
work inside onAuthStateChange can block the sign-in flow and leave the button
stuck on “Logging in...”.

A second issue was that landing.html and index.html used two Supabase clients
with the same auth storage key while landing.html was inside an iframe. This
could create auth-lock contention on mobile and in-app browsers.

Fixes
=====
- The embedded landing iframe now uses a separate non-persistent public client.
- onAuthStateChange returns immediately and schedules profile loading afterward.
- The dashboard opens as soon as signInWithPassword returns a valid session.
- Profile/database loading continues in the background.
- Existing saved sessions also open the dashboard before profile hydration.
- Both iframe and main-panel login have a 12-second visible timeout.
- Session persistence remains enabled in the main application until Logout.
- Locked mobile UI and broker comparison were not changed.
- No SQL change is required.

Validation
==========
All external and inline JavaScript blocks passed syntax validation.
ZIP integrity passed.
