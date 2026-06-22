-- Tabela de partituras salvas. Rode isto no SQL Editor do Supabase.
-- Uso pessoal: tabela aberta (RLS permite leitura/escrita anônima).

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  titulo text not null default 'Sem título',
  notas jsonb not null default '[]'::jsonb,       -- ["Si","Do#",...]
  resultado jsonb not null default '[]'::jsonb,   -- mapeamento corda/dedo/intervalo
  criado_em timestamptz not null default now()
);

alter table public.scores enable row level security;

-- Policies abertas para o papel anônimo (qualquer um com o link lê/grava).
-- Para restringir depois, troque por policies baseadas em auth.uid().
drop policy if exists "scores_select_anon" on public.scores;
create policy "scores_select_anon"
  on public.scores for select
  to anon
  using (true);

drop policy if exists "scores_insert_anon" on public.scores;
create policy "scores_insert_anon"
  on public.scores for insert
  to anon
  with check (true);
