PipSePaisa V302 - PSP TEAM Install Button Visible Fix

Fixes:
- Removed stale localStorage "installed" state from PWA detection.
- Install buttons remain visible whenever the Team Panel is running in normal browser mode.
- Buttons hide only when PSP TEAM is actually running as an installed standalone PWA.
- Native beforeinstallprompt is used when available.
- Samsung Internet fallback: Menu -> Add page to -> Home screen.
- Chrome/Android fallback: Menu -> Install app / Add to Home screen.
- iPhone fallback: Share -> Add to Home Screen.
- PWA manifest/service-worker cache bumped to V302.

No SQL required.
Desktop Team Panel and business logic unchanged.
