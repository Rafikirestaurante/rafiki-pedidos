-- Fase 44. Ejecutar DESPUÉS del SQL de Fase 39. No elimina compras ni pagos.
begin;

create or replace function public.recalcular_libro_cartera_cliente(p_cliente_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cliente public.clientes_credito%rowtype;
  v_compras numeric := 0;
  v_abonos numeric := 0;
  v_cantidad integer := 0;
  v_fecha timestamptz;
begin
  select * into v_cliente from public.clientes_credito where id = p_cliente_id for update;
  if not found then raise exception 'Cliente crédito no encontrado.'; end if;
  select coalesce(sum(round(valor)), 0), count(*)::integer, max(fecha_movimiento)
    into v_compras, v_cantidad, v_fecha
    from public.cartera_movimientos
    where cliente_credito_id = p_cliente_id and tipo_movimiento = 'pedido_credito'
      and lower(coalesce(estado, 'pendiente')) <> 'anulado';
  select coalesce(sum(round(valor_abono)), 0) into v_abonos
    from public.cartera_pagos where cliente_credito_id = p_cliente_id and estado = 'activo';
  update public.clientes_credito set saldo_pendiente = v_compras - v_abonos,
    total_pedidos = v_cantidad, fecha_ultimo_pedido = v_fecha, actualizado_en = now()
    where id = p_cliente_id returning * into v_cliente;
  return jsonb_build_object('ok', true, 'cliente', to_jsonb(v_cliente),
    'total_credito', v_compras, 'total_abonado', v_abonos, 'saldo_pendiente', v_compras - v_abonos);
end;
$$;

-- Compatibilidad con las RPC de edición, anulación y unificación existentes.
-- Esta función ya NO reparte pagos ni modifica pedidos.
create or replace function public.recalcular_aplicaciones_cartera_cliente(
  p_cliente_id uuid, p_motivo text default 'Recalculo FIFO de cartera'
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return public.recalcular_libro_cartera_cliente(p_cliente_id);
end;
$$;

-- Archivar las aplicaciones antiguas sin borrar su trazabilidad.
update public.cartera_abonos set vigente = false, reemplazado_en = now(),
  motivo_reemplazo = 'Fase 44: abono independiente en el libro diario'
  where vigente = true;
-- El valor del pedido permanece íntegro. Su estado de pago ya no se utiliza.
update public.cartera_movimientos set saldo_movimiento = round(valor), estado = 'pendiente'
  where tipo_movimiento = 'pedido_credito' and lower(coalesce(estado, 'pendiente')) <> 'anulado';

create or replace function public.actualizar_libro_cartera_desde_compra()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP <> 'INSERT' and old.cliente_credito_id is not null then
    perform public.recalcular_libro_cartera_cliente(old.cliente_credito_id);
  end if;
  if TG_OP <> 'DELETE' and new.cliente_credito_id is not null then
    if TG_OP = 'INSERT' then
      perform public.recalcular_libro_cartera_cliente(new.cliente_credito_id);
    elsif new.cliente_credito_id is distinct from old.cliente_credito_id then
      perform public.recalcular_libro_cartera_cliente(new.cliente_credito_id);
    end if;
  end if;
  return null;
end;
$$;
drop trigger if exists cartera_libro_compra on public.cartera_movimientos;
create trigger cartera_libro_compra after insert or update or delete on public.cartera_movimientos
for each row execute function public.actualizar_libro_cartera_desde_compra();

revoke all on function public.recalcular_libro_cartera_cliente(uuid) from public;
grant execute on function public.recalcular_libro_cartera_cliente(uuid) to anon, authenticated;
revoke all on function public.actualizar_libro_cartera_desde_compra() from public;

create or replace function public.registrar_abono_cliente_credito(
  p_cliente_id uuid,
  p_valor_abono numeric,
  p_metodo_pago text default 'Efectivo',
  p_observacion text default '',
  p_fecha_abono timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes_credito%rowtype;
  v_pago public.cartera_pagos%rowtype;
  v_valor integer := round(coalesce(p_valor_abono, 0))::integer;
  v_metodo text;
  v_saldo_total integer := 0;
  v_resultado jsonb;
begin
  if p_cliente_id is null then raise exception 'Cliente crédito no válido.'; end if;

  select * into v_cliente from public.clientes_credito where id = p_cliente_id for update;
  if not found then raise exception 'Cliente crédito no encontrado.'; end if;
  if v_valor <= 0 then raise exception 'El valor del abono debe ser mayor a cero.'; end if;

  v_metodo := public.normalizar_metodo_pago_cartera(p_metodo_pago, false);
  if v_metodo is null then
    raise exception 'Método de pago no permitido para abonos de cartera: %', coalesce(p_metodo_pago, '');
  end if;

  v_resultado := public.recalcular_libro_cartera_cliente(p_cliente_id);
  v_saldo_total := (v_resultado->>'saldo_pendiente')::integer;

  if v_saldo_total <= 0 then raise exception 'Este cliente no tiene cartera pendiente para abonar.'; end if;
  if v_valor > v_saldo_total then raise exception 'El abono no puede ser mayor al saldo pendiente del cliente.'; end if;

  insert into public.cartera_pagos (
    cliente_credito_id, cliente_nombre, valor_abono, metodo_pago, observacion, fecha_abono, estado
  ) values (
    p_cliente_id, v_cliente.nombre, v_valor, v_metodo, trim(coalesce(p_observacion, '')), coalesce(p_fecha_abono, now()), 'activo'
  ) returning * into v_pago;

  v_resultado := public.recalcular_aplicaciones_cartera_cliente(p_cliente_id, 'Registro de nuevo abono');

  return jsonb_build_object(
    'ok', true,
    'pago_id', v_pago.id,
    'valor_abono', v_valor,
    'pago', to_jsonb(v_pago),
    'abonos', '[]'::jsonb,
    'saldo_anterior_total', v_saldo_total,
    'saldo_nuevo_total', v_saldo_total - v_valor,
    'recalculo', v_resultado
  );
end;
$$;

create or replace function public.editar_abono_cliente_credito(
  p_pago_id uuid,
  p_valor_abono numeric,
  p_metodo_pago text,
  p_observacion text default '',
  p_fecha_abono timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.cartera_pagos%rowtype;
  v_cliente public.clientes_credito%rowtype;
  v_valor integer := round(coalesce(p_valor_abono, 0))::integer;
  v_metodo text;
  v_total_credito integer := 0;
  v_otros_pagos integer := 0;
  v_resultado jsonb;
begin
  if p_pago_id is null then raise exception 'Abono no válido.'; end if;

  select * into v_pago from public.cartera_pagos where id = p_pago_id for update;
  if not found then raise exception 'No se encontró el abono seleccionado.'; end if;
  if v_pago.estado <> 'activo' then raise exception 'Este abono ya está anulado y no puede editarse.'; end if;
  if v_valor <= 0 then raise exception 'El valor del abono debe ser mayor a cero.'; end if;

  select * into v_cliente from public.clientes_credito where id = v_pago.cliente_credito_id for update;
  if not found then raise exception 'Cliente crédito no encontrado.'; end if;

  v_metodo := public.normalizar_metodo_pago_cartera(p_metodo_pago, false);
  if v_metodo is null then
    raise exception 'Método de pago no permitido para abonos de cartera: %', coalesce(p_metodo_pago, '');
  end if;

  select coalesce(sum(round(coalesce(valor, 0))::integer), 0)
  into v_total_credito
  from public.cartera_movimientos
  where cliente_credito_id = v_pago.cliente_credito_id
    and tipo_movimiento = 'pedido_credito'
    and lower(coalesce(estado, 'pendiente')) <> 'anulado';

  select coalesce(sum(round(coalesce(valor_abono, 0))::integer), 0)
  into v_otros_pagos
  from public.cartera_pagos
  where cliente_credito_id = v_pago.cliente_credito_id
    and estado = 'activo'
    and id <> p_pago_id;

  if v_otros_pagos + v_valor > v_total_credito then
    raise exception 'El nuevo valor del abono excede la cartera disponible. Máximo permitido para este abono: %.', greatest(0, v_total_credito - v_otros_pagos);
  end if;

  update public.cartera_pagos
  set valor_abono = v_valor,
      metodo_pago = v_metodo,
      observacion = trim(coalesce(p_observacion, '')),
      fecha_abono = coalesce(p_fecha_abono, fecha_abono),
      cliente_nombre = v_cliente.nombre,
      updated_at = now()
  where id = p_pago_id
  returning * into v_pago;

  v_resultado := public.recalcular_aplicaciones_cartera_cliente(v_pago.cliente_credito_id, concat('Edición de abono ', p_pago_id));

  return jsonb_build_object(
    'ok', true,
    'pago', to_jsonb(v_pago),
    'recalculo', v_resultado
  );
end;
$$;

create or replace function public.anular_abono_cliente_credito(
  p_pago_id uuid,
  p_motivo text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pago public.cartera_pagos%rowtype;
  v_resultado jsonb;
begin
  if p_pago_id is null then raise exception 'Abono no válido.'; end if;

  select * into v_pago from public.cartera_pagos where id = p_pago_id for update;
  if not found then raise exception 'No se encontró el abono seleccionado.'; end if;
  if v_pago.estado <> 'activo' then raise exception 'Este abono ya fue anulado.'; end if;

  update public.cartera_pagos
  set estado = 'anulado',
      anulado_at = now(),
      motivo_anulacion = nullif(trim(coalesce(p_motivo, '')), ''),
      updated_at = now()
  where id = p_pago_id
  returning * into v_pago;

  v_resultado := public.recalcular_aplicaciones_cartera_cliente(v_pago.cliente_credito_id, concat('Anulación de abono ', p_pago_id));

  return jsonb_build_object(
    'ok', true,
    'pago', to_jsonb(v_pago),
    'recalculo', v_resultado
  );
end;
$$;


do $$ declare v_id uuid; begin
  for v_id in select id from public.clientes_credito loop
    perform public.recalcular_libro_cartera_cliente(v_id);
  end loop;
end; $$;
notify pgrst, 'reload schema';
commit;
