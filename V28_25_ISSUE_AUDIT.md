# PipSePaisa V28 — 25 Issue Audit

Build source: original stable backup se fresh rebuild. V25 aur V27 ko use na karein.

## Status ka matlab

- **Code + local test pass:** file/code aur isolated browser test mein verified.
- **Live test pending:** hosting, Supabase database, SMTP aur deployed Edge Functions par deploy ke baad final confirmation hogi.

1. **Email verification delay** — verification complete hote hi button enable hota hai; PIN welcome email background mein send hoti hai. **Code pass.**
2. **Use a different email** — Check Your Email screen par button add hai aur signup form restore karta hai. **Code pass.**
3. **Autofill se login modal close** — modal sirf real backdrop pointer-down + pointer-up par close hota hai. Autofill simulation mein close count 0. **Local UI pass.**
4. **Enrollment/Zoom blink** — optimistic enrollment duplicate event removed; Zoom update sirf class card replace karta hai, full page reload nahi. **Code pass; live Zoom test pending.**
5. **Course/Zoom sequence** — Basic aur class list dono canonical 1–9 order use karte hain. **Local UI pass.**
6. **Admin WhatsApp missing** — profile + auth metadata fallback aur one-time SQL backfill included. **Code pass; SQL run pending.**
7. **Admin course editor user-like** — live hero, access sidebar, outcomes aur 9-module roadmap preview; existing editable fields live preview update karte hain. **Local UI pass.**
8. **Course cards top thumbnails** — Basic/Advanced 1280×720 images, card ke upar, 2-column desktop/1-column mobile. **Local UI pass.**
9. **Detail sidebar thumbnails** — dono courses mein same thumbnail `object-fit: contain`, no crop. **Local UI pass.**
10. **Fast/smooth login and switching** — page transition, stable app reveal, duplicate full renders reduced. **Code pass; live performance test pending.**
11. **Exact deep links** — course/dashboard/signals/settings route preserve hota hai; login ke baad intended route continue hota hai. **Local auth route pass.**
12. **Clean URL** — explicit `index.html` redirect to `/`; navigation clean query routes use karti hai. **Static pass; server mod_rewrite test pending.**
13. **Forgot password Back to Login** — home `./` background + `#auth-login`, login modal auto-open. **Code pass.**
14. **Sidebar layout flash** — app fail-closed boot class aur stable sidebar dimensions. **Code pass; live visual test pending.**
15. **Signal popup once** — seen signal IDs localStorage mein save; same signal refresh/page switch par repeat nahi. **Code pass.**
16. **Generate Class Links button** — compact button, sirf pending/failed state, background retry, success par class panel update. **Code pass; live Zoom test pending.**
17. **Admin logo** — login, boot aur sidebar official `favicon.png` use karte hain; runtime fallback bhi hai. **Static pass.**
18. **Heavy runtime** — duplicate/full refresh paths reduced, images WebP, static assets cache-busted. **Code pass; live timing pending.**
19. **Cache/SW forced removal** — service worker unregister/cache delete/reload code removed; normal asset caching configured. **Static pass.**
20. **Background polling** — main polling 60s/5min, realtime primary; permanent 500–800ms observers converted/reduced. **Static pass.**
21. **Protected content flash** — access resolve hone tak app hidden; failure par fail-closed lock state. **Code pass.**
22. **Branded dialogs** — user/admin legacy alerts branded modal se route; admin/PIN confirms and prompts branded. Mentor confirms bhi branded. **Code pass.**
23. **Admin dummy controls** — Add User, Export CSV, Quick Add routing, notifications/messages navigation aur campaign draft builder functional. Generic bulk-email sending ko fake success nahi diya. **Local/static pass.**
24. **PWA branding** — name/short name PipSePaisa, start URL `./`, correct icons/theme. **Static pass.**
25. **Supabase preconnect** — correct project `etfolhinohgmskbfjoyh.supabase.co`. **Static pass.**

## Thumbnail local browser verification

- Basic card: 1280×720, `object-fit: contain`, image title se upar.
- Advanced card: 1280×720, `object-fit: contain`, image title se upar.
- Basic detail sidebar: 1280×720, `object-fit: contain`.
- Canonical module order: 9/9 correct.
- Course UI JavaScript errors: 0.

## Zaroori live dependencies

Website ZIP upload se Supabase Edge Functions automatically deploy nahi hoti. Email/push ke clean course links ke liye included sources ko baad mein redeploy karna hoga:

- `supabase/functions/send-course-email/index.ts`
- `supabase/functions/notify-signal/index.ts`

Purane users ke WhatsApp ke liye ek dafa run karein:

- `64_V28_SYNC_MISSING_WHATSAPP_FROM_AUTH_METADATA.sql`
