begin;
create table if not exists public.pedido_cambios_mesa (
 id uuid primary key default gen_random_uuid(), pedido_id text not null,
 mesa_anterior text, mesa_nueva text not null, usuario_id uuid not null,
 usuario_email text, created_at timestamptz not null default now()
);
alter table public.pedido_cambios_mesa enable row level security;
grant select on public.pedido_cambios_mesa to authenticated;
drop policy if exists cambios_mesa_lectura on public.pedido_cambios_mesa;
create policy cambios_mesa_lectura on public.pedido_cambios_mesa for select to authenticated using (true);
create or replace function public.cambiar_mesa_pedido(p_pedido_id text,p_mesa_anterior text,p_mesa_nueva text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_pedido public.pedidos%rowtype; v_anterior text;
begin
 if auth.uid() is null or not exists (
  select 1 from public.usuarios_roles where coalesce(activo,true)
   and (user_id=auth.uid() or lower(email)=lower(auth.jwt()->>'email'))
 ) then raise exception 'Inicia sesión con una cuenta activa para cambiar la mesa.'; end if;
 if p_mesa_nueva is null or p_mesa_nueva not in ('1A','1B','2A','2B','3A','3B','4A','4B','5B') then raise exception 'Mesa no válida.'; end if;
 select * into v_pedido from public.pedidos where id::text=p_pedido_id for update;
 if not found then raise exception 'Pedido no encontrado.'; end if;
 if lower(coalesce(v_pedido.estado,'')) in ('borrado','anulado','cancelado') then raise exception 'No se puede cambiar la mesa de un pedido borrado o anulado.'; end if;
 if lower(coalesce(v_pedido.tipo_pedido,''))='llevar' then raise exception 'Esta opción solo cambia mesas; no convierte pedidos para llevar.'; end if;
 v_anterior:=coalesce(v_pedido.mesa,'');
 -- Un reintento de una operación ya realizada no duplica la auditoría.
 if v_anterior=p_mesa_nueva then return to_jsonb(v_pedido); end if;
 if v_anterior<>coalesce(p_mesa_anterior,'') then raise exception 'La mesa cambió en otro dispositivo. Actualiza los pedidos e inténtalo nuevamente.'; end if;
 update public.pedidos set mesa=p_mesa_nueva,ubicacion=p_mesa_nueva,
  cliente=case when cliente=v_anterior and v_anterior<>'' then p_mesa_nueva else cliente end,
  cliente_nombre=case when cliente_nombre=v_anterior and v_anterior<>'' then p_mesa_nueva else cliente_nombre end
 where id::text=p_pedido_id returning * into v_pedido;
 -- Las comandas pendientes deben salir con la nueva ubicación; las ya impresas
 -- y el historial de quién tomó cada adición se conservan.
 update public.pedido_adiciones set payload_impresion=payload_impresion||jsonb_build_object('mesa',p_mesa_nueva,'ubicacion',p_mesa_nueva,'cliente',v_pedido.cliente,'cliente_nombre',v_pedido.cliente_nombre)
 where pedido_id=p_pedido_id and impreso=false;
 insert into public.pedido_cambios_mesa(pedido_id,mesa_anterior,mesa_nueva,usuario_id,usuario_email)
 values(p_pedido_id,v_anterior,p_mesa_nueva,auth.uid(),auth.jwt()->>'email');
 return to_jsonb(v_pedido);
end; $$;
revoke all on function public.cambiar_mesa_pedido(text,text,text) from public;
grant execute on function public.cambiar_mesa_pedido(text,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
