-- Allow partial payments (paid amount + open balance) on financial transactions

alter table if exists public.financial_transactions
add column if not exists paid_amount numeric not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'financial_transactions_paid_amount_check'
  ) then
    alter table public.financial_transactions
      add constraint financial_transactions_paid_amount_check
      check (paid_amount >= 0 and paid_amount <= amount);
  end if;
end $$;

