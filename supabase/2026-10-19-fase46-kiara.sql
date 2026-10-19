-- Fase 46: ejecutar una vez en SQL Editor de Supabase antes de publicar Kiara.
begin;
alter table public.pedidos add column if not exists origen text;
create table if not exists public.kiara_limites (
 clave text not null, ventana timestamptz not null, solicitudes integer not null default 0,
 chats integer not null default 0, primary key(clave,ventana)
);
alter table public.kiara_limites enable row level security;
revoke all on public.kiara_limites from anon,authenticated;
-- Contadores compartidos por todas las instancias serverless: 120 solicitudes/hora/IP,
-- 40 conversaciones Gemini/hora/IP y 1000 llamadas Gemini/día en total.
create or replace function public.kiara_limitar_solicitudes(p_clave text,p_chat boolean)
returns boolean language plpgsql security definer set search_path=public as $$
declare v public.kiara_limites%rowtype; v_global integer;
begin
 delete from kiara_limites where ventana < now()-interval '2 days';
 insert into kiara_limites(clave,ventana,solicitudes,chats)
 values(p_clave,date_trunc('hour',now()),1,case when p_chat then 1 else 0 end)
 on conflict(clave,ventana) do update set solicitudes=kiara_limites.solicitudes+1,
 chats=kiara_limites.chats+case when p_chat then 1 else 0 end returning * into v;
 if v.solicitudes>120 or v.chats>40 then return false; end if;
 if p_chat then
  insert into kiara_limites(clave,ventana,solicitudes,chats) values('global',date_trunc('day',now()),1,1)
  on conflict(clave,ventana) do update set chats=kiara_limites.chats+1 returning chats into v_global;
  if v_global>1000 then return false; end if;
 end if;
 return true;
end; $$;
create or replace function public.kiara_crear_pedido(p_pedido jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.pedidos%rowtype;
begin
 -- Sólo el servidor con service_role puede invocar esta función.
 if p_pedido->>'origen' is distinct from 'Kiara' or jsonb_typeof(p_pedido->'items') is distinct from 'array'
 or jsonb_array_length(p_pedido->'items')=0 or (p_pedido->>'total')::numeric <= 0 then raise exception 'Pedido inválido'; end if;
 -- Serializa reintentos del mismo pedido, sin bloquear otros pedidos.
 perform pg_advisory_xact_lock(hashtextextended(p_pedido->>'id',46));
 select * into v from pedidos where id::text=p_pedido->>'id';
 if found then
  if v.origen is distinct from 'Kiara' then raise exception 'Pedido no válido'; end if;
 else
  insert into pedidos(id,cliente,cliente_nombre,telefono,ubicacion,tipo_pago,tipo_pedido,mesa,mesero,
    observaciones,items,pedido_texto,total,estado,enviado_whatsapp,origen,impreso)
  select r.id,r.cliente,r.cliente_nombre,r.telefono,r.ubicacion,r.tipo_pago,r.tipo_pedido,r.mesa,r.mesero,
    r.observaciones,r.items,r.pedido_texto,r.total,r.estado,r.enviado_whatsapp,r.origen,false
  from jsonb_populate_record(null::public.pedidos,p_pedido) r returning * into v;
 end if;
 return jsonb_build_object('numero',v.numero_pedido,'total',v.total);
end; $$;
revoke all on function public.kiara_limitar_solicitudes(text,boolean) from public,anon,authenticated;
revoke all on function public.kiara_crear_pedido(jsonb) from public,anon,authenticated;
grant execute on function public.kiara_limitar_solicitudes(text,boolean) to service_role;
grant execute on function public.kiara_crear_pedido(jsonb) to service_role;
notify pgrst,'reload schema';
commit;
