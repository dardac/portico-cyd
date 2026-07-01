-- Revoca acceso directo vía PostgREST (anon/authenticated).
-- La app usa service_role solo en servidor; sin políticas RLS, anon queda bloqueado.

revoke all on table public.towers from anon, authenticated;
revoke all on table public.apartments from anon, authenticated;

alter table public.towers enable row level security;
alter table public.apartments enable row level security;
