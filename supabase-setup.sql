-- Levita · Protótipo · configuração do Supabase
-- Cole este script inteiro no SQL Editor do seu projeto Supabase e clique em "Run".

-- 1. Tabela onde cada tarefa de cada participante é registrada
create table if not exists public.sessoes_teste (
  id           uuid primary key default gen_random_uuid(),
  criado_em    timestamptz not null default now(),
  participante text not null check (char_length(participante) between 1 and 40),
  perfil       text not null check (perfil in ('admin','voluntario','lider','todos')),
  tarefa       int  not null check (tarefa between 1 and 6),
  status       text not null check (status in ('concluiu','desistiu')),
  duracao_ms   int  not null check (duracao_ms between 0 and 3600000),
  toques       int  not null default 0 check (toques between 0 and 5000),
  toques_fora  int  not null default 0 check (toques_fora between 0 and 5000),
  caminho      jsonb not null default '[]'::jsonb,
  facilidade   int  check (facilidade between 1 and 5),
  observacao   text check (char_length(observacao) <= 1000),
  dispositivo  text check (char_length(dispositivo) <= 300)
);

-- 2. Segurança: o site público só consegue INSERIR resultados, nunca ler
alter table public.sessoes_teste enable row level security;

drop policy if exists "inserir resultados" on public.sessoes_teste;
create policy "inserir resultados" on public.sessoes_teste
  for insert to anon with check (true);

-- 3. Chave do relatório (somente quem tem a chave lê os resultados)
create table if not exists public.config_relatorio (chave text primary key);
alter table public.config_relatorio enable row level security;
insert into public.config_relatorio (chave) values ('COLE-AQUI-SUA-CHAVE')
  on conflict do nothing;

create or replace function public.relatorio(p_chave text)
returns setof public.sessoes_teste
language sql
security definer
set search_path = public
as $$
  select s.* from public.sessoes_teste s
  where exists (select 1 from public.config_relatorio c where c.chave = p_chave)
  order by s.criado_em;
$$;

revoke all on function public.relatorio(text) from public;
grant execute on function public.relatorio(text) to anon;
