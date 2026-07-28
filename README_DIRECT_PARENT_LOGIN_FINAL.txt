PipSePaisa Direct Parent Login Fix — Final

Confirmed issue
===============
The iframe login was waiting for a postMessage response from index.html.
On the user's live browser that response never returned, so the button stayed
on “Logging in...” until the timeout.

Fix
===
- Removed postMessage from the actual login path.
- landing.html now directly calls window.parent.pspLoginFromLanding().
- The parent performs Supabase signInWithPassword.
- Dashboard opens immediately after Supabase returns a valid session.
- Profile data loads in the background.
- A short readiness wait is included if the parent script is still loading.
- Standalone landing.html retains its own login fallback.
- Locked mobile UI and Broker Reviews were not changed.
- No SQL query is required.

Validation
==========
All inline and external JavaScript blocks passed syntax validation.
ZIP integrity passed.
