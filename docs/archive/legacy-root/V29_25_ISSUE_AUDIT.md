# PipSePaisa V29 — 25 Issue Repair Audit

Build date: 2026-08-02

This audit verifies the actual V29 source files. Live Supabase, SMTP, Zoom and hosting behavior still requires deployment testing.

1. **Email verification delay** — verification success and sign-in button unlock immediately; welcome email runs in background.
2. **Use a different email** — button restores the signup form with the entered email selected.
3. **Autofill closes login modal** — safe pointer-down/pointer-up backdrop handling retained.
4. **Enrollment/Zoom page blinking** — enrollment changes now refresh only access/modules; Zoom updates refresh only the class panel.
5. **Course/Zoom sequence** — one canonical 1–9 order is used.
6. **Missing admin WhatsApp** — profile → enrollment fallback added; permanent Auth/enrollment sync is in SQL 65.
7. **Admin course editor** — real user-page class structure is used for the live preview; 9 module titles/descriptions are editable.
8. **Course-card thumbnails** — Basic and Advanced 1280×720 thumbnails are connected.
9. **Both sidebar thumbnails** — relevant Basic/Advanced image uses `object-fit: contain` with no crop.
10. **Fast login/page switching** — provisional profile render, deferred non-critical loads and stable page switching added.
11. **Correct deep links** — Basic/Advanced email buttons route to the exact course after login.
12. **Clean URL** — early browser cleanup plus Apache redirect removes `/index.html`.
13. **Forgot password Back to Login** — returns to home background and opens login automatically.
14. **Sidebar flash** — all login paths create a provisional profile before app render; desktop sidebar dimensions are stable.
15. **Signal once only** — signal IDs are stored as seen and not repeated on refresh/page switch.
16. **Zoom retry button** — compact button, generation state and targeted background refresh added.
17. **Admin logo** — login, boot and sidebar use the real local logo asset.
18. **Heavy page optimization** — `index.html` reduced from about 705 KB to about 319 KB by extracting cacheable core scripts.
19. **Forced cache removal** — no forced cache deletion or service-worker unregister logic is active.
20. **Background polling** — 15/20-second permanent fallbacks removed/reduced; realtime remains primary.
21. **Protected-content flash** — boot/access guard stays active until access state resolves.
22. **Branded dialogs** — final alert/confirm/prompt handlers use PipSePaisa dialogs.
23. **Admin buttons/campaigns** — real SMTP email campaign Edge Function and history table added.
24. **PWA branding** — PipSePaisa name, icons and clean start URL are present.
25. **Supabase preconnect** — current project URL is used.

## Automated validation

- 25 issue markers: passed
- External JavaScript syntax: passed
- Inline JavaScript syntax: passed
- Missing local HTML/CSS assets: 0
- Basic thumbnail: 1280×720
- Advanced thumbnail: 1280×720
- Mobile layout: no existing approved user mobile layout selectors were replaced; V29 stability layout rules are desktop-only.
