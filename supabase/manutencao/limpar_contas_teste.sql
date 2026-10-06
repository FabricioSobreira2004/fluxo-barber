-- ============================================================================
-- limpar_contas_teste.sql
-- Script de MANUTENÇÃO (não é migration: sem número, não é aplicado
-- automaticamente, não cria nem altera tabela/função/policy nenhuma -- só
-- consulta e, se você decidir, apaga linhas). Feito pra você revisar e colar
-- manualmente no SQL Editor do Supabase, por partes. NADA foi rodado por
-- mim no banco -- só este arquivo foi criado.
--
-- COMO USAR:
--   1) Rode só a PARTE 1 (leitura) primeiro e confira a lista com calma:
--      quais barbearias/usuários são realmente "de teste" e quais não são.
--   2) Só depois de conferir, copie o conteúdo de DENTRO do bloco /* */ da
--      PARTE 2 (ou seja, sem os marcadores de comentário) pra uma nova aba
--      do SQL Editor e rode.
--
-- ORDEM CERTA, e POR QUÊ (ver "on delete cascade"/"on delete set null" em
-- supabase/migrations/001_schema_inicial.sql):
--   - PRIMEIRO as BARBEARIAS de teste (por slug): membros, barbeiros,
--     servicos, clientes, horarios_trabalho e agendamentos têm
--     "barbearia_id uuid ... references barbearias(id) on delete cascade" --
--     ou seja, 1 delete em "barbearias" já leva TUDO que mora dentro dela.
--   - DEPOIS os USUÁRIOS de teste (por email, em auth.users): é a tabela
--     "membros" que aponta pro usuário ("user_id ... references
--     auth.users(id) on delete cascade"), e NÃO o contrário -- uma barbearia
--     não tem nenhuma coluna "dono_id" apontando pra um usuário. Por isso
--     apagar só o usuário NUNCA apaga a barbearia (ela ficaria "órfã", sem
--     dono, mas intacta) -- os dois deletes abaixo são sempre os DOIS
--     necessários. A ordem entre eles não muda o resultado final (nenhum dos
--     dois depende do outro já ter sido apagado antes); fazemos barbearias
--     primeiro só por clareza, pra já não restar nada "por dentro" antes de
--     tocar nos logins.
--   - Atenção especial: "barbeiros.user_id references auth.users(id) ON
--     DELETE SET NULL" (não é cascade!) -- se algum usuário de teste também
--     estivesse marcado como "barbeiro" de uma barbearia PROTEGIDA (não
--     deveria acontecer nunca, mas por segurança), apagar esse usuário só
--     desvincularia o login daquele barbeiro (ele continuaria existindo,
--     só sem login associado) -- nunca apagaria o barbeiro nem a barbearia.
-- ============================================================================


-- ============================================================================
-- PARTE 1 -- SÓ LEITURA. Rode as 2 consultas abaixo e confira a lista com
-- calma ANTES de sequer abrir a PARTE 2.
-- ============================================================================

-- 1a) todas as barbearias cadastradas, com nome/slug/data de criação e quem
-- é vinculado a cada uma (dono ou funcionário), via "membros"
select
  b.id,
  b.nome,
  b.slug,
  b.criado_em,
  m.papel as papel_do_membro, -- 'dono' ou 'funcionario'
  u.email as email_do_membro
from barbearias b
left join membros m on m.barbearia_id = b.id -- "left" pra também listar uma barbearia sem nenhum membro vinculado, se existir
left join auth.users u on u.id = m.user_id
order by b.criado_em, b.nome;

-- 1b) todos os usuários de autenticação cadastrados, com data de criação e
-- do último login (null = usuário nunca chegou a entrar de verdade)
select
  id,
  email,
  created_at,
  last_sign_in_at
from auth.users
order by created_at;


-- ============================================================================
-- PARTE 2 -- ESCRITA (fica comentada de propósito, dentro de "/* ... */").
-- Só descomente (apague as linhas "/*" e "*/" abaixo, mantendo o que está
-- entre elas) depois de conferir a PARTE 1 e ter certeza de que as listas
-- de "in (...)" abaixo batem exatamente com o que você quer apagar.
--
-- PROTEÇÃO (2 camadas, de propósito -- mesmo que a lista "in (...)" acima
-- seja editada errado por engano no futuro, o "not in (...)" abaixo segura):
--   - Barbearias que NUNCA devem ser apagadas por este script: a 'demo'
--     (seed de demonstração, ver supabase/seeds/demo_barbearia.sql),
--     'barbearia-teste' e 'salao-de-beleza' (contas de referência, não são
--     descartáveis).
--   - Usuários que NUNCA devem ser apagados por este script: 'sobreira
--     .fabricio@hotmail.com' e o seu usuário principal de login -- deixei
--     'sobreira.barros.fabricio@gmail.com' abaixo por ser o email associado
--     a esta conversa, mas CONFIRA na lista da PARTE 1 (1b) se é esse mesmo
--     o email com que você entra no painel antes de rodar; troque aqui se
--     não for.
-- ============================================================================

/*

-- 2a) apaga as barbearias de teste criadas durante o desenvolvimento
-- ("on delete cascade" cuida de membros, barbeiros, servicos, clientes,
-- horarios_trabalho e agendamentos de cada uma -- nada fica pra trás)
delete from barbearias
where slug in (
  'barbearia-tutorial-teste',       -- teste.tutorial@fluxobarber.test (PENDENCIAS.md)
  'barbearia-config-rapida-teste',  -- teste.configrapida@fluxobarber.test (PENDENCIAS.md)
  'barbearia-teste-faturamento'     -- teste.faturamento@fluxobarber.test (PENDENCIAS.md)
  -- adicione aqui qualquer outro slug de teste que a PARTE 1 (1a) tenha
  -- revelado e que não esteja na lista de protegidas abaixo
)
and slug not in ('demo', 'barbearia-teste', 'salao-de-beleza'); -- trava de segurança (redundante de propósito, ver explicação acima)

-- 2b) apaga os usuários de teste (de auth.users; "on delete cascade" em
-- "membros.user_id" cuida de qualquer vínculo que ainda restasse, embora o
-- passo 2a já deva ter apagado tudo isso junto com a barbearia)
delete from auth.users
where email in (
  'teste.tutorial@fluxobarber.test',
  'teste.configrapida@fluxobarber.test',
  'teste.faturamento@fluxobarber.test'
  -- adicione aqui qualquer outro "...@fluxobarber.test" que a PARTE 1 (1b)
  -- tenha revelado e que não esteja na lista de protegidos abaixo
)
and email not in ('sobreira.fabricio@hotmail.com', 'sobreira.barros.fabricio@gmail.com'); -- trava de segurança (redundante de propósito, ver explicação acima -- CONFIRA este 2º email antes de rodar)

*/
