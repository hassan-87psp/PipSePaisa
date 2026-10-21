# PipSePaisa SQL

These SQL files are ordered by their original query number. Run only when the related feature/fix is required; they are kept here for project history and maintenance.

- 044_course_enrollment_system.sql — course enrollment tables, policies, and realtime support
- 046_course_payment_signal_chart_schema_repair.sql — schema repair for courses, payments, signals, and charts
- 047_payment_methods_save_visibility_fix.sql — payment-method save and visibility fixes
- 048_signal_realtime_notifications.sql — enable realtime for signals
- 049_signal_push_webhook.sql — signal push-notification database webhook
- 050_complete_realtime_enablement.sql — enable realtime across the main app tables
- 057_broker_optional_email_clean_routes.sql — broker verification optional-email / clean-flow update
- 107_round_robin_lead_distribution.sql — round-robin enrollment lead distribution

## 30 October 2026: Explicit Data API grants for new public tables

Supabase will stop auto-granting browser Data API permissions on **new** `public` tables starting 2026-10-30. Existing table grants are unaffected. Do not run an indiscriminate `GRANT ALL ON ALL TABLES` migration: that could expose student details, payments and internal team data.

PipSePaisa's earlier production migration `492_lock_future_browser_default_privileges.sql` already restricted **postgres-owned** future objects by revoking implicit `anon` and `authenticated` defaults. A read-only review on 2026-10-21 showed 119 public tables, all RLS-enabled and owned by `postgres`. This is not a substitute for explicit per-table permissions in each *new* migration; check actual grants for any objects created by other roles or environments.

When introducing a table, put its RLS setup, role permissions and (if needed) sequence permissions **in the same migration**:

```sql
-- Example only. Replace the table/column and use the minimum permissions
-- needed by the exact feature. Do not apply blindly.
create table public.example_user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  body text not null
);
alter table public.example_user_notes enable row level security;

create policy example_user_notes_read_own
  on public.example_user_notes
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy example_user_notes_insert_own
  on public.example_user_notes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

grant select, insert on table public.example_user_notes to authenticated;
grant select, insert, update, delete on table public.example_user_notes to service_role;
-- No anon grant for private user notes.
```

Permission choices:
- **Published public data:** `GRANT SELECT ... TO anon` only if an appropriate public RLS policy explicitly permits disclosure, and only for columns safe to expose.
- **Signed-in student-owned data:** grant only the operations required to `authenticated`, combined with row ownership policies. RLS does **not** replace grants, and grants do **not** replace RLS.
- **Internal/private/payment/admin tables:** avoid `anon` and `authenticated` table grants unless a verified feature requires them; use authorized service-side access and guarded RPCs instead.
- **Serial/identity sequences:** if API inserts need sequence access, explicitly grant only required sequence privileges after confirming their design.
- **Migrations that recreate schemas, branches and local resets:** include identical role grants there too.

Before deploying a new feature: verify `has_table_privilege('anon', ...)` and `has_table_privilege('authenticated', ...)`, verify RLS policies, then test with an actual logged-out and signed-in client. Do not change permissions on existing production tables solely in response to the email.

### Automated new-table safety check

GitHub Actions runs [PipSePaisa Supabase New Table Permissions](../../.github/workflows/supabase-grants-guard.yml) on pushes and pull requests that change SQL migrations, or manually via **Actions → PipSePaisa Supabase New Table Permissions → Run workflow**. The checker compares SQL files against the Git base and inspects **newly introduced CREATE TABLE statements**; historical tables are not re-linted unless a new table is introduced.

For each newly created public-schema table it expects:
1. `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY`
2. An explicit, minimal `GRANT ... ON TABLE public.table_name TO ...`, at least for the roles actually needing SQL access (including `service_role` for backend-only tables).
3. A matching `CREATE POLICY` whenever `anon`, `authenticated`, or `PUBLIC` receives a table grant.

Broad `GRANT ALL` to browser/public roles is rejected. The checker **never executes SQL, automatically grants access, or edits production data**; it is a static migration guard, not a replacement for Supabase role tests, payment-flow regression tests, or a staged database migration. For dynamic SQL and tables introduced outside the reviewed migration paths, perform a separate review.

A red check means fix the **new migration**, not all existing production grants. To require this check before merge, add its job as a *required status check* under GitHub branch protection/rulesets (if enabled on the repository).
