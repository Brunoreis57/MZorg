-- Editais+ (análise manual)

create table if not exists public.editais_analise (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  texto_capturado text,
  url_origem text
);

alter table public.editais_analise add column if not exists user_id uuid;
alter table public.editais_analise alter column user_id set default auth.uid();
alter table public.editais_analise add column if not exists created_at timestamptz not null default now();
alter table public.editais_analise add column if not exists texto_capturado text;
alter table public.editais_analise add column if not exists url_origem text;

alter table public.editais_analise add column if not exists code text;
alter table public.editais_analise add column if not exists object text;
alter table public.editais_analise add column if not exists entity text;
alter table public.editais_analise add column if not exists city text;
alter table public.editais_analise add column if not exists uf text;
alter table public.editais_analise add column if not exists date date;
alter table public.editais_analise add column if not exists time text;
alter table public.editais_analise add column if not exists estimated_value numeric;
alter table public.editais_analise add column if not exists pdf_url text;
alter table public.editais_analise add column if not exists status text not null default 'pendente';
alter table public.editais_analise add column if not exists sent_bidding_id uuid;
alter table public.editais_analise add column if not exists manual boolean not null default false;

alter table public.editais_analise enable row level security;

drop policy if exists "Users can view own editais_analise" on public.editais_analise;
create policy "Users can view own editais_analise"
on public.editais_analise
for select
to authenticated
using (user_id is null or auth.uid() = user_id);

drop policy if exists "Users can insert own editais_analise" on public.editais_analise;
create policy "Users can insert own editais_analise"
on public.editais_analise
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own editais_analise" on public.editais_analise;
create policy "Users can update own editais_analise"
on public.editais_analise
for update
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete own editais_analise" on public.editais_analise;
create policy "Users can delete own editais_analise"
on public.editais_analise
for delete
to authenticated
using (auth.uid() = user_id);
