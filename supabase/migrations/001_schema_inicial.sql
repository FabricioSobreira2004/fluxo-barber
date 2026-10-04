-- ============================================================================
-- 001_schema_inicial.sql
-- ESTE ARQUIVO É SÓ PARA VERSIONAR (histórico em git) o banco que já existe
-- no Supabase. Ele foi criado manualmente pelo SQL Editor e NÃO deve ser
-- executado de novo (as tabelas já existem). Guardamos aqui para o caso de
-- precisarmos recriar o banco do zero (ex: outro ambiente) e para o restante
-- da equipe entender a estrutura sem precisar abrir o painel do Supabase.
-- ============================================================================

-- extensão usada para gerar uuid aleatório em "default gen_random_uuid()"
create extension if not exists pgcrypto;

-- extensão que permite usar "=" (igualdade) dentro de um índice GIST; é o que
-- possibilita a trava de conflito de horário na tabela "agendamentos"
create extension if not exists btree_gist;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

-- papel que um usuário tem dentro de uma barbearia (quem é "chefe", quem é funcionário)
create type papel_membro as enum ('dono', 'funcionario');

-- todos os estados possíveis de um agendamento, do início ao fim do ciclo de vida
create type status_agendamento as enum ('agendado', 'confirmado', 'concluido', 'cancelado', 'faltou');

-- ----------------------------------------------------------------------------
-- TABELAS
-- ----------------------------------------------------------------------------

-- cada barbearia cadastrada no sistema (é o "tenant" — tudo mais pendura nela)
create table barbearias (
  id uuid primary key default gen_random_uuid(),      -- identificador interno, gerado automaticamente
  nome text not null,                                  -- nome da barbearia, exibido no painel e na página pública
  slug text not null unique,                           -- parte da URL pública (ex: /b/barbearia-do-ze), precisa ser única
  telefone text,                                        -- telefone de contato, opcional
  endereco text,                                        -- endereço físico, opcional
  criado_em timestamptz not null default now()          -- quando a barbearia foi criada, para auditoria/ordenação
);

-- liga um usuário (auth.users) a uma barbearia, com um papel (dono/funcionário)
create table membros (
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  user_id uuid not null references auth.users(id) on delete cascade,      -- qual usuário logado é esse membro
  papel papel_membro not null,                                            -- define o nível de acesso dentro da barbearia
  criado_em timestamptz not null default now(),                          -- quando o vínculo foi criado
  primary key (barbearia_id, user_id)                                    -- um usuário só pode ter 1 papel por barbearia
);

-- profissionais que atendem em uma barbearia (podem ou não ter login próprio)
create table barbeiros (
  id uuid primary key default gen_random_uuid(),       -- identificador interno do barbeiro
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  user_id uuid references auth.users(id) on delete set null,              -- login do próprio barbeiro, se ele tiver um (opcional)
  nome text not null,                                   -- nome exibido na agenda e na página pública
  ativo boolean not null default true,                  -- false = "desativado" (preferimos isso a apagar o registro)
  criado_em timestamptz not null default now()          -- quando o barbeiro foi cadastrado
);

-- serviços oferecidos pela barbearia (corte, barba, combo etc.)
create table servicos (
  id uuid primary key default gen_random_uuid(),       -- identificador interno do serviço
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  nome text not null,                                   -- nome do serviço, exibido no painel e na página pública
  duracao_min int not null check (duracao_min > 0),     -- duração em minutos; precisa ser positiva para a agenda fazer sentido
  preco_centavos int not null check (preco_centavos >= 0), -- preço guardado em centavos (evita erro de arredondamento com float)
  ativo boolean not null default true,                  -- false = "desativado", sem apagar o histórico de agendamentos antigos
  criado_em timestamptz not null default now()          -- quando o serviço foi cadastrado
);

-- clientes finais da barbearia (quem agenda o horário)
create table clientes (
  id uuid primary key default gen_random_uuid(),        -- identificador interno do cliente
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  nome text not null,                                    -- nome do cliente
  telefone text not null,                                -- telefone, usado para identificar o cliente na página pública
  criado_em timestamptz not null default now(),          -- quando o cliente foi cadastrado
  unique (barbearia_id, telefone)                        -- mesmo telefone não pode duplicar cliente dentro da mesma barbearia
);

-- grade de horários em que cada barbeiro trabalha, por dia da semana
create table horarios_trabalho (
  id uuid primary key default gen_random_uuid(),        -- identificador interno da faixa de horário
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,   -- a qual barbeiro pertence essa faixa
  dia_semana int not null check (dia_semana between 0 and 6), -- 0 = domingo ... 6 = sábado (padrão do Postgres/JS)
  inicio time not null,                                  -- hora em que a faixa de trabalho começa nesse dia
  fim time not null                                      -- hora em que a faixa de trabalho termina nesse dia
);

-- os agendamentos em si: quem, com quem, que serviço, quando
create table agendamentos (
  id uuid primary key default gen_random_uuid(),         -- identificador interno do agendamento
  barbearia_id uuid not null references barbearias(id) on delete cascade, -- a qual barbearia pertence
  barbeiro_id uuid not null references barbeiros(id) on delete cascade,   -- quem vai atender
  cliente_id uuid not null references clientes(id) on delete cascade,     -- quem vai ser atendido
  servico_id uuid not null references servicos(id) on delete cascade,     -- qual serviço foi escolhido
  inicio timestamptz not null,                           -- data/hora em que o atendimento começa
  fim timestamptz not null,                              -- data/hora em que o atendimento termina (início + duração do serviço)
  preco_centavos int not null check (preco_centavos >= 0), -- preço copiado do serviço no momento do agendamento (histórico não muda se o preço do serviço mudar depois)
  status status_agendamento not null default 'agendado', -- estado atual do agendamento
  observacao text,                                        -- anotação livre (ex: "pediu para não cortar muito")
  criado_em timestamptz not null default now(),           -- quando o agendamento foi criado

  -- trava que IMPEDE dois agendamentos do MESMO barbeiro com horários que se cruzam;
  -- ignora os cancelados, porque um horário cancelado libera a vaga para outro cliente
  constraint sem_conflito_de_horario exclude using gist (
    barbeiro_id with =,
    tsrange(inicio, fim) with &&
  ) where (status <> 'cancelado')
);

-- ----------------------------------------------------------------------------
-- FUNÇÕES
-- ----------------------------------------------------------------------------

-- devolve true se o usuário logado (auth.uid()) é membro da barbearia "b_id";
-- "security definer" permite que essa função leia a tabela "membros" mesmo
-- que a policy de "membros" não deixe o usuário ler a linha de outra pessoa
create or replace function eh_membro(b_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from membros m
    where m.barbearia_id = b_id
      and m.user_id = auth.uid()
  );
$$;

-- cria uma barbearia nova e já insere quem está logado como "dono" dela;
-- "security definer" é necessário porque o usuário ainda não é membro de
-- nenhuma barbearia no momento do insert (a policy normal bloquearia)
create or replace function criar_barbearia(p_nome text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid; -- vai guardar o id da barbearia recém-criada, para devolver ao final
begin
  insert into barbearias (nome, slug)
  values (p_nome, p_slug)
  returning id into v_id; -- guarda o id gerado para usar no insert seguinte

  insert into membros (barbearia_id, user_id, papel)
  values (v_id, auth.uid(), 'dono'); -- quem chamou a função se torna automaticamente o dono

  return v_id; -- devolve o id para o site redirecionar/usar na sequência
end;
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- liga o RLS em todas as tabelas: por padrão, sem nenhuma "policy", ninguém
-- consegue ler/escrever nada — isso é a base da segurança multi-tenant
alter table barbearias enable row level security;
alter table membros enable row level security;
alter table barbeiros enable row level security;
alter table servicos enable row level security;
alter table clientes enable row level security;
alter table horarios_trabalho enable row level security;
alter table agendamentos enable row level security;

-- quem é membro pode VER e ATUALIZAR os dados da própria barbearia
create policy barbearias_select on barbearias
  for select using (eh_membro(id));

create policy barbearias_update on barbearias
  for update using (eh_membro(id));

-- um membro pode ver as linhas de "membros" das barbearias às quais pertence
create policy membros_select on membros
  for select using (eh_membro(barbearia_id));

-- nas tabelas do dia a dia, quem é membro da barbearia pode fazer qualquer
-- operação (select/insert/update/delete); "with check" garante que, mesmo
-- inserindo ou atualizando, o registro continua pertencendo a uma barbearia
-- da qual o usuário é membro (não dá pra "vazar" dados pra outra barbearia)
create policy barbeiros_all on barbeiros
  for all using (eh_membro(barbearia_id)) with check (eh_membro(barbearia_id));

create policy servicos_all on servicos
  for all using (eh_membro(barbearia_id)) with check (eh_membro(barbearia_id));

create policy clientes_all on clientes
  for all using (eh_membro(barbearia_id)) with check (eh_membro(barbearia_id));

create policy horarios_trabalho_all on horarios_trabalho
  for all using (eh_membro(barbearia_id)) with check (eh_membro(barbearia_id));

create policy agendamentos_all on agendamentos
  for all using (eh_membro(barbearia_id)) with check (eh_membro(barbearia_id));
