create table if not exists public.pricing_configs (
  id uuid default gen_random_uuid() primary key,
  bidding_id uuid references public.biddings(id) on delete cascade not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  unique(bidding_id)
);

alter table public.pricing_configs enable row level security;

create policy "Users can view their own pricing configs"
on public.pricing_configs for select
using (auth.uid() = user_id);

create policy "Users can insert their own pricing configs"
on public.pricing_configs for insert
with check (auth.uid() = user_id);

create policy "Users can update their own pricing configs"
on public.pricing_configs for update
using (auth.uid() = user_id);
