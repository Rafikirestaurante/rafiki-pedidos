-- Fase 47: continuar la numeración de pedidos después de 9999.
-- Los números y ciclos históricos (por ejemplo C2-0001) no se modifican.
-- Ejecutar una vez en SQL Editor de Supabase.
begin;

lock table public.pedidos in access exclusive mode;

create sequence if not exists public.pedidos_numero_continuo_seq as bigint;

-- Deja de usar la secuencia anterior (que pudo reiniciarse o llegar a su límite).
alter table public.pedidos alter column numero_pedido drop default;

do $$
declare
  v_max bigint;
begin
  select coalesce(max(nullif(numero_pedido::text, '')::bigint), 0)
    into v_max
    from public.pedidos;

  perform setval('public.pedidos_numero_continuo_seq'::regclass, v_max + 1, false);
end;
$$;

create or replace function public.asignar_numero_pedido_continuo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.numero_pedido := nextval('public.pedidos_numero_continuo_seq'::regclass);
  new.ciclo_pedido := 1;
  return new;
end;
$$;

drop trigger if exists zz_pedidos_numero_continuo on public.pedidos;
create trigger zz_pedidos_numero_continuo
before insert on public.pedidos
for each row
execute function public.asignar_numero_pedido_continuo();

revoke all on function public.asignar_numero_pedido_continuo() from public, anon, authenticated;

commit;
