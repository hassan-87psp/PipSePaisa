
-- payment_methods: preserve current effective visibility with one policy per role.
drop policy if exists "Admin views all payment methods" on public.payment_methods;
drop policy if exists "Public views enabled payment methods" on public.payment_methods;

create policy "psp_v341_anon_read_payment_methods"
  on public.payment_methods
  as permissive
  for select
  to anon
  using (enabled = true);

create policy "psp_v341_authenticated_read_payment_methods"
  on public.payment_methods
  as permissive
  for select
  to authenticated
  using (
    (enabled = true)
    or (owner_id = (select auth.uid()))
    or public.psp_is_admin()
    or (is_system = true)
  );

-- support_messages: anonymous support uses Live Desk, not this signed-in ticket table.
drop policy if exists "support_insert_all" on public.support_messages;
