PipSePaisa audited stability build

Additional issues found and fixed:
1. Query 46 was missing from the previous ZIP although its README referred to it.
2. Older My Courses/Admin enrollment scripts were still present.
3. A continuous guard now removes duplicate ticker wrappers and extra ticker iframes.
4. Cache versions changed so browsers do not reuse older scripts.

Required order:
1. Run 46_COURSE_PAYMENT_SIGNAL_CHART_SCHEMA_REPAIR.sql
2. Upload the COMPLETE ZIP contents
3. Clear hosting/CDN cache and hard refresh
