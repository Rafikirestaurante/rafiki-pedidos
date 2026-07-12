-- Rafiki Pedidos - Fase 36A
-- Infraestructura segura para conectar una cuenta de Gmail mediante OAuth 2.0.
-- Esta migración NO crea movimientos de Caja, Cartera, Gastos ni Pedidos.

begin;

create extension if not exists pgcrypto;

create table if not exists public.gmail_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists gmail_oauth_states_expires_idx
  on public.gmail_oauth_states (expires_at);

create table if not exists public.gmail_connections (
  connection_key text primary key default 'principal'
    check (connection_key = 'principal'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  google_email text not null,
  google_history_id text,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  granted_scope text not null default '',
  token_type text,
  status text not null default 'connected'
    check (status in ('connected', 'error', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_verified_at timestamptz,
  last_error text,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gmail_integration_audit (
  id bigint generated always as identity primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  google_email text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gmail_integration_audit_created_idx
  on public.gmail_integration_audit (created_at desc);

create or replace function public.fase36a_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_gmail_connections_updated_at on public.gmail_connections;
create trigger trg_gmail_connections_updated_at
before update on public.gmail_connections
for each row execute function public.fase36a_set_updated_at();

alter table public.gmail_oauth_states enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.gmail_integration_audit enable row level security;

-- Las tablas guardan secretos o trazabilidad interna. Solo las Edge Functions
-- con service role pueden acceder; React nunca consulta estas tablas directamente.
revoke all on table public.gmail_oauth_states from anon, authenticated;
revoke all on table public.gmail_connections from anon, authenticated;
revoke all on table public.gmail_integration_audit from anon, authenticated;
revoke all on sequence public.gmail_integration_audit_id_seq from anon, authenticated;

-- Limpieza segura de estados OAuth vencidos o ya usados.
create or replace function public.limpiar_estados_oauth_gmail()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  eliminados integer;
begin
  delete from public.gmail_oauth_states
  where expires_at < now() - interval '1 day'
     or used_at < now() - interval '1 day';
  get diagnostics eliminados = row_count;
  return eliminados;
end;
$$;

revoke all on function public.limpiar_estados_oauth_gmail() from public, anon, authenticated;

commit;
