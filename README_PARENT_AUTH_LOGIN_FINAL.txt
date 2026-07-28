PipSePaisa parent-auth login fix

Root cause:
landing.html runs inside an iframe. The iframe was creating its own Supabase
login session and then reloading index.html. On some mobile/in-app browsers,
the parent page did not receive that session reliably, so it showed the
landing page again. The reload also caused a duplicate ticker.

Fixed:
- The iframe sends the entered email/password directly to its same-origin parent.
- index.html performs signInWithPassword using the main Supabase client.
- The parent confirms the saved session and opens the dashboard immediately.
- No page reload is used for iframe login.
- A successful session remains active until explicit Logout.
- A narrow duplicate-ticker guard is included.
- Locked mobile layout and approved broker section are unchanged.

Upload the complete ZIP, clear hosting/CDN cache, and hard refresh.
No SQL query is required.
