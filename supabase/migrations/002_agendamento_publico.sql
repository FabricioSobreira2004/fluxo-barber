-- ============================================================================
-- 002_agendamento_publico.sql
-- Funcoes "security definer" usadas pela pagina publica /b/[slug], onde o
-- cliente agenda sozinho, SEM estar logado. Como o RLS das tabelas exige
-- "eh_membro(barbearia_id)" (ver 001_schema_inicial.sql), um visitante comum
-- nao consegue ler/escrever nada diretamente -- por isso essas funcoes
-- existem: elas rodam com permissao de dono do banco (security definer),
-- mas cada uma devolve só o estritamente necessário pra pagina publica
-- funcionar, nunca dados de outros clientes.
--
-- ESTE ARQUIVO PRECISA SER EXECUTADO por você no SQL Editor do Supabase
-- (ver PENDENCIAS.md) -- ele ainda não existe no banco.
-- ============================================================================

-- 1) Busca os dados públicos de uma barbearia pelo slug (usado pra montar a
--    página /b/[slug] e pra saber o id da barbearia nas próximas chamadas)
create or replace function buscar_barbearia_publica(p_slug text)
returns table (id uuid, nome text, telefone text, endereco text) -- só os campos que fazem sentido mostrar publicamente
language sql
security definer
set search_path = public
stable -- não altera o banco, só lê; ajuda o Postgres a otimizar
as $$
  select b.id, b.nome, b.telefone, b.endereco
  from barbearias b
  where b.slug = p_slug;
$$;

-- 2) Lista os barbeiros ATIVOS de uma barbearia (pro cliente escolher)
create or replace function listar_barbeiros_publicos(p_barbearia_id uuid)
returns table (id uuid, nome text)
language sql
security definer
set search_path = public
stable
as $$
  select bb.id, bb.nome
  from barbeiros bb
  where bb.barbearia_id = p_barbearia_id
    and bb.ativo = true
  order by bb.nome;
$$;

-- 3) Lista os serviços ATIVOS de uma barbearia (pro cliente escolher)
create or replace function listar_servicos_publicos(p_barbearia_id uuid)
returns table (id uuid, nome text, duracao_min int, preco_centavos int)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.nome, s.duracao_min, s.preco_centavos
  from servicos s
  where s.barbearia_id = p_barbearia_id
    and s.ativo = true
  order by s.nome;
$$;

-- 4) Lista os horários livres de um barbeiro, numa data, pra um serviço
--    específico (a duração do serviço importa: um corte de 30min "cabe" em
--    mais horários do que uma barba+corte de 1h). Considera:
--    - os intervalos de trabalho do barbeiro naquele dia da semana
--    - os agendamentos que esse barbeiro já tem (ignora os cancelados)
--    - não mostra horário que já passou, se a data pedida for hoje
create or replace function listar_horarios_livres(
  p_barbeiro_id uuid,
  p_data date,
  p_servico_id uuid
)
returns table (horario time)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_barbearia_id uuid;   -- barbearia do barbeiro (pra confirmar que o serviço é da mesma barbearia)
  v_duracao_min int;     -- duração do serviço escolhido, em minutos
  v_dia_semana int;      -- 0 (domingo) a 6 (sábado), mesmo padrão de horarios_trabalho.dia_semana
begin
  select barbearia_id into v_barbearia_id
  from barbeiros
  where id = p_barbeiro_id and ativo = true;

  if v_barbearia_id is null then
    return; -- barbeiro inexistente ou inativo: nenhum horário disponível (função "returns table" vazia)
  end if;

  select duracao_min into v_duracao_min
  from servicos
  where id = p_servico_id and barbearia_id = v_barbearia_id and ativo = true;

  if v_duracao_min is null then
    return; -- serviço inexistente, inativo, ou de outra barbearia: nenhum horário disponível
  end if;

  v_dia_semana := extract(dow from p_data);

  return query
  with intervalos as ( -- janelas de trabalho do barbeiro nesse dia da semana (pode ter mais de uma, ex: manhã e tarde)
    select ht.inicio, ht.fim
    from horarios_trabalho ht
    where ht.barbeiro_id = p_barbeiro_id
      and ht.dia_semana = v_dia_semana
  ),
  candidatos as ( -- um horário candidato a cada 15 minutos, dentro de cada janela, com espaço suficiente pro serviço inteiro caber antes do fim da janela
    select
      gs::time as horario,                                                    -- só a hora, pra mostrar na tela (ex: "08:00")
      (gs at time zone 'America/Sao_Paulo') as inicio_tz,                      -- o mesmo instante, como timestamptz (compatível com agendamentos.inicio)
      (gs at time zone 'America/Sao_Paulo') + make_interval(mins => v_duracao_min) as fim_tz -- quando esse atendimento terminaria
    from intervalos i,
      lateral generate_series(
        (p_data + i.inicio)::timestamp,
        (p_data + i.fim)::timestamp - make_interval(mins => v_duracao_min), -- último horário possível: ainda sobra tempo pro serviço inteiro
        interval '15 minutes'
      ) as gs
  )
  select c.horario
  from candidatos c
  where c.inicio_tz > now() -- não mostra horário que já passou (só importa quando p_data é hoje)
    and not exists ( -- exclui horários que colidiriam com um agendamento não cancelado já existente desse barbeiro
      select 1
      from agendamentos a
      where a.barbeiro_id = p_barbeiro_id
        and a.status <> 'cancelado'
        and a.inicio < c.fim_tz   -- dois intervalos [inicio,fim) se cruzam quando a.inicio < c.fim E c.inicio < a.fim
        and c.inicio_tz < a.fim
    )
  order by c.horario;
end;
$$;

-- 5) Cria o agendamento vindo da página pública: reaproveita o cliente pelo
--    telefone (ou cadastra um novo) e insere o agendamento. Revalida tudo de
--    novo no servidor (não confia soh no que a pagina mandou), porque
--    qualquer pessoa na internet pode chamar essa função diretamente.
create or replace function criar_agendamento_publico(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_servico_id uuid,
  p_data date,
  p_hora time,
  p_nome_cliente text,
  p_telefone_cliente text
)
returns uuid -- devolve o id do agendamento criado
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duracao_min int;
  v_preco_centavos int;
  v_cliente_id uuid;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_novo_id uuid;
begin
  if not exists ( -- confirma que o barbeiro é mesmo dessa barbearia e está ativo (evita id "forjado" de outra barbearia)
    select 1 from barbeiros
    where id = p_barbeiro_id and barbearia_id = p_barbearia_id and ativo = true
  ) then
    raise exception 'Barbeiro invalido';
  end if;

  select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos -- já aproveita pra pegar duração e preço
  from servicos
  where id = p_servico_id and barbearia_id = p_barbearia_id and ativo = true;

  if v_duracao_min is null then
    raise exception 'Servico invalido';
  end if;

  if not exists ( -- confirma que o horário pedido cabe dentro de alguma janela de trabalho do barbeiro nesse dia
    select 1
    from horarios_trabalho ht
    where ht.barbeiro_id = p_barbeiro_id
      and ht.dia_semana = extract(dow from p_data)
      and p_hora >= ht.inicio
      and (p_hora + make_interval(mins => v_duracao_min)) <= ht.fim
  ) then
    raise exception 'Horario fora do expediente do barbeiro';
  end if;

  v_inicio := (p_data + p_hora) at time zone 'America/Sao_Paulo';
  v_fim := v_inicio + make_interval(mins => v_duracao_min);

  if v_inicio <= now() then -- não deixa agendar um horário que já passou
    raise exception 'Nao e possivel agendar no passado';
  end if;

  select id into v_cliente_id -- tenta reaproveitar um cliente já cadastrado com esse telefone
  from clientes
  where barbearia_id = p_barbearia_id and telefone = p_telefone_cliente;

  if v_cliente_id is null then -- telefone novo: cadastra o cliente agora
    insert into clientes (barbearia_id, nome, telefone)
    values (p_barbearia_id, p_nome_cliente, p_telefone_cliente)
    returning id into v_cliente_id;
  end if;

  -- a trava "sem_conflito_de_horario" (ver 001_schema_inicial.sql) garante, no nível do banco, que isso
  -- falha com erro 23P01 se esse horário acabou de ser ocupado por outra pessoa entre a consulta e o insert
  insert into agendamentos (barbearia_id, barbeiro_id, cliente_id, servico_id, inicio, fim, preco_centavos)
  values (p_barbearia_id, p_barbeiro_id, v_cliente_id, p_servico_id, v_inicio, v_fim, v_preco_centavos)
  returning id into v_novo_id;

  return v_novo_id;
end;
$$;
