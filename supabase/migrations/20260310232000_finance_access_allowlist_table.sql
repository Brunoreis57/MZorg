create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') = 'bruno.g.reis@gmail.com';
$$;

create table if not exists public.finance_allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.finance_allowed_emails enable row level security;

drop policy if exists "Admin can manage finance_allowed_emails" on public.finance_allowed_emails;
create policy "Admin can manage finance_allowed_emails"
on public.finance_allowed_emails
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.is_finance_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.finance_allowed_emails fa
    where lower(fa.email) = lower(auth.jwt() ->> 'email')
  );
$$;

insert into public.finance_allowed_emails (email)
values
  ('bruno.g.reis@gmail.com'),
  ('mtzilmann@gmail.com'),
  ('vitorferrari_@hotmail.com')
on conflict (email) do nothing;

alter table if exists public.financial_transactions enable row level security;

drop policy if exists "Users manage own financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can read financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can insert financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can update financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can delete financial_transactions" on public.financial_transactions;
drop policy if exists "Finance allowlist can read financial_transactions" on public.financial_transactions;
drop policy if exists "Finance allowlist can insert financial_transactions" on public.financial_transactions;
drop policy if exists "Finance allowlist can update financial_transactions" on public.financial_transactions;
drop policy if exists "Finance allowlist can delete financial_transactions" on public.financial_transactions;

create policy "Finance allowlist can read financial_transactions"
on public.financial_transactions
for select
to authenticated
using (public.is_finance_allowed());

create policy "Finance allowlist can insert financial_transactions"
on public.financial_transactions
for insert
to authenticated
with check (public.is_finance_allowed() and auth.uid() = user_id);

create policy "Finance allowlist can update financial_transactions"
on public.financial_transactions
for update
to authenticated
using (public.is_finance_allowed())
with check (public.is_finance_allowed());

create policy "Finance allowlist can delete financial_transactions"
on public.financial_transactions
for delete
to authenticated
using (public.is_finance_allowed());

alter table if exists public.payment_schedule enable row level security;

drop policy if exists "Users manage own payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can read payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can insert payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can update payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can delete payment_schedule" on public.payment_schedule;
drop policy if exists "Finance allowlist can read payment_schedule" on public.payment_schedule;
drop policy if exists "Finance allowlist can insert payment_schedule" on public.payment_schedule;
drop policy if exists "Finance allowlist can update payment_schedule" on public.payment_schedule;
drop policy if exists "Finance allowlist can delete payment_schedule" on public.payment_schedule;

create policy "Finance allowlist can read payment_schedule"
on public.payment_schedule
for select
to authenticated
using (public.is_finance_allowed());

create policy "Finance allowlist can insert payment_schedule"
on public.payment_schedule
for insert
to authenticated
with check (public.is_finance_allowed() and auth.uid() = user_id);

create policy "Finance allowlist can update payment_schedule"
on public.payment_schedule
for update
to authenticated
using (public.is_finance_allowed())
with check (public.is_finance_allowed());

create policy "Finance allowlist can delete payment_schedule"
on public.payment_schedule
for delete
to authenticated
using (public.is_finance_allowed());

