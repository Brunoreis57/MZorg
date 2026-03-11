-- Restrict Financeiro access to a fixed allowlist of emails

create or replace function public.is_finance_allowed()
returns boolean
language sql
stable
as $$
  select (auth.jwt() ->> 'email') in (
    'bruno.g.reis@gmail.com',
    'mtzilmann@gmail.com',
    'vitorferrari_@hotmail.com'
  );
$$;

-- financial_transactions
alter table if exists public.financial_transactions enable row level security;

drop policy if exists "Users manage own financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can read financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can insert financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can update financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can delete financial_transactions" on public.financial_transactions;

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

-- payment_schedule
alter table if exists public.payment_schedule enable row level security;

drop policy if exists "Users manage own payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can read payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can insert payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can update payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can delete payment_schedule" on public.payment_schedule;

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

