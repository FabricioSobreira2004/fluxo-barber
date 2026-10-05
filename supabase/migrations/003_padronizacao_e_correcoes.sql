-- ============================================================================
-- 003_padronizacao_e_correcoes.sql
-- ESTE ARQUIVO PRECISA SER EXECUTADO por você no SQL Editor do Supabase
-- (ver PENDENCIAS.md) -- ele ainda não existe no banco.
--
-- O que este arquivo faz, em ordem:
--   a) Padroniza o telefone dos clientes para guardar SÓ dígitos (sem
--      "(21) ", sem "-"), normalizando os dados que já existem e
--      adicionando uma trava (constraint) que impede telefone fora do
--      padrão de entrar no banco a partir de agora. IMPORTANTE: só tira
--      caracteres que não são dígito -- o "55" do código do Brasil (quando
--      alguém digita "+55 21 99016-3583") NÃO é removido aqui; isso só foi
--      corrigido depois, na migration 004_telefone_55.sql.
--   b) Valida nome e telefone recebidos nas funções públicas (chamadas por
--      qualquer visitante da internet, sem login), com mensagens em
--      português.
--   c) Corrige um bug de "virada da meia-noite" em criar_agendamento_publico:
--      a checagem antiga comparava só HORAS (tipo "time"), e hora não tem
--      "dia seguinte" -- por isso um atendimento às 23:30 com 60 minutos de
--      duração "virava" 00:30 e passava pela checagem de expediente mesmo
--      sem caber no dia. A correção compara DATA+HORA (timestamp) junto.
--   d) Impede spam na página pública: um mesmo telefone não pode ter mais
--      de 3 agendamentos futuros (ainda não cancelados) na mesma barbearia.
--
-- Todas as funções usam "create or replace" com a MESMA assinatura (mesmo
-- nome e mesmos parâmetros) das versões antigas, pra o site continuar
-- funcionando sem precisar mudar o código que já chama essas funções.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- a) TELEFONE PADRONIZADO (só dígitos)
-- ----------------------------------------------------------------------------

-- passo 1: normaliza os telefones já cadastrados, removendo tudo que não é
-- número (espaços, parênteses, hífen, o "+" de "+55"...). Fazemos isso numa tabela
-- temporária primeiro, pra poder DETECTAR duplicatas antes de tocar nos dados
-- de verdade -- ex: "(21) 99016-3583" e "21 99016 3583" são o MESMO telefone
-- depois de normalizados, e dois clientes assim virariam duplicata na mesma
-- barbearia (o que violaria o unique(barbearia_id, telefone) já existente).
do $$
declare
  v_duplicatas int; -- quantos pares de clientes colidiriam após a normalização
begin
  -- cria uma tabela temporária (só existe durante esta sessão) com o "antes e
  -- depois" de cada cliente, pra conseguirmos inspecionar o resultado
  create temporary table tmp_telefones_normalizados as
  select
    id,
    barbearia_id,
    telefone as telefone_antigo,
    regexp_replace(telefone, '\D', '', 'g') as telefone_novo -- \D = tudo que NÃO é dígito; 'g' = remove todas as ocorrências
  from clientes;

  -- conta quantos clientes ficariam com telefone duplicado dentro da mesma
  -- barbearia depois da normalização (mesmo barbearia_id + mesmo telefone_novo,
  -- em MAIS DE UM registro)
  select count(*) into v_duplicatas
  from (
    select barbearia_id, telefone_novo
    from tmp_telefones_normalizados
    group by barbearia_id, telefone_novo
    having count(*) > 1
  ) duplicados;

  if v_duplicatas > 0 then
    -- estratégia de segurança: em vez de apagar/mesclar clientes automaticamente
    -- (arriscado -- poderia misturar o histórico de agendamentos de duas pessoas
    -- diferentes), PARAMOS a migration aqui com uma mensagem clara. Você revisa
    -- os casos listados abaixo manualmente antes de rodar o resto do arquivo.
    raise exception
      'Encontradas % barbearia(s)/telefone(s) que ficariam duplicados após normalizar. '
      'Rode esta consulta pra ver quais clientes colidem: '
      'select barbearia_id, regexp_replace(telefone, ''\D'', '''', ''g'') as telefone_normalizado, '
      'array_agg(id) as clientes, array_agg(nome) as nomes, array_agg(telefone) as telefones_originais '
      'from clientes group by barbearia_id, telefone_normalizado having count(*) > 1; '
      'Decida qual registro manter (ex: apagar ou mesclar o duplicado) e só então rode esta migration de novo.',
      v_duplicatas;
  end if;

  -- sem duplicatas: aplica a normalização de verdade na tabela real
  update clientes c
  set telefone = t.telefone_novo
  from tmp_telefones_normalizados t
  where c.id = t.id
    and c.telefone <> t.telefone_novo; -- só atualiza quem realmente mudou (evita escrita desnecessária)

  drop table tmp_telefones_normalizados; -- limpeza: a tabela temporária não precisa mais existir
end $$;

-- passo 2: agora que os dados existentes estão todos normalizados, criamos a
-- trava que IMPEDE telefone fora do padrão (10 ou 11 dígitos, só números) de
-- entrar na tabela a partir de agora. "not valid" + "validate" separados
-- evitaria travar a tabela inteira em bases muito grandes; aqui o banco é
-- pequeno, então criamos direto validada.
alter table clientes
  add constraint clientes_telefone_formato
  check (telefone ~ '^[0-9]{10,11}$'); -- "~" = "bate com essa expressão regular"; exatamente 10 ou 11 dígitos, só números

-- ----------------------------------------------------------------------------
-- b) + c) + d) FUNÇÕES PÚBLICAS: validação, correção de fuso e anti-spam
-- ----------------------------------------------------------------------------

-- mesma assinatura de antes (supabase/migrations/002_agendamento_publico.sql):
-- só troca o corpo da função, então o código do site continua chamando do
-- mesmo jeito, sem precisar mudar nada no TypeScript.
create or replace function criar_agendamento_publico(
  p_barbearia_id uuid,
  p_barbeiro_id uuid,
  p_servico_id uuid,
  p_data date,
  p_hora time,
  p_nome_cliente text,
  p_telefone_cliente text
)
returns uuid
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
  v_nome_limpo text;       -- nome já com trim, validado
  v_telefone_limpo text;   -- telefone já normalizado (só dígitos), validado
  v_agendamentos_futuros int; -- quantos agendamentos futuros não cancelados esse telefone já tem nessa barbearia
begin
  -- b) validação do nome: trim (tira espaço das pontas) e tamanho entre 2 e 100 caracteres
  v_nome_limpo := trim(p_nome_cliente);
  if length(v_nome_limpo) < 2 or length(v_nome_limpo) > 100 then
    raise exception 'Nome precisa ter entre 2 e 100 caracteres';
  end if;

  -- a) + b) normaliza o telefone recebido (remove tudo que não é número) e valida o formato
  v_telefone_limpo := regexp_replace(p_telefone_cliente, '\D', '', 'g');
  if v_telefone_limpo !~ '^[0-9]{10,11}$' then
    raise exception 'Telefone precisa ter 10 ou 11 números (DDD + número)';
  end if;

  if not exists ( -- confirma que o barbeiro é mesmo dessa barbearia e está ativo (evita id "forjado" de outra barbearia)
    select 1 from barbeiros
    where id = p_barbeiro_id and barbearia_id = p_barbearia_id and ativo = true
  ) then
    raise exception 'Barbeiro inválido';
  end if;

  select duracao_min, preco_centavos into v_duracao_min, v_preco_centavos -- já aproveita pra pegar duração e preço
  from servicos
  where id = p_servico_id and barbearia_id = p_barbearia_id and ativo = true;

  if v_duracao_min is null then
    raise exception 'Serviço inválido';
  end if;

  -- c) CORREÇÃO DA VIRADA DA MEIA-NOITE: a versão antiga comparava só
  -- "p_hora + duração <= ht.fim" usando o tipo "time", que não tem conceito de
  -- "dia seguinte" -- 23:30 + 60min "vira" 00:30 (e 00:30 <= ht.fim quase
  -- sempre é verdadeiro, então um horário que na verdade NÃO cabe no
  -- expediente passava pela checagem). Agora comparamos DATA+HORA completas
  -- (timestamp), onde "p_data + p_hora + duração" realmente avança pro dia
  -- seguinte quando cruza a meia-noite, e só "cabe" se ainda for o mesmo dia.
  if not exists (
    select 1
    from horarios_trabalho ht
    where ht.barbeiro_id = p_barbeiro_id
      and ht.dia_semana = extract(dow from p_data)
      and p_hora >= ht.inicio
      and (p_data + p_hora + make_interval(mins => v_duracao_min)) <= (p_data + ht.fim)
  ) then
    raise exception 'Horário fora do expediente do barbeiro';
  end if;

  v_inicio := (p_data + p_hora) at time zone 'America/Sao_Paulo';
  v_fim := v_inicio + make_interval(mins => v_duracao_min);

  if v_inicio <= now() then -- não deixa agendar um horário que já passou
    raise exception 'Não é possível agendar no passado';
  end if;

  select id into v_cliente_id -- tenta reaproveitar um cliente já cadastrado com esse telefone (já normalizado)
  from clientes
  where barbearia_id = p_barbearia_id and telefone = v_telefone_limpo;

  -- d) ANTI-SPAM: impede que o mesmo telefone acumule mais de 3 agendamentos
  -- futuros (ainda não cancelados) na mesma barbearia. Só verifica se o
  -- cliente já existe -- um telefone novo, por definição, ainda não tem
  -- nenhum agendamento.
  if v_cliente_id is not null then
    select count(*) into v_agendamentos_futuros
    from agendamentos a
    where a.cliente_id = v_cliente_id
      and a.barbearia_id = p_barbearia_id
      and a.status <> 'cancelado'
      and a.inicio > now();

    if v_agendamentos_futuros >= 3 then
      raise exception 'Você já tem 3 agendamentos futuros marcados aqui. Cancele algum antes de marcar outro.';
    end if;
  end if;

  if v_cliente_id is null then -- telefone novo: cadastra o cliente agora, já com os dados validados/normalizados
    insert into clientes (barbearia_id, nome, telefone)
    values (p_barbearia_id, v_nome_limpo, v_telefone_limpo)
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
