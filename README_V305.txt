PipSePaisa V305 — FreeCourse2 AI Chat Final Patch

WHAT IS NEW
1) https://www.pipsepaisa.com/freecourse2
   - Full-screen WhatsApp-style PipSePaisa AI Assistant
   - No normal website header / footer
   - Instant suggested questions
   - Short Roman Urdu / English replies matching the visitor
   - Built-in PipSePaisa course/services knowledge
   - Quick local answers for common Batch 3 questions
   - Optional live web lookup for current/external questions when needed
   - Human Admin replies appear in the same chat
   - GET MY FREE ZOOM LINK sends the visitor to the EXISTING enrollment system

2) TRACKING
   - /freecourse2 visits, conversations, messages and Zoom-link clicks are stored separately
   - Existing enrollment page receives:
       utm_source=freecourse2
       utm_medium=ai-chat
       utm_campaign=batch3
       fc2=<conversation id>
   - Technical CTA -> /sajid-khan-ghori
   - Fundamental CTA -> /ghulam-abbas
   - Existing enrollment / Team manager / WhatsApp routing is NOT duplicated or replaced

3) ADMIN PANEL
   - New Communication tab: AI Chat
   - Visitors / active chats / messages / Zoom clicks / click rate
   - Conversation list + complete message history
   - Human Takeover / Resume AI
   - Manual Admin reply
   - Close / Reopen conversation
   - Editable greeting, suggested questions and Extra Knowledge / overrides
   - Open /freecourse2 directly for live testing

4) TEAM PANEL
   - Old Team Panel Live Chat UI/integration removed
   - Team clients, earnings, PWA, navigation and all other Team functions preserved
   - Old Live Chat database/files are not deleted; they are simply no longer loaded by Team Panel

DEPLOYMENT — DO THESE IN ORDER
A. Upload all patch files to the website, preserving folders.
B. Supabase -> SQL Editor -> run V305_FREECOURSE2_AI_CHAT.sql ONCE.
C. Supabase Edge Functions -> deploy/redeploy function folder:
      supabase/functions/freecourse2-ai/index.ts
   Function name MUST be: freecourse2-ai
   No new API secret is required; it reuses the existing PipSePaisa AI upstream plus Supabase service-role environment.
D. Hard refresh Admin and Team Panel.
E. Test:
   1. Open /freecourse2 in mobile incognito.
   2. Tap suggested questions.
   3. Type a custom question.
   4. Tap GET MY FREE ZOOM LINK and confirm /sajid-khan-ghori opens with utm_source=freecourse2.
   5. Admin -> AI Chat -> confirm the conversation/messages/click appear.
   6. Use Human Takeover, send one Admin reply, and confirm it appears on the visitor chat.

IMPORTANT
- Existing course enrollment/account creation/manager assignment/short WhatsApp routing is unchanged.
- No new enrollment form is created inside /freecourse2.
- Current Batch 3 knowledge: Sir Sajid Khan Ghori, 4 live sessions, starts 28 September 2026, 100% free.
- The AI never guarantees trading profits/returns.
