PipSePaisa Login Runtime Fix — Final

Confirmed root cause
====================
A push-subscription stylesheet tag had accidentally been inserted inside the
JavaScript string used by downloadAIReport() in index.html.

That made the main index.html JavaScript invalid. The browser stopped parsing
the complete main application script, so these functions never ran:

- Supabase saved-session restoration
- Landing iframe login bridge
- enterApp() dashboard opening
- auth state listener
- duplicate ticker cleanup

That is why valid email/password login appeared to refresh and return to the
same landing page.

Fix applied
===========
- Removed only the malformed stylesheet injection from the JavaScript string.
- Preserved the approved and locked mobile UI.
- Preserved the approved broker comparison layout.
- Preserved the parent-auth iframe login bridge.
- Preserved session persistence until explicit Logout.
- Preserved ticker cleanup.
- Added no SQL changes and no mobile-layout changes.

Validation completed
====================
- All external JavaScript files passed node --check.
- All inline JavaScript blocks across every HTML page passed node --check.
- ZIP integrity passed.

Deployment
==========
Upload and replace the complete ZIP contents.
Clear hosting/CDN cache and perform a hard refresh.
