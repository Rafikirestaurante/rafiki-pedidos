-- Fase 39 / versión 128.0
-- 1) Meseros administrables desde Gerencia -> Ajustes.
-- 2) Abonos de cartera editables/anulables como pago lógico completo.
-- 3) Reaplicación FIFO transaccional y trazabilidad de cambios.
-- Ejecutar DESPUÉS de los SQL de Fase 33 y Fase 38E, antes de publicar 128.0.

begin;

-- ============================================================
-- A. MESEROS ADMINISTRABLES
-- ============================================================
create table if not exists public.meseros (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nombre text not null,
  activo boolean not null default true,
  orden integer not null default 0
);

create unique index if not exists meseros_nombre_normalizado_uidx
  on public.meseros (lower(regexp_replace(trim(nombre), '\\s+', ' ', 'g')));

create index if not exists meseros_activo_orden_idx
  on public.meseros (activo, orden, nombre);

insert into public.meseros (nombre, activo, orden)
select datos.nombre, true, datos.orden
from (values
  ('Rafa', 1),
  ('Ara', 2),
  ('Pao', 3),
  ('Jesús', 4)
) as datos(nombre, orden)
where not exists (
  select 1
  from public.meseros m
  where lower(regexp_replace(trim(m.nombre), '\\s+', ' ', 'g')) = lower(regexp_replace(trim(datos.nombre), '\\s+', ' ', 'g'))
);

create or replace function public.actualizar_timestamp_meseros()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists meseros_actualizar_timestamp on public.meseros;
create trigger meseros_actualizar_timestamp
before update on public.meseros
for each row execute function public.actualizar_timestamp_meseros();

alter table public.meseros enable row level security;

drop policy if exists "meseros_select" on public.meseros;
create policy "meseros_select" on public.meseros
for select to anon, authenticated using (true);

drop policy if exists "meseros_insert" on public.meseros;
create policy "meseros_insert" on public.meseros
for insert to anon, authenticated with check (true);

drop policy if exists "meseros_update" on public.meseros;
create policy "meseros_update" on public.meseros
for update to anon, authenticated using (true) with check (true);

grant select, insert, update on public.meseros to anon, authenticated;

-- ============================================================
-- B. MODELO DE PAGO LÓGICO PARA CARTERA
-- ============================================================
-- cartera_abonos conserva las aplicaciones FIFO por pedido.
-- cartera_pagos representa el pago completo que ve el usuario.

alter table public.cartera_abonos
  add column if not exists pago_id uuid,
  add column if not exists vigente boolean not null default true,
  add column if not exists reemplazado_en timestamptz,
  add column if not exists motivo_reemplazo text;

-- Backfill determinístico: las filas que históricamente formaban un mismo abono
-- ya compartían cliente + created_at + fecha + método + observación.
update public.cartera_abonos ca
set pago_id = (
  substr(md5(concat_ws('|',
    coalesce(ca.cliente_credito_id::text, ''),
    coalesce(ca.created_at::text, ''),
    coalesce(ca.fecha_abono::text, ''),
    coalesce(ca.metodo_pago, ''),
    coalesce(ca.observacion, '')
  )), 1, 8) || '-' ||
  substr(md5(concat_ws('|',
    coalesce(ca.cliente_credito_id::text, ''),
    coalesce(ca.created_at::text, ''),
    coalesce(ca.fecha_abono::text, ''),
    coalesce(ca.metodo_pago, ''),
    coalesce(ca.observacion, '')
  )), 9, 4) || '-' ||
  substr(md5(concat_ws('|',
    coalesce(ca.cliente_credito_id::text, ''),
    coalesce(ca.created_at::text, ''),
    coalesce(ca.fecha_abono::text, ''),
    coalesce(ca.metodo_pago, ''),
    coalesce(ca.observacion, '')
  )), 13, 4) || '-' ||
  substr(md5(concat_ws('|',
    coalesce(ca.cliente_credito_id::text, ''),
    coalesce(ca.created_at::text, ''),
    coalesce(ca.fecha_abono::text, ''),
    coalesce(ca.metodo_pago, ''),
    coalesce(ca.observacion, '')
  )), 17, 4) || '-' ||
  substr(md5(concat_ws('|',
    coalesce(ca.cliente_credito_id::text, ''),
    coalesce(ca.created_at::text, ''),
    coalesce(ca.fecha_abono::text, ''),
    coalesce(ca.metodo_pago, ''),
    coalesce(ca.observacion, '')
  )), 21, 12)
)::uuid
where ca.pago_id is null;

create table if not exists public.cartera_pagos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cliente_credito_id uuid references public.clientes_credito(id) on delete restrict,
  cliente_nombre text,
  valor_abono numeric(14,2) not null,
  metodo_pago text not null default 'Efectivo',
  observacion text,
  fecha_abono timestamptz not null default now(),
  estado text not null default 'activo',
  anulado_at timestamptz,
  motivo_anulacion text,
  constraint cartera_pagos_valor_positivo_chk check (valor_abono > 0),
  constraint cartera_pagos_estado_chk check (estado in ('activo', 'anulado'))
);

insert into public.cartera_pagos (
  id, created_at, updated_at, cliente_credito_id, cliente_nombre,
  valor_abono, metodo_pago, observacion, fecha_abono, estado
)
select
  ca.pago_id,
  min(ca.created_at),
  min(ca.created_at),
  ca.cliente_credito_id,
  max(ca.cliente_nombre),
  sum(round(coalesce(ca.valor_abono, 0))),
  max(ca.metodo_pago),
  max(ca.observacion),
  max(ca.fecha_abono),
  'activo'
from public.cartera_abonos ca
where ca.pago_id is not null
  and ca.vigente = true
group by ca.pago_id, ca.cliente_credito_id
on conflict (id) do nothing;

alter table public.cartera_abonos
  alter column pago_id set not null;

create index if not exists cartera_abonos_pago_vigente_idx
  on public.cartera_abonos (pago_id, vigente);

create index if not exists cartera_pagos_cliente_fecha_idx
  on public.cartera_pagos (cliente_credito_id, estado, fecha_abono, created_at);

-- Auditoría del pago lógico: conserva antes/después aunque el usuario lo "elimine".
create table if not exists public.cartera_pagos_auditoria (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  pago_id uuid,
  cliente_credito_id uuid,
  accion text not null,
  datos_anteriores jsonb,
  datos_nuevos jsonb
);

create index if not exists cartera_pagos_auditoria_pago_idx
  on public.cartera_pagos_auditoria (pago_id, created_at desc);

create or replace function public.auditar_cartera_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_accion text;
begin
  if tg_op = 'INSERT' then
    v_accion := 'registrado';
    insert into public.cartera_pagos_auditoria(pago_id, cliente_credito_id, accion, datos_nuevos)
    values (new.id, new.cliente_credito_id, v_accion, to_jsonb(new));
    return new;
  end if;

  v_accion := case
    when old.estado <> new.estado and new.estado = 'anulado' then 'anulado'
    else 'editado'
  end;

  insert into public.cartera_pagos_auditoria(
    pago_id, cliente_credito_id, accion, datos_anteriores, datos_nuevos
  ) values (
    new.id, new.cliente_credito_id, v_accion, to_jsonb(old), to_jsonb(new)
  );
  return new;
end;
$$;

drop trigger if exists cartera_pagos_auditoria_trigger on public.cartera_pagos;
create trigger cartera_pagos_auditoria_trigger
after insert or update on public.cartera_pagos
for each row execute function public.auditar_cartera_pago();

alter table public.cartera_pagos enable row level security;
alter table public.cartera_pagos_auditoria enable row level security;

drop policy if exists "cartera_pagos_select" on public.cartera_pagos;
create policy "cartera_pagos_select" on public.cartera_pagos
for select to anon, authenticated using (true);

drop policy if exists "cartera_pagos_auditoria_select" on public.cartera_pagos_auditoria;
create policy "cartera_pagos_auditoria_select" on public.cartera_pagos_auditoria
for select to anon, authenticated using (true);

grant select on public.cartera_pagos to anon, authenticated;
grant select on public.cartera_pagos_auditoria to anon, authenticated;

-- ============================================================
-- C. RECONSTRUCCIÓN FIFO TRANSACCIONAL
-- ============================================================
create or replace function public.recalcular_aplicaciones_cartera_cliente(
  p_cliente_id uuid,
  p_motivo text default 'Recalculo FIFO de cartera'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente public.clientes_credito%rowtype;
  v_pago public.cartera_pagos%rowtype;
  v_mov public.cartera_movimientos%rowtype;
  v_total_credito integer := 0;
  v_total_pagos integer := 0;
  v_restante integer;
  v_saldo_anterior integer;
  v_valor_aplicado integer;
  v_saldo_nuevo integer;
  v_estado_nuevo text;
  v_aplicaciones integer := 0;
begin
  if p_cliente_id is null then
    raise exception 'Cliente crédito no válido.';
  end if;

  select * into v_cliente
  from public.clientes_credito
  where id = p_cliente_id
  for update;

  if not found then
    raise exception 'Cliente crédito no encontrado.';
  end if;

  -- Bloquea los movimientos que serán recalculados.
  perform 1
  from public.cartera_movimientos
  where cliente_credito_id = p_cliente_id
    and tipo_movimiento = 'pedido_credito'
  for update;

  select coalesce(sum(round(coalesce(valor, 0))::integer), 0)
  into v_total_credito
  from public.cartera_movimientos
  where cliente_credito_id = p_cliente_id
    and tipo_movimiento = 'pedido_credito'
    and lower(coalesce(estado, 'pendiente')) <> 'anulado';

  select coalesce(sum(round(coalesce(valor_abono, 0))::integer), 0)
  into v_total_pagos
  from public.cartera_pagos
  where cliente_credito_id = p_cliente_id
    and estado = 'activo';

  if v_total_pagos > v_total_credito then
    raise exception 'Los abonos activos (%) superan el total de pedidos a crédito (%). Revisa el valor del abono.', v_total_pagos, v_total_credito;
  end if;

  -- Conserva las aplicaciones anteriores como historial, pero deja una sola versión vigente.
  update public.cartera_abonos
  set vigente = false,
      reemplazado_en = now(),
      motivo_reemplazo = nullif(trim(coalesce(p_motivo, '')), '')
  where cliente_credito_id = p_cliente_id
    and vigente = true;

  -- Restablece el saldo base de cada pedido no anulado antes de reaplicar todos los pagos.
  update public.cartera_movimientos
  set saldo_movimiento = round(coalesce(valor, 0)),
      estado = case
        when round(coalesce(valor, 0)) <= 0 then 'pagado'
        else 'pendiente'
      end
  where cliente_credito_id = p_cliente_id
    and tipo_movimiento = 'pedido_credito'
    and lower(coalesce(estado, 'pendiente')) <> 'anulado';

  for v_pago in
    select *
    from public.cartera_pagos
    where cliente_credito_id = p_cliente_id
      and estado = 'activo'
    order by fecha_abono asc, created_at asc, id asc
  loop
    v_restante := round(coalesce(v_pago.valor_abono, 0))::integer;

    for v_mov in
      select *
      from public.cartera_movimientos
      where cliente_credito_id = p_cliente_id
        and tipo_movimiento = 'pedido_credito'
        and lower(coalesce(estado, 'pendiente')) <> 'anulado'
        and round(coalesce(saldo_movimiento, valor, 0)) > 0
      order by fecha_movimiento asc, created_at asc, id asc
      for update
    loop
      exit when v_restante <= 0;

      v_saldo_anterior := round(coalesce(v_mov.saldo_movimiento, v_mov.valor, 0))::integer;
      v_valor_aplicado := least(v_restante, v_saldo_anterior);
      v_saldo_nuevo := greatest(0, v_saldo_anterior - v_valor_aplicado);
      v_estado_nuevo := case when v_saldo_nuevo <= 0 then 'pagado' else 'parcial' end;

      update public.cartera_movimientos
      set saldo_movimiento = v_saldo_nuevo,
          estado = v_estado_nuevo
      where id = v_mov.id;

      insert into public.cartera_abonos (
        created_at,
        cliente_credito_id,
        cartera_movimiento_id,
        pedido_id,
        numero_pedido,
        cliente_nombre,
        valor_abono,
        metodo_pago,
        observacion,
        fecha_abono,
        saldo_anterior,
        saldo_nuevo,
        pago_id,
        vigente,
        reemplazado_en,
        motivo_reemplazo
      ) values (
        v_pago.created_at,
        p_cliente_id,
        v_mov.id,
        v_mov.pedido_id,
        v_mov.numero_pedido,
        coalesce(v_pago.cliente_nombre, v_cliente.nombre),
        v_valor_aplicado,
        v_pago.metodo_pago,
        v_pago.observacion,
        v_pago.fecha_abono,
        v_saldo_anterior,
        v_saldo_nuevo,
        v_pago.id,
        true,
        null,
        null
      );

      v_aplicaciones := v_aplicaciones + 1;
      v_restante := v_restante - v_valor_aplicado;
    end loop;

    if v_restante > 0 then
      raise exception 'No fue posible aplicar completamente el abono %. Quedó un valor sin asignar de %.', v_pago.id, v_restante;
    end if;
  end loop;

  update public.clientes_credito c
  set
    total_pedidos = coalesce(resumen.total_pedidos, 0),
    saldo_pendiente = coalesce(resumen.saldo_pendiente, 0),
    fecha_ultimo_pedido = resumen.fecha_ultimo_pedido,
    actualizado_en = now()
  from (
    select
      count(*) filter (where lower(coalesce(estado, 'pendiente')) <> 'anulado')::integer as total_pedidos,
      coalesce(sum(
        case
          when lower(coalesce(estado, 'pendiente')) = 'anulado' then 0
          else round(coalesce(saldo_movimiento, valor, 0))
        end
      ), 0) as saldo_pendiente,
      max(fecha_movimiento) filter (where lower(coalesce(estado, 'pendiente')) <> 'anulado') as fecha_ultimo_pedido
    from public.cartera_movimientos
    where cliente_credito_id = p_cliente_id
      and tipo_movimiento = 'pedido_credito'
  ) resumen
  where c.id = p_cliente_id
  returning c.* into v_cliente;

  return jsonb_build_object(
    'ok', true,
    'cliente_id', p_cliente_id,
    'total_credito', v_total_credito,
    'total_abonado', v_total_pagos,
    'saldo_pendiente', greatest(0, v_total_credito - v_total_pagos),
    'aplicaciones_vigentes', v_aplicaciones,
    'cliente', to_jsonb(v_cliente)
  );
end;
$$;

-- ============================================================
-- D. REGISTRAR / EDITAR / ANULAR ABONOS LÓGICOS
-- ============================================================
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

  select coalesce(sum(round(coalesce(saldo_movimiento, valor, 0))::integer), 0)
  into v_saldo_total
  from public.cartera_movimientos
  where cliente_credito_id = p_cliente_id
    and tipo_movimiento = 'pedido_credito'
    and lower(coalesce(estado, 'pendiente')) <> 'anulado'
    and round(coalesce(saldo_movimiento, valor, 0)) > 0;

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
    'abonos', coalesce((
      select jsonb_agg(to_jsonb(ca) order by ca.numero_pedido nulls last, ca.id)
      from public.cartera_abonos ca
      where ca.pago_id = v_pago.id and ca.vigente = true
    ), '[]'::jsonb),
    'saldo_anterior_total', v_saldo_total,
    'saldo_nuevo_total', greatest(0, v_saldo_total - v_valor),
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

revoke all on function public.recalcular_aplicaciones_cartera_cliente(uuid, text) from public;
revoke all on function public.registrar_abono_cliente_credito(uuid, numeric, text, text, timestamptz) from public;
revoke all on function public.editar_abono_cliente_credito(uuid, numeric, text, text, timestamptz) from public;
revoke all on function public.anular_abono_cliente_credito(uuid, text) from public;

grant execute on function public.registrar_abono_cliente_credito(uuid, numeric, text, text, timestamptz) to anon, authenticated;
grant execute on function public.editar_abono_cliente_credito(uuid, numeric, text, text, timestamptz) to anon, authenticated;
grant execute on function public.anular_abono_cliente_credito(uuid, text) to anon, authenticated;

-- ============================================================
-- E. COMPATIBILIDAD CON UNIFICACIÓN DE CLIENTES DE FASE 38E
-- ============================================================
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
  v_alias text[];
  v_resultado jsonb;
begin
  if p_cliente_origen_id is null or p_cliente_destino_id is null then
    raise exception 'Debes seleccionar los dos clientes.';
  end if;
  if p_cliente_origen_id = p_cliente_destino_id then
    raise exception 'El cliente duplicado y el cliente principal deben ser diferentes.';
  end if;

  select * into v_origen from public.clientes_credito where id = p_cliente_origen_id for update;
  if not found then raise exception 'No se encontró el cliente que se unificará.'; end if;

  select * into v_destino from public.clientes_credito where id = p_cliente_destino_id for update;
  if not found then raise exception 'No se encontró el cliente principal.'; end if;
  if v_destino.activo = false then raise exception 'El cliente principal debe estar activo.'; end if;

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

  update public.cartera_pagos
  set cliente_credito_id = v_destino.id,
      cliente_nombre = v_destino.nombre,
      updated_at = now()
  where cliente_credito_id = v_origen.id;

  update public.cartera_abonos
  set cliente_credito_id = v_destino.id,
      cliente_nombre = v_destino.nombre
  where cliente_credito_id = v_origen.id;

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

  update public.clientes_credito
  set alias = coalesce(v_alias, '{}'::text[]),
      telefono = case when trim(coalesce(v_destino.telefono, '')) = '' then coalesce(v_origen.telefono, '') else v_destino.telefono end,
      observaciones = trim(concat_ws(' · ',
        nullif(trim(coalesce(v_destino.observaciones, '')), ''),
        nullif(trim(coalesce(v_origen.observaciones, '')), ''),
        concat('Cliente unificado: ', v_origen.nombre)
      )),
      actualizado_en = now()
  where id = v_destino.id;

  -- El origen ya no tiene movimientos ni pagos; puede eliminarse sin perder historial.
  delete from public.clientes_credito where id = v_origen.id;

  v_resultado := public.recalcular_aplicaciones_cartera_cliente(v_destino.id, concat('Unificación de cliente ', v_origen.nombre));

  return jsonb_build_object(
    'ok', true,
    'cliente_origen', v_origen.nombre,
    'cliente_destino_id', v_destino.id,
    'cliente_destino', v_destino.nombre,
    'saldo_pendiente', coalesce((v_resultado->>'saldo_pendiente')::numeric, 0),
    'recalculo', v_resultado
  );
end;
$$;

revoke all on function public.unificar_clientes_credito(uuid, uuid) from public;
grant execute on function public.unificar_clientes_credito(uuid, uuid) to anon, authenticated;

comment on function public.editar_abono_cliente_credito(uuid, numeric, text, text, timestamptz) is
  'Edita el pago lógico completo y reconstruye todas sus aplicaciones FIFO sin perder auditoría.';
comment on function public.anular_abono_cliente_credito(uuid, text) is
  'Anula lógicamente un abono, conserva su auditoría y reconstruye la cartera del cliente.';

commit;
