-- ============================================================================
-- 005_barbearia_pronta_publica.sql
-- ⚠️ ESTE ARQUIVO AINDA NÃO FOI EXECUTADO -- precisa ser rodado por você no
-- SQL Editor do Supabase (ver PENDENCIAS.md, seção "Para fazer agora").
--
-- O QUE FAZ: cria a função "barbearia_esta_pronta(p_slug)", usada pela
-- página pública /b/[slug] pra saber se aquela barbearia já tem os 3
-- requisitos pra receber agendamento (pelo menos 1 barbeiro ativo, 1
-- serviço ativo e 1 horário de trabalho cadastrado pra um barbeiro ativo) --
-- SEM precisar expor nenhum dado além de um "sim"/"não".
--
-- É a MESMA regra que já existe no código do painel (função TypeScript
-- "barbeariaProntaParaAgendamentos", em utils/supabase/prontidao.ts) -- só
-- reescrita em SQL, porque a página pública roda sem login, e as tabelas
-- (barbeiros, serviços, horarios_trabalho) são protegidas por RLS
-- ("eh_membro(barbearia_id)", ver 001_schema_inicial.sql), então um
-- visitante comum não consegue consultá-las direto. "security definer" é o
-- que permite essa função ler essas tabelas mesmo sem o visitante ser
-- membro -- só que ela devolve só um boolean, nunca os dados em si.
--
-- "security definer" nas outras funções desta pasta (buscar_barbearia_publica
-- etc., ver 002_agendamento_publico.sql) segue o mesmo padrão.
-- ============================================================================

create or replace function barbearia_esta_pronta(p_slug text)
returns boolean
language plpgsql
security definer
set search_path = public
stable -- não altera o banco, só lê; ajuda o Postgres a otimizar
as $$
declare
  v_barbearia_id uuid;
  v_pronta boolean;
begin
  select id into v_barbearia_id from barbearias where slug = p_slug;

  if v_barbearia_id is null then
    return false; -- slug inexistente: a página já mostra 404 antes de chamar isso, mas por segurança devolve false mesmo assim
  end if;

  select
    exists (select 1 from barbeiros b where b.barbearia_id = v_barbearia_id and b.ativo = true) -- pelo menos 1 barbeiro ativo
    and exists (select 1 from servicos s where s.barbearia_id = v_barbearia_id and s.ativo = true) -- pelo menos 1 serviço ativo
    and exists ( -- pelo menos 1 horário de trabalho, de um barbeiro que esteja ativo AGORA
      select 1
      from horarios_trabalho ht
      join barbeiros b on b.id = ht.barbeiro_id
      where ht.barbearia_id = v_barbearia_id
        and b.ativo = true
    )
  into v_pronta;

  return v_pronta;
end;
$$;
