create table if not exists public.vita_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null,
  merchant text not null,
  amount numeric(14,2) not null check (amount > 0),
  occurred_on date not null,
  direction text not null check (direction in ('expense', 'income', 'transfer')),
  account_name text not null,
  category text not null,
  reference_code text,
  raw_text text not null default '',
  confidence smallint not null default 0 check (confidence between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, transaction_id)
);

alter table public.vita_receipts enable row level security;
revoke all on table public.vita_receipts from anon;
grant select, insert, update, delete on table public.vita_receipts to authenticated;

create policy "VitaScan owners read receipts" on public.vita_receipts for select to authenticated using ((select auth.uid()) = user_id);
create policy "VitaScan owners add receipts" on public.vita_receipts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "VitaScan owners update receipts" on public.vita_receipts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "VitaScan owners delete receipts" on public.vita_receipts for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists vita_receipts_user_date_idx on public.vita_receipts (user_id, occurred_on desc);
