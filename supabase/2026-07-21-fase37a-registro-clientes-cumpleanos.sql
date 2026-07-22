-- Fase 37A - Registro público de clientes y cumpleaños
-- Ejecutar una sola vez en Supabase SQL Editor antes de publicar la versión 127.8.
--
-- Alcance:
-- 1. Agrega día y mes de cumpleaños a clientes_especiales.
-- 2. Permite que un cliente se registre desde /cliente usando su celular como código.
-- 3. Los registros públicos NO reciben privilegios VIP automáticamente.
-- 4. Conserva la administración y validación de códigos existentes.

create extension if not exists pgcrypto;

create or replace function public.fecha_cumpleanos_cliente_valida(p_mes integer, p_dia integer)
returns boolean
language sql
immutable
as $$
  select case
    when p_mes is null and p_dia is null then true
    when p_mes is null or p_dia is null then false
    when p_mes < 1 or p_mes > 12 then false
    when p_dia < 1 then false
    else p_dia <= extract(day from (make_date(2000, p_mes, 1) + interval '1 month - 1 day'))::integer
  end;
$$;

alter table public.clientes_especiales
  add column if not exists cumple_mes smallint,
  add column if not exists cumple_dia smallint,
  add column if not exists origen_registro text not null default 'administracion';

update public.clientes_especiales
set origen_registro = 'administracion'
where nullif(trim(origen_registro), '') is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_especiales_cumpleanos_chk'
      and conrelid = 'public.clientes_especiales'::regclass
  ) then
    alter table public.clientes_especiales
      add constraint clientes_especiales_cumpleanos_chk
      check (public.fecha_cumpleanos_cliente_valida(cumple_mes, cumple_dia));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'clientes_especiales_origen_registro_chk'
      and conrelid = 'public.clientes_especiales'::regclass
  ) then
    alter table public.clientes_especiales
      add constraint clientes_especiales_origen_registro_chk
      check (origen_registro in ('administracion', 'cliente'));
  end if;
end;
$$;

create index if not exists clientes_especiales_cumpleanos_idx
  on public.clientes_especiales (cumple_mes, cumple_dia)
  where activo = true and cumple_mes is not null and cumple_dia is not null;

-- Reemplaza el trigger de normalización para incluir los nuevos campos.
create or replace function public.set_clientes_especiales_normalizados()
returns trigger
language plpgsql
as $$
begin
  new.codigo = upper(trim(regexp_replace(coalesce(new.codigo, ''), '[[:space:]]+', '', 'g')));
  new.codigo_normalizado = public.normalizar_codigo_cliente_especial(new.codigo);
  new.nombre = trim(regexp_replace(coalesce(new.nombre, ''), '[[:space:]]+', ' ', 'g'));
  new.telefono = nullif(trim(coalesce(new.telefono, '')), '');
  new.ubicacion = nullif(trim(regexp_replace(coalesce(new.ubicacion, ''), '[[:space:]]+', ' ', 'g')), '');
  new.mensaje_bienvenida = nullif(trim(regexp_replace(coalesce(new.mensaje_bienvenida, ''), '[[:space:]]+', ' ', 'g')), '');
  new.observaciones = nullif(trim(regexp_replace(coalesce(new.observaciones, ''), '[[:space:]]+', ' ', 'g')), '');
  new.reglas_json = coalesce(new.reglas_json, '{}'::jsonb);
  new.origen_registro = case when new.origen_registro = 'cliente' then 'cliente' else 'administracion' end;
  new.actualizado_en = now();
  return new;
end;
$$;

-- Amplía la RPC existente para devolver cumpleaños y origen sin exponer la tabla.
create or replace function public.validar_cliente_especial_codigo(p_codigo text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_codigo text := public.normalizar_codigo_cliente_especial(p_codigo);
  v_cliente public.clientes_especiales%rowtype;
begin
  if coalesce(v_codigo, '') = '' then
    return null;
  end if;

  select * into v_cliente
  from public.clientes_especiales
  where codigo_normalizado = v_codigo
    and activo = true
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_cliente.id,
    'codigo', v_cliente.codigo,
    'nombre', v_cliente.nombre,
    'telefono', coalesce(v_cliente.telefono, ''),
    'ubicacion', coalesce(v_cliente.ubicacion, ''),
    'cumple_mes', v_cliente.cumple_mes,
    'cumple_dia', v_cliente.cumple_dia,
    'origen_registro', coalesce(v_cliente.origen_registro, 'administracion'),
    'mensaje_bienvenida', coalesce(v_cliente.mensaje_bienvenida, concat('Bienvenido, ', v_cliente.nombre)),
    'sin_restriccion_acompanantes', coalesce(v_cliente.sin_restriccion_acompanantes, false),
    'habilita_cafeteria', coalesce(v_cliente.habilita_cafeteria, false),
    'permite_modificar_datos', coalesce(v_cliente.permite_modificar_datos, true),
    'reglas_json', coalesce(v_cliente.reglas_json, '{}'::jsonb)
  );
end;
$$;

-- Registro público controlado. El celular se convierte en el código del cliente.
create or replace function public.registrar_cliente_publico(
  p_nombre text,
  p_telefono text,
  p_ubicacion text,
  p_cumple_mes integer,
  p_cumple_dia integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := trim(regexp_replace(coalesce(p_nombre, ''), '[[:space:]]+', ' ', 'g'));
  v_telefono text := regexp_replace(coalesce(p_telefono, ''), '[^0-9]+', '', 'g');
  v_ubicacion text := trim(regexp_replace(coalesce(p_ubicacion, ''), '[[:space:]]+', ' ', 'g'));
  v_cliente public.clientes_especiales%rowtype;
begin
  if left(v_telefono, 2) = '57' and length(v_telefono) = 12 then
    v_telefono := right(v_telefono, 10);
  end if;

  if length(v_nombre) < 2 or length(v_nombre) > 100 then
    return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un nombre válido.');
  end if;

  if length(v_telefono) <> 10 or left(v_telefono, 1) <> '3' then
    return jsonb_build_object('ok', false, 'mensaje', 'Ingresa un celular colombiano válido de 10 dígitos.');
  end if;

  if length(v_ubicacion) < 3 or length(v_ubicacion) > 180 then
    return jsonb_build_object('ok', false, 'mensaje', 'Ingresa una ubicación válida.');
  end if;

  if not public.fecha_cumpleanos_cliente_valida(p_cumple_mes, p_cumple_dia)
     or p_cumple_mes is null
     or p_cumple_dia is null then
    return jsonb_build_object('ok', false, 'mensaje', 'Selecciona un día y mes de cumpleaños válidos.');
  end if;

  if exists (
    select 1
    from public.clientes_especiales
    where codigo_normalizado = public.normalizar_codigo_cliente_especial(v_telefono)
  ) then
    return jsonb_build_object(
      'ok', false,
      'codigo_existente', true,
      'mensaje', 'Este celular ya está registrado. Úsalo como código; si no funciona, comunícate con Rafiki.'
    );
  end if;

  insert into public.clientes_especiales (
    codigo,
    nombre,
    telefono,
    ubicacion,
    cumple_mes,
    cumple_dia,
    origen_registro,
    activo,
    mensaje_bienvenida,
    sin_restriccion_acompanantes,
    habilita_cafeteria,
    permite_modificar_datos,
    reglas_json,
    observaciones
  ) values (
    v_telefono,
    v_nombre,
    v_telefono,
    v_ubicacion,
    p_cumple_mes,
    p_cumple_dia,
    'cliente',
    true,
    concat('Bienvenido, ', v_nombre),
    false,
    false,
    true,
    '{"promociones": false, "regalo": null, "descuento": null, "prioridad": "normal"}'::jsonb,
    'Registro realizado por el cliente desde /cliente.'
  )
  returning * into v_cliente;

  return jsonb_build_object(
    'ok', true,
    'mensaje', 'Registro completado. Tu celular será tu código de cliente.',
    'cliente', jsonb_build_object(
      'id', v_cliente.id,
      'codigo', v_cliente.codigo,
      'nombre', v_cliente.nombre,
      'telefono', coalesce(v_cliente.telefono, ''),
      'ubicacion', coalesce(v_cliente.ubicacion, ''),
      'cumple_mes', v_cliente.cumple_mes,
      'cumple_dia', v_cliente.cumple_dia,
      'origen_registro', v_cliente.origen_registro,
      'mensaje_bienvenida', v_cliente.mensaje_bienvenida,
      'sin_restriccion_acompanantes', false,
      'habilita_cafeteria', false,
      'permite_modificar_datos', true,
      'reglas_json', v_cliente.reglas_json
    )
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'codigo_existente', true,
      'mensaje', 'Este celular ya está registrado. Úsalo como código; si no funciona, comunícate con Rafiki.'
    );
end;
$$;

revoke all on function public.registrar_cliente_publico(text, text, text, integer, integer) from public;
grant execute on function public.registrar_cliente_publico(text, text, text, integer, integer) to anon, authenticated;
grant execute on function public.validar_cliente_especial_codigo(text) to anon, authenticated;

comment on column public.clientes_especiales.cumple_mes is 'Mes de cumpleaños, sin almacenar el año de nacimiento.';
comment on column public.clientes_especiales.cumple_dia is 'Día de cumpleaños, sin almacenar el año de nacimiento.';
comment on column public.clientes_especiales.origen_registro is 'administracion o cliente, según el origen del registro.';
comment on function public.registrar_cliente_publico(text, text, text, integer, integer) is 'Registra desde /cliente usando el celular como código, sin otorgar privilegios VIP automáticos.';
