PipSePaisa exact login and broker comparison fix

- Login waits until Supabase confirms the saved session.
- User Panel restores the saved session before showing the landing iframe.
- Successful login enters the dashboard instead of returning to the same landing page.
- Broker comparison remains a desktop-style table on mobile.
- All broker logos use consistent dimensions and no longer overflow their rows.

Upload the complete ZIP, clear hosting/CDN cache, and hard refresh.
No SQL query is required.
