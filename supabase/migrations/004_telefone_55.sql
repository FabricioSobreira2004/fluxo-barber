-- ============================================================================
-- 004_telefone_55.sql
-- ✅ JÁ FOI EXECUTADA no Supabase (confirmado) -- este arquivo fica só pra
-- versionar no git o que foi aplicado. Não precisa rodar de novo.
--
-- O QUE CORRIGE: a normalização de telefone da migration 003 só removia
-- caracteres que NÃO são dígito (regexp_replace '\D'), então o "+" de
-- "+55 21 99016-3583" sumia, mas o "55" continuava colado no número:
--   "+55 21 99016-3583" -> "5521990163583" (13 dígitos) -> RECUSADO
-- (o comentário da migration 003 dizia "sem +55", mas isso só era verdade
-- pro "+"; o "55" continuava entrando, o que estava errado -- esta migration
-- corrige o comportamento E o comentário.)
--
-- A CORREÇÃO: depois de tirar os não-dígitos, se o que sobrou tiver 12 ou 13
-- dígitos E começar com "55", removemos esse "55" da frente -- exatamente
-- como o site já faz (ver utils/telefone.ts, função normalizarTelefone).
--
-- ⚠️ SOBRE O DDD 55: o DDD 55 existe de verdade (Santa Maria/RS), então
-- "só agir quando sobra 12 ou 13 dígitos" não é coincidência -- é o que
-- garante que um número desse DDD nunca seja confundido com o código do
-- país:
--   - DDD 55 digitado SEM código do país: "55" + DDD/número = 11 dígitos
--     (celular) ou 10 (fixo) -- nunca 12 ou 13, então a regra abaixo nem
--     entra em ação, o número passa intacto.
--   - DDD 55 digitado COM código do país: "+55 55 99123-4567" -> depois de
--     tirar os não-dígitos, "5555991234567", 13 dígitos. Aí sim a regra
--     entra, mas remove só os DOIS PRIMEIROS dígitos (o código do país),
--     sobrando "55991234567" (11 dígitos: DDD 55 + o celular) -- o DDD 55
--     real fica preservado, só o "+55" do país é que some.
--
-- "create or replace" com a MESMA assinatura de antes, pra o site não
-- precisar mudar nada.
-- ============================================================================

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
  v_nome_limpo text;       -- nome já com trim, validado
  v_telefone_limpo text;   -- telefone já normalizado (só dígitos, sem "+55"), validado
  v_agendamentos_futuros int; -- quantos agendamentos futuros não cancelados esse telefone já tem nessa barbearia
begin
  -- validação do nome: trim (tira espaço das pontas) e tamanho entre 2 e 100 caracteres
  v_nome_limpo := trim(p_nome_cliente);
  if length(v_nome_limpo) < 2 or length(v_nome_limpo) > 100 then
    raise exception 'Nome precisa ter entre 2 e 100 caracteres';
  end if;

  v_telefone_limpo := regexp_replace(p_telefone_cliente, '\D', '', 'g'); -- 1º passo: tira tudo que não é dígito (igual a migration 003)
  if length(v_telefone_limpo) in (12, 13) and left(v_telefone_limpo, 2) = '55' then
    -- 2º passo (NOVO nesta migration): sobrou o "55" do código do Brasil colado no número (ex: alguém
    -- digitou "+55 21 99016-3583") -- tira esse prefixo pra chegar nos 10/11 dígitos de verdade (ver
    -- o comentário no topo do arquivo sobre por que isso não afeta números de verdade do DDD 55)
    v_telefone_limpo := substring(v_telefone_limpo from 3);
  end if;
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

  -- CORREÇÃO DA VIRADA DA MEIA-NOITE (da migration 003, mantida aqui): a comparação usa DATA+HORA
  -- completas (timestamp), não só a hora -- "p_data + p_hora + duração" avança pro dia seguinte de
  -- verdade quando cruza a meia-noite, e só "cabe" no expediente se ainda for o mesmo dia
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

  -- ANTI-SPAM (da migration 003, mantida aqui): impede que o mesmo telefone acumule mais de 3
  -- agendamentos futuros (ainda não cancelados) na mesma barbearia. Só verifica se o cliente já
  -- existe -- um telefone novo, por definição, ainda não tem nenhum agendamento.
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
