-- Fase 46C: Kiara usa el mismo registro operativo que /mesas.
-- Ejecutar después de Fase 46. No modifica pedidos existentes.
begin;
create or replace function public.kiara_crear_pedido(p_pedido jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v public.pedidos%rowtype;
begin
 if jsonb_typeof(p_pedido->'items') is distinct from 'array'
    or jsonb_array_length(p_pedido->'items')=0
    or coalesce((p_pedido->>'total')::numeric,0)<=0
    or nullif(trim(p_pedido->>'mesero'),'') is null
 then raise exception 'Pedido inválido'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_pedido->>'id',46));
 select * into v from public.pedidos where id::text=p_pedido->>'id';
 if found then
  return jsonb_build_object('numero',v.numero_pedido,'total',v.total);
 end if;
 insert into public.pedidos(id,cliente,cliente_nombre,telefono,ubicacion,tipo_pago,tipo_pedido,mesa,mesero,
   observaciones,items,pedido_texto,total,estado,enviado_whatsapp,origen,impreso)
 select r.id,r.cliente,r.cliente_nombre,r.telefono,r.ubicacion,r.tipo_pago,r.tipo_pedido,r.mesa,r.mesero,
   r.observaciones,r.items,r.pedido_texto,r.total,r.estado,r.enviado_whatsapp,null,false
 from jsonb_populate_record(null::public.pedidos,p_pedido) r returning * into v;
 return jsonb_build_object('numero',v.numero_pedido,'total',v.total);
end; $$;
revoke all on function public.kiara_crear_pedido(jsonb) from public,anon,authenticated;
grant execute on function public.kiara_crear_pedido(jsonb) to service_role;
notify pgrst,'reload schema';
commit;
