create table if not exists public.vcc_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  device_id text not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.vcc_app_state enable row level security;
revoke all on table public.vcc_app_state from anon;
grant select, insert, update, delete on table public.vcc_app_state to authenticated;

create policy "VCC owners read app state" on public.vcc_app_state for select to authenticated using ((select auth.uid()) = user_id);
create policy "VCC owners create app state" on public.vcc_app_state for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "VCC owners update app state" on public.vcc_app_state for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "VCC owners delete app state" on public.vcc_app_state for delete to authenticated using ((select auth.uid()) = user_id);

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vcc_app_state'
  ) then
    alter publication supabase_realtime add table public.vcc_app_state;
  end if;
end $$;
