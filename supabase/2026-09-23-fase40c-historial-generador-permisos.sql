-- Fase 40C: el historial del generador es compartido en Supabase.
-- Ejecutar una sola vez en el proyecto Supabase de Rafiki.

alter table public.historial_generador_menu enable row level security;
grant select, insert, update, delete on public.historial_generador_menu to authenticated;

drop policy if exists historial_generador_menu_select_authenticated on public.historial_generador_menu;
drop policy if exists historial_generador_menu_insert_authenticated on public.historial_generador_menu;
drop policy if exists historial_generador_menu_update_authenticated on public.historial_generador_menu;
drop policy if exists historial_generador_menu_delete_authenticated on public.historial_generador_menu;

create policy historial_generador_menu_select_authenticated
  on public.historial_generador_menu for select to authenticated using (true);
create policy historial_generador_menu_insert_authenticated
  on public.historial_generador_menu for insert to authenticated with check (true);
create policy historial_generador_menu_update_authenticated
  on public.historial_generador_menu for update to authenticated using (true) with check (true);
create policy historial_generador_menu_delete_authenticated
  on public.historial_generador_menu for delete to authenticated using (true);
