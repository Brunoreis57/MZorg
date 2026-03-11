-- Link daily services (OS) to financial transactions so edits can sync

alter table if exists public.financial_transactions
add column if not exists daily_service_id uuid references public.daily_services(id) on delete set null;

create index if not exists financial_transactions_daily_service_id_idx
on public.financial_transactions (daily_service_id);

