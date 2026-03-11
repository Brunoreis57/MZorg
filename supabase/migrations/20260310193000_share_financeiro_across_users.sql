-- Share Financeiro data across authenticated users (multi-user workspace)

-- financial_transactions
alter table if exists public.financial_transactions enable row level security;

drop policy if exists "Users manage own financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can read financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can insert financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can update financial_transactions" on public.financial_transactions;
drop policy if exists "Authenticated can delete financial_transactions" on public.financial_transactions;

create policy "Authenticated can read financial_transactions"
on public.financial_transactions
for select
to authenticated
using (true);

create policy "Authenticated can insert financial_transactions"
on public.financial_transactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Authenticated can update financial_transactions"
on public.financial_transactions
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete financial_transactions"
on public.financial_transactions
for delete
to authenticated
using (true);

-- payment_schedule
alter table if exists public.payment_schedule enable row level security;

drop policy if exists "Users manage own payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can read payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can insert payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can update payment_schedule" on public.payment_schedule;
drop policy if exists "Authenticated can delete payment_schedule" on public.payment_schedule;

create policy "Authenticated can read payment_schedule"
on public.payment_schedule
for select
to authenticated
using (true);

create policy "Authenticated can insert payment_schedule"
on public.payment_schedule
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Authenticated can update payment_schedule"
on public.payment_schedule
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete payment_schedule"
on public.payment_schedule
for delete
to authenticated
using (true);

