-- Fase 38E - Edición y unificación segura de clientes de cartera.
-- Ejecutar una sola vez en Supabase SQL Editor antes de usar "Unificar con otro cliente".

create or replace function public.unificar_clientes_credito(
  p_cliente_origen_id uuid,
  p_cliente_destino_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_origen public.clientes_credito%rowtype;
  v_destino public.clientes_credito%rowtype;
  v_total_pedidos integer := 0;
  v_saldo numeric := 0;
  v_ultima_fecha timestamptz;
  v_alias text[];
begin
  if p_cliente_origen_id is null or p_cliente_destino_id is null then
    raise exception 'Debes seleccionar los dos clientes.';
  end if;
  if p_cliente_origen_id = p_cliente_destino_id then
    raise exception 'El cliente duplicado y el cliente principal deben ser diferentes.';
  end if;

  select * into v_origen from public.clientes_credito
  where id = p_cliente_origen_id for update;
  select * into v_destino from public.clientes_credito
  where id = p_cliente_destino_id for update;

  if not found or v_origen.id is null or v_destino.id is null then
    raise exception 'No se encontró uno de los clientes seleccionados.';
  end if;
  if v_destino.activo = false then
    raise exception 'El cliente principal debe estar activo.';
  end if;

  select array(
    select distinct trim(valor)
    from unnest(
      coalesce(v_destino.alias, '{}'::text[])
      || coalesce(v_origen.alias, '{}'::text[])
      || array[v_origen.nombre]
    ) as valor
    where trim(coalesce(valor, '')) <> ''
      and public.normalizar_nombre_credito(valor) <> public.normalizar_nombre_credito(v_destino.nombre)
  ) into v_alias;

  update public.cartera_movimientos
  set cliente_credito_id = v_destino.id,
      cliente_nombre = v_destino.nombre
  where cliente_credito_id = v_origen.id;

  update public.cartera_abonos
  set cliente_credito_id = v_destino.id,
      cliente_nombre = v_destino.nombre
  where cliente_credito_id = v_origen.id;

  -- Mantiene coherentes todos los pedidos históricos del cliente, incluidos los que
  -- aparecen en Pedidos Hoy, historiales, informes y exportaciones generales.
  update public.pedidos p
  set cliente_nombre = v_destino.nombre,
      cliente = v_destino.nombre
  where public.normalizar_nombre_credito(coalesce(nullif(p.cliente_nombre, ''), p.cliente, ''))
        = public.normalizar_nombre_credito(v_origen.nombre)
     or p.id::text in (
       select cm.pedido_id
       from public.cartera_movimientos cm
       where cm.cliente_credito_id = v_destino.id
         and cm.pedido_id is not null
     );

  select
    count(*) filter (where coalesce(estado, '') <> 'anulado'),
    coalesce(sum(
      case when coalesce(estado, '') = 'pendiente'
        then greatest(0, coalesce(saldo_movimiento, valor, 0))
        else 0 end
    ), 0),
    max(fecha_movimiento) filter (where coalesce(estado, '') <> 'anulado')
  into v_total_pedidos, v_saldo, v_ultima_fecha
  from public.cartera_movimientos
  where cliente_credito_id = v_destino.id;

  update public.clientes_credito
  set alias = coalesce(v_alias, '{}'::text[]),
      telefono = case
        when trim(coalesce(v_destino.telefono, '')) = '' then coalesce(v_origen.telefono, '')
        else v_destino.telefono end,
      observaciones = trim(concat_ws(' · ',
        nullif(trim(coalesce(v_destino.observaciones, '')), ''),
        nullif(trim(coalesce(v_origen.observaciones, '')), ''),
        concat('Cliente unificado: ', v_origen.nombre)
      )),
      total_pedidos = v_total_pedidos,
      saldo_pendiente = round(v_saldo),
      fecha_ultimo_pedido = v_ultima_fecha,
      actualizado_en = now()
  where id = v_destino.id;

  delete from public.clientes_credito where id = v_origen.id;

  return jsonb_build_object(
    'ok', true,
    'cliente_origen', v_origen.nombre,
    'cliente_destino_id', v_destino.id,
    'cliente_destino', v_destino.nombre,
    'total_pedidos', v_total_pedidos,
    'saldo_pendiente', round(v_saldo)
  );
end;
$$;

revoke all on function public.unificar_clientes_credito(uuid, uuid) from public;
grant execute on function public.unificar_clientes_credito(uuid, uuid) to anon, authenticated;

comment on function public.unificar_clientes_credito(uuid, uuid) is
  'Unifica transaccionalmente dos clientes de cartera, conserva alias y traslada pedidos, movimientos y abonos al cliente principal.';
