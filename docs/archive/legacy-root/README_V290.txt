PipSePaisa V290 — Team Mobile Polish + Persistent Navigation FIX

Changed files only:
- team-panel.html
- team/index.html

What is fixed:
1. Mobile bottom navigator stays visible in Clients and every Team view, including after using search/filter inputs.
2. Extra bottom safe-space prevents client cards/content from being hidden behind the fixed navigator.
3. Page-level horizontal overflow removed.
4. Home workflow/action cards now fit the viewport instead of showing the next card cut off.
5. Course/Batch chips scroll only inside their own chip row; the whole page no longer slides sideways.
6. Mobile client cards are more compact and email is hidden on the card (Client ID remains visible).
7. Manager heading uses clean display names (Ms Memoona / Ms Samiya / Ms Amal) instead of raw usernames such as Memoonafx.
8. Current/Ad clients show one canonical batch per course family, preferring current/latest batch (B3 over B2/B1; Fundamental B2 over B1) while old tracking history keeps real multi-batch history.
9. Client source display respects Direct / Organic when present and does not blindly label every assigned client as Ad / Auto.
10. More-menu sections keep the More tab highlighted correctly.
11. No database/SQL change required for this patch.

Install:
Upload the two HTML files to the same paths on the website, replacing the existing Team Panel copies.
