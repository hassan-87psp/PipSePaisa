-- PipSePaisa V477 — remove SECURITY DEFINER bypass from user signal feeds.
-- Existing frontend RPC names remain unchanged; database RLS now controls visibility.

begin;

alter function public.psp_user_signals_feed(integer) security invoker;
alter function public.psp_user_signals_feed_v158(integer) security invoker;
alter function public.psp_user_signal_feed_v159() security invoker;
alter function public.psp_user_signal_feed_v159() reset row_security;

commit;
