-- Preserve every shared VCC snapshot before it is replaced or deleted.
create table if not exists public.vcc_app_state_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  device_id text not null,
  revision bigint not null check (revision > 0),
  recorded_at timestamptz not null default now(),
  reason text not null default 'update'
);

alter table public.vcc_app_state_history enable row level security;
revoke all on table public.vcc_app_state_history from anon;
revoke all on table public.vcc_app_state_history from authenticated;
grant select on table public.vcc_app_state_history to authenticated;

drop policy if exists "VCC owners read app state history" on public.vcc_app_state_history;
create policy "VCC owners read app state history"
on public.vcc_app_state_history
for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists vcc_app_state_history_user_recorded_idx
on public.vcc_app_state_history (user_id, recorded_at desc);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.archive_vcc_app_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.vcc_app_state_history
    (user_id, data, device_id, revision, recorded_at, reason)
  values
    (old.user_id, old.data, old.device_id, old.revision, now(), lower(tg_op));
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function private.archive_vcc_app_state() from public, anon, authenticated;

drop trigger if exists archive_vcc_app_state_before_change on public.vcc_app_state;
create trigger archive_vcc_app_state_before_change
before update or delete on public.vcc_app_state
for each row execute function private.archive_vcc_app_state();

insert into public.vcc_app_state_history
  (user_id, data, device_id, revision, recorded_at, reason)
select s.user_id, s.data, s.device_id, s.revision, now(), 'recovery_baseline'
from public.vcc_app_state s
where not exists (
  select 1 from public.vcc_app_state_history h
  where h.user_id = s.user_id
    and h.revision = s.revision
    and h.reason = 'recovery_baseline'
);
