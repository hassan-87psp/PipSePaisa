# V28 Deploy aur Live Test

## Deploy

1. Purane live `public_html` ka backup rakhein.
2. V28 ZIP ke **andar ki tamam files** `public_html` mein upload/overwrite karein. Extra parent folder upload na karein.
3. Browser mein hard refresh karein: `Ctrl + Shift + R`.
4. Supabase SQL Editor mein `64_V28_SYNC_MISSING_WHATSAPP_FROM_AUTH_METADATA.sql` ek dafa run karein.
5. Email/push deep links update karne ke liye included `send-course-email` aur `notify-signal` Edge Functions redeploy karein.

## One-by-one live test

1. New email signup → Check Your Email → Use a different email.
2. Verification link → button foran enable → home background + login.
3. Chrome autofill select → modal close na ho.
4. Login → sidebar flash na ho → dashboard/course exact route.
5. My Courses → dono 16:9 thumbnails upar, no broken image.
6. Free + Paid detail → sidebar same thumbnails, no crop.
7. Enrollment → page blink/reload na ho.
8. Zoom links pending → compact Generate Class Links → background update.
9. Course module order aur Zoom class order same 1–9.
10. Signal popup same signal ke liye sirf ek dafa.
11. Admin login/sidebar logo; WhatsApp column; Add User; CSV; course preview.
12. Mobile approved layout compare karein; layout change nahi hona chahiye.

Kisi step par issue aaye to usi screen ka screenshot aur browser Console ka first red error bhejein. Agla step usi issue par hoga.
