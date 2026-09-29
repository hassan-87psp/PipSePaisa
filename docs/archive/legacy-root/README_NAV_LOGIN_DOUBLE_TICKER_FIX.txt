PipSePaisa targeted fix

Fixed only these recurring issues:
- Mobile header now shows Home, Broker Reviews, Become Partner, Courses and Trading Tools & Services in the approved desktop-style mobile layout.
- Successful login redirects the TOP browser window, not the landing iframe.
- Prevents a second index page/ticker from loading inside the landing iframe.
- Defensive iframe escape added for stale cached login redirects.
- Locked mobile layout and all other sections remain unchanged.

Upload the complete ZIP, clear hosting/CDN cache, and hard refresh.
