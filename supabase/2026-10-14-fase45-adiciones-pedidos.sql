-- Fase 45. Ejecutar después de Fase 44. Requiere usuarios_roles de Fase 42.
begin;
alter table public.pedidos add column if not exists impresion_inicial jsonb;
alter table public.pedidos add column if not exists adiciones_resumen jsonb not null default '[]'::jsonb;
create table if not exists public.pedido_adiciones (
 id uuid primary key, pedido_id text not null, numero_pedido text,
 created_at timestamptz not null default now(), usuario_id uuid not null,
 usuario_email text, mesero text not null, mesa text, items jsonb not null,
 pedido_texto text not null, total numeric not null check(total >= 0),
 payload_impresion jsonb not null, impreso boolean not null default false
);
alter table public.pedido_adiciones enable row level security;
grant select on public.pedido_adiciones to authenticated, anon;
grant update(impreso) on public.pedido_adiciones to anon, authenticated;
drop policy if exists adiciones_lectura on public.pedido_adiciones;
create policy adiciones_lectura on public.pedido_adiciones for select to anon, authenticated using (true);
drop policy if exists adiciones_impresion on public.pedido_adiciones;
create policy adiciones_impresion on public.pedido_adiciones for update to anon, authenticated using (true) with check(true);

create or replace function public.agregar_productos_pedido(
 p_pedido_id text, p_operacion_id uuid, p_items jsonb, p_total numeric,
 p_texto text, p_mesero text, p_mesa text, p_mesa_original text, p_pago_original text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_pedido public.pedidos%rowtype;
 v_adicion public.pedido_adiciones%rowtype;
 v_items jsonb;
 v_email text := auth.jwt()->>'email';
 v_payload jsonb;
 v_meta jsonb;
begin
 if auth.uid() is null or not exists (
  select 1 from public.usuarios_roles where coalesce(activo,true) and (user_id=auth.uid() or lower(email)=lower(v_email))
 ) then raise exception 'Inicia sesión con una cuenta activa para agregar productos.'; end if;
 select * into v_pedido from public.pedidos where id::text=p_pedido_id for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 select * into v_adicion from public.pedido_adiciones where id=p_operacion_id;
 if found then
  if v_adicion.pedido_id<>p_pedido_id or v_adicion.usuario_id<>auth.uid() then raise exception 'Operación no válida.'; end if;
  return jsonb_build_object('pedido',to_jsonb(v_pedido),'adicion',to_jsonb(v_adicion),'repetida',true);
 end if;
 if lower(coalesce(v_pedido.estado,'')) in ('borrado','anulado','cancelado') then raise exception 'No se puede agregar a un pedido borrado o anulado.'; end if;
 if coalesce(v_pedido.mesa,'')<>coalesce(p_mesa_original,'') or coalesce(v_pedido.tipo_pago,'')<>coalesce(p_pago_original,'') then
  raise exception 'La mesa o el pago del pedido cambió en otro dispositivo. Abre de nuevo Agregar.';
 end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)=0 or p_total is null or p_total<0 or p_total<>round(p_total) then raise exception 'Adición no válida.'; end if;
 if nullif(trim(p_mesero),'') is null or nullif(trim(p_mesa),'') is null or nullif(trim(p_texto),'') is null then raise exception 'Completa mesa, mesero y productos.'; end if;
 select jsonb_agg(item || jsonb_build_object('adicion_id',p_operacion_id,'mesero_adicion',p_mesero)) into v_items from jsonb_array_elements(p_items) as t(item);
 v_meta := jsonb_build_object('id',p_operacion_id,'mesero',p_mesero,'usuario',v_email,'fecha',now(),'total',p_total,'mesa',p_mesa);
 v_payload := to_jsonb(v_pedido) || jsonb_build_object('id','adicion:'||p_operacion_id::text,
  'items',v_items,'total',p_total,'pedido_texto',p_texto,'mesero',p_mesero,'mesa',p_mesa,
  'ubicacion',case when lower(coalesce(v_pedido.tipo_pedido,''))='llevar' then v_pedido.ubicacion else p_mesa end,
  'observaciones','ADICION AL PEDIDO #'||coalesce(v_pedido.numero_pedido::text,p_pedido_id),
  'created_at',now(),'creado_en',now(),'impresion_inicial',null);
 insert into public.pedido_adiciones(id,pedido_id,numero_pedido,usuario_id,usuario_email,mesero,mesa,items,pedido_texto,total,payload_impresion)
 values(p_operacion_id,p_pedido_id,v_pedido.numero_pedido::text,auth.uid(),v_email,p_mesero,p_mesa,v_items,p_texto,p_total,v_payload) returning * into v_adicion;
 update public.pedidos set
  impresion_inicial=coalesce(impresion_inicial,to_jsonb(v_pedido)),
  items=coalesce(items,'[]'::jsonb)||v_items,
  total=coalesce(total,0)+p_total,
  pedido_texto=coalesce(pedido_texto,'')||E'\n\nADICION ('||p_mesero||E'):\n'||p_texto,
  cliente=case when cliente=mesa then p_mesa else cliente end,
  cliente_nombre=case when cliente_nombre=mesa then p_mesa else cliente_nombre end,
  mesa=p_mesa,
  ubicacion=case when lower(coalesce(tipo_pedido,''))='llevar' then ubicacion else p_mesa end,
  adiciones_resumen=coalesce(adiciones_resumen,'[]'::jsonb)||jsonb_build_array(v_meta),
  estado='Pendiente'
 where id::text=p_pedido_id returning * into v_pedido;
 -- La cuenta por cobrar se actualiza dentro de la misma transacción.
 update public.cartera_movimientos set valor=v_pedido.total, saldo_movimiento=v_pedido.total
 where pedido_id=p_pedido_id and tipo_movimiento='pedido_credito' and lower(coalesce(estado,''))<>'anulado';
 if lower(coalesce(v_pedido.tipo_pago,'')) in ('crédito','credito') and not found then
  raise exception 'El pedido a crédito no tiene movimiento de cartera vigente. Revisa la cartera antes de agregar productos.';
 end if;
 return jsonb_build_object('pedido',to_jsonb(v_pedido),'adicion',to_jsonb(v_adicion),'repetida',false);
end; $$;
revoke all on function public.agregar_productos_pedido(text,uuid,jsonb,numeric,text,text,text,text,text) from public;
grant execute on function public.agregar_productos_pedido(text,uuid,jsonb,numeric,text,text,text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
