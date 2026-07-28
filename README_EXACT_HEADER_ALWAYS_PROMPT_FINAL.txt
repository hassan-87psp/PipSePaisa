PipSePaisa Exact Header + Always Prompt Final

Header:
- Restored landing.html from the previously approved exact mobile UI build.
- Removed all later custom header width/font/button sizing overrides.
- Added only a minimal visibility rule so navigation links remain present.
- Direct-parent login function from the verified login build was preserved.

Notification:
- Subscribe box now appears before waiting for the OneSignal SDK.
- SDK/subscription checking runs in the background.
- The box is removed only when OneSignal confirms a real active subscription.
- OneSignal is initialized only by push-subscribe-prompt.js.
- PWA install banner waits behind the notification prompt.

No changes were made to hero, broker cards, services, mentor section or footer.
