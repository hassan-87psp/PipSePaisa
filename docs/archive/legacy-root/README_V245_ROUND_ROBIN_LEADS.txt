PipSePaisa V245 — ROUND-ROBIN ENROLLMENT LEADS
Date: 2026-09-17

WHAT THIS PATCH DOES
1. Every successful course enrollment can be assigned to the next eligible Team Member, 1-by-1.
2. Admin Team Panel Access now shows:
   - Team Member Name
   - WhatsApp Number
   - Automatic Leads ON/OFF checkbox
   - Assigned Lead Count
   - Existing Team Access controls remain separate.
3. Leads OFF:
   - Team Member login remains active.
   - New enrollment leads skip that member.
   - When turned ON again, future leads can go to that member again.
4. New Team Members can be created with WhatsApp number and Automatic Leads setting.
5. Removed/disabled Team Members do not receive new leads.
6. Assigned enrollments appear in Team Panel > My Clients with AUTO LEAD marker.
7. After enrollment, the assigned Team Member WhatsApp opens with this pre-filled message:

   Hello Miss Memona,

   Maine PipSePaisa par apni enrollment complete kar li hai.

   Name: [Client Name]
   Email: [Client Email]
   Course: [Course Name]

   Please mujhe next process ke liye guide kar dein.

8. If all members are Leads OFF / have no valid WhatsApp number, the old referral/channel fallback remains available.
9. Existing Infinity Local Bank payment logic is not modified.

DEPLOY ORDER — IMPORTANT
STEP 1
Run this SQL once in Supabase SQL Editor:
107_V245_ROUND_ROBIN_LEAD_DISTRIBUTION.sql

STEP 2
Upload/replace the files from this patch, preserving folder paths.

STEP 3
Open Admin > Team Panel Access.
For existing Team Members:
- Click Edit Number
- Add WhatsApp with country code, e.g. 60123456789
- Turn Leads ON for members who should receive leads.

ROUND-ROBIN EXAMPLE
Amal ON
Samiya ON
Memona ON

Lead 1 -> Amal
Lead 2 -> Samiya
Lead 3 -> Memona
Lead 4 -> Amal

If Samiya is OFF:
Lead 1 -> Amal
Lead 2 -> Memona
Lead 3 -> Amal
Lead 4 -> Memona

When Samiya is ON again, she rejoins future rotation.

IMPORTANT
- Team Panel Active/Disabled and Automatic Leads ON/OFF are different controls.
- Turning Automatic Leads OFF does NOT disable Team Panel login.
- One enrollment keeps the same assigned Team Member if the redirect is opened again.
- Assignment is protected against double-click/concurrent duplicate assignment.
