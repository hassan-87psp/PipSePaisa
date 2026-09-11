PipSePaisa V222 — Course / Payment / Admin Fix Pack
Date: 11 Sep 2026
Base: V221 Advance Fundamental

WHAT THIS PATCH FIXES
1) Advance Fundamental course detail now always uses Sir Malik Ghulam Abbas's existing project photo (ghulam-abbas.png).
2) Instructor badge/name sizing fixed so “Sir Malik Ghulam Abbas” is not cut.
3) Advance Fundamental no longer shows fake/empty 0 Modules / 0 Sessions / 0 Structured Modules values.
   It shows non-count information such as Live Classes and Starting Soon instead.
4) “What you'll learn” is populated with the approved short fundamental topics:
   - Central Banks & Interest Rates
   - CPI, PCE & Inflation
   - NFP & Labour Market
   - GDP, PMI & Retail Sales
   - Bonds, Yields, DXY & Gold
   - Fundamental Bias & Market Sentiment
5) “Course Outcomes” is populated with the approved short outcomes:
   - Read Economic Data
   - Understand Market Drivers
   - Build Trading Bias
   - Analyze Major Events
   - Connect Fundamentals with Price
   - Improve Trade Decisions
6) Advance Fundamental Local Bank / Infinity checkout remains on the existing stable payment engine,
   but V222 can derive and persist the new course PKR amount from the already configured Advanced-course USD→PKR ratio when missing.
7) EA & Indicator is placed directly under Signals (Signals → EA & Indicator → Live Charts).
8) EA & Indicator uses the same orange premium sidebar treatment as My Courses.
9) My Courses order is now:
   - Advanced Forex Course
   - Advance Fundamental
   - Basic Forex Course — Batch 2
   - Fundamental Forex Course
   Two paid/advanced courses are on the first row; both free courses are on the second row on desktop.
10) Admin Course Manager supports the complete 4-course catalog. V222 SQL ensures the free Fundamental catalog row exists.
11) Payments & Enrollments Admin Center now separates users by:
   - Basic Batch 1
   - Basic Batch 2
   - Fundamental
   - Advanced Forex
   - Advance Fundamental
12) Admin payment dashboard shows separate revenue for Advanced Forex and Advance Fundamental plus Total Paid Course Revenue.
    Free-course revenue remains $0. Paid revenue uses approved/enrolled paid-course records.
13) Public Courses page now gives all four courses proper thumbnails in a consistent card system and uses the paid-first/free-second order.
14) Landing “IB Business Solutions” broken image path is fixed (same shared asset fix also applied to Broker Reviews copies).

IMPORTANT COURSE RULES PRESERVED
- Advance Fundamental: Advanced level, Starting Soon, Live Classes only, no recording promise, no class-count/date displayed.
- Price: $250 original → $150 active offer.
- Limited-seat wording without inventing a seat count.
- USDT TRC20 + Local Bank Transfer.
- Existing referral/link attribution flow preserved.
- Batch split still uses original user registration date: before 1 Sep 2026 = Batch 1; 1 Sep onward = Batch 2.
- No auth.users trigger/table changes.
- infinity-payment-callback is NOT replaced by this patch.

INSTALL / DEPLOY ORDER
A) If V221 SQL has ALREADY been applied:
   1. Run ONLY: 92_V222_COURSE_PAYMENT_UI_ADMIN_FIX.sql

B) If applying directly over a build where V221 SQL was NOT applied:
   1. Run: 91_V221_ADVANCE_FUNDAMENTAL.sql
   2. Then run: 92_V222_COURSE_PAYMENT_UI_ADMIN_FIX.sql

Then:
3. Merge/upload the included website files, preserving their paths.
4. Redeploy ONLY this Supabase Edge Function from the included file:
      supabase/functions/create-infinity-payment/index.ts
5. Do NOT replace infinity-payment-callback.
6. Hard-refresh/cache-clear once after deployment because V222 includes new cache-busting URLs.

LOCAL BANK NOTE
- The Advanced Forex Course Local Bank payment must already have a valid PKR amount/configuration.
- V222 derives Advance Fundamental's PKR amount from that working Advanced-course ratio if the new course amount is empty.
- The Edge Function also self-heals/persists this derived amount before calling the existing stable preparation flow.

QUICK TEST CHECKLIST
[ ] My Courses shows Advanced + Advance Fundamental on row 1, Basic + Fundamental on row 2.
[ ] Open Advance Fundamental: Sir Malik Ghulam Abbas photo/name are correct and no 0 module/session counters appear.
[ ] What you'll learn + Course Outcomes both contain the short approved lists.
[ ] Local Bank Transfer opens the Infinity hosted checkout for Advance Fundamental.
[ ] USDT TRC20 still works for Advance Fundamental.
[ ] Sidebar order is Signals → EA & Indicator → Live Charts.
[ ] Admin Course Manager shows 4 courses / 4 active when all are published.
[ ] Payments & Enrollments shows 5 course/batch breakdown cards and separate paid-course revenue.
[ ] Public /courses page shows thumbnails on all 4 cards in paid-first/free-second order.
[ ] Landing Our Services third card image loads (no broken image/alt text).

VALIDATION PERFORMED BEFORE PACKAGING
- JavaScript syntax checks passed on all modified active JS files.
- Modified HTML files parsed successfully.
- Referenced course/instructor/service assets verified present.
- Course order/content/payment/admin invariants checked with automated assertions.
