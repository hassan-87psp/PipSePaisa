insert into mentor_access_settings (key, enabled, updated_at) values
  ('performance', true, now()),
  ('signals', true, now()),
  ('charts', true, now()),
  ('articles', true, now()),
  ('banners', true, now()),
  ('settings', true, now())
on conflict (key) do update set
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;
