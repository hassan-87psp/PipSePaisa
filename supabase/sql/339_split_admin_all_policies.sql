
-- account_verification_settings
drop policy if exists "verification settings admin" on public.account_verification_settings;
create policy "verification settings admin insert" on public.account_verification_settings
  for insert to authenticated with check (public.psp_is_admin());
create policy "verification settings admin update" on public.account_verification_settings
  for update to authenticated using (public.psp_is_admin()) with check (public.psp_is_admin());
create policy "verification settings admin delete" on public.account_verification_settings
  for delete to authenticated using (public.psp_is_admin());

-- account_verifications
drop policy if exists "verification admin write" on public.account_verifications;
create policy "verification admin insert" on public.account_verifications
  for insert to authenticated with check (public.psp_is_admin());
create policy "verification admin update" on public.account_verifications
  for update to authenticated using (public.psp_is_admin()) with check (public.psp_is_admin());
create policy "verification admin delete" on public.account_verifications
  for delete to authenticated using (public.psp_is_admin());

-- ea_indicator_products
drop policy if exists "Admins manage products" on public.ea_indicator_products;
create policy "Admins insert products" on public.ea_indicator_products
  for insert to authenticated with check (public.psp_eai_is_admin());
create policy "Admins update products" on public.ea_indicator_products
  for update to authenticated using (public.psp_eai_is_admin()) with check (public.psp_eai_is_admin());
create policy "Admins delete products" on public.ea_indicator_products
  for delete to authenticated using (public.psp_eai_is_admin());

-- ea_indicator_requests
drop policy if exists "Admins manage all requests" on public.ea_indicator_requests;
create policy "Admins insert all requests" on public.ea_indicator_requests
  for insert to authenticated with check (public.psp_eai_is_admin());
create policy "Admins update all requests" on public.ea_indicator_requests
  for update to authenticated using (public.psp_eai_is_admin()) with check (public.psp_eai_is_admin());
create policy "Admins delete all requests" on public.ea_indicator_requests
  for delete to authenticated using (public.psp_eai_is_admin());

-- pin_access_settings
drop policy if exists "Admins manage PIN settings" on public.pin_access_settings;
create policy "Admins insert PIN settings" on public.pin_access_settings
  for insert to authenticated with check (public.psp_is_admin());
create policy "Admins update PIN settings" on public.pin_access_settings
  for update to authenticated using (public.psp_is_admin()) with check (public.psp_is_admin());
create policy "Admins delete PIN settings" on public.pin_access_settings
  for delete to authenticated using (public.psp_is_admin());

-- subscriptions
drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_insert" on public.subscriptions
  for insert to authenticated with check (public.is_admin());
create policy "subscriptions_admin_update" on public.subscriptions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "subscriptions_admin_delete" on public.subscriptions
  for delete to authenticated using (public.is_admin());

-- user_access_pins
drop policy if exists "Admins manage PIN records" on public.user_access_pins;
create policy "Admins insert PIN records" on public.user_access_pins
  for insert to authenticated with check (public.psp_is_admin());
create policy "Admins update PIN records" on public.user_access_pins
  for update to authenticated using (public.psp_is_admin()) with check (public.psp_is_admin());
create policy "Admins delete PIN records" on public.user_access_pins
  for delete to authenticated using (public.psp_is_admin());
