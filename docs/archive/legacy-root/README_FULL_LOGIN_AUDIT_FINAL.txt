PipSePaisa Full Login Audit — Final

Detailed checks completed
=========================
- 60 external and inline JavaScript blocks passed syntax validation.
- ZIP integrity passed.
- Main application JavaScript parses successfully.
- Landing iframe and parent login message types match.
- Parent login validates a real Supabase user/session before entering the app.
- Supabase auth callbacks contain no awaited database queries.
- Embedded landing page uses a separate, non-persistent auth client.
- Main application keeps persistSession and autoRefreshToken enabled.
- Login has a visible 12-second timeout instead of hanging forever.
- Mobile UI and Broker Reviews layout remain locked and unchanged.
- Local asset references were checked; apparent missing references were only
  dynamic JavaScript template values.

Additional race-condition cleanup
=================================
One duplicate loadUserProfile() request was still starting during page startup,
while init() was already restoring the same session. It has been removed.

The iframe login bridge and auth-state listener could also start two identical
profile database loads after one login. They are now deduplicated.

Result
======
The code-level login flow is clean and internally consistent. A final real
credential test still has to be performed after deployment because the build
environment cannot access the live Supabase network.

Deployment
==========
Upload and replace the complete ZIP contents.
Clear hosting/CDN cache and hard refresh.
No SQL query is required.
