PipSePaisa Direct Login — Verified Final

Detailed verification completed:
- Same-origin landing iframe directly calls window.parent.pspLoginFromLanding().
- Main index.html performs Supabase signInWithPassword.
- Parent confirms a real user and session before opening the dashboard.
- Dashboard opens before profile/database hydration.
- Session persistence remains enabled until explicit Logout.
- Parent readiness wait increased to 10 seconds.
- Supabase login now has a 15-second visible timeout instead of hanging forever.
- All 60 external and inline JavaScript blocks passed syntax validation.
- ZIP integrity passed.
- Locked mobile UI and Broker Reviews section were not changed.

Important:
A real live login still depends on the deployed Supabase service, network,
allowed site origin, and current hosting cache. Static validation cannot
authenticate against the live user's account from this offline build environment.
