-- Fase 42: administración de cuentas existentes desde Rafiki.
alter table if exists public.usuarios_roles add column if not exists user_id uuid;
alter table if exists public.usuarios_roles add column if not exists activo boolean not null default true;
alter table if exists public.usuarios_roles add column if not exists creado_en timestamptz not null default now();
alter table if exists public.usuarios_roles add column if not exists actualizado_en timestamptz not null default now();
alter table if exists public.usuarios_roles enable row level security;
grant select, update on public.usuarios_roles to authenticated;
drop policy if exists usuarios_roles_select_authenticated on public.usuarios_roles;
drop policy if exists usuarios_roles_update_authenticated on public.usuarios_roles;
create policy usuarios_roles_select_authenticated on public.usuarios_roles for select to authenticated using (true);
create policy usuarios_roles_update_authenticated on public.usuarios_roles for update to authenticated using (true) with check (true);
