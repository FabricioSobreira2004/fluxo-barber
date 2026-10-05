@AGENTS.md

# Fluxo Barber — contexto do projeto

SaaS de agendamento para barbearias. O usuário é estudante de ADS (2º semestre),
está aprendendo banco de dados agora — por isso toda explicação deve ser didática.

## REGRAS DE TRABALHO (importante)
- Trabalhar PASSO A PASSO: fazer uma etapa, explicar o que foi feito, e esperar
  confirmação antes de seguir para a próxima.
- TODA linha de código deve ter um comentário curto, em português, explicando
  o PORQUÊ daquela linha (não o "o quê").
- Antes de alterar ou apagar arquivos existentes, avisar o que vai mudar.
- Nunca usar a Secret key / service_role do Supabase no código do site. Usar
  somente a Publishable key.
- Não rodar "npm audit fix --force".
- Consultar a documentação atual do Next.js e do Supabase quando houver dúvida
  de API (ex: middleware vs proxy no Next.js 16).
- Ao final de cada lote de trabalho, rodar "git push" para publicar na Vercel.

## STACK
- Next.js 16 (App Router, TypeScript, Tailwind, ESLint, SEM pasta src/)
- Supabase (Postgres + Auth) com @supabase/supabase-js e @supabase/ssr já instalados
- Windows, PowerShell

## O QUE JÁ ESTÁ PRONTO
- .env.local com NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- utils/supabase/server.ts (createClient com createServerClient e cookies)
- app/page.tsx com um título simples "Fluxo Barber"
- Banco já criado no Supabase pelo SQL Editor (NÃO recriar), com RLS automático ligado:
  - enums: papel_membro ('dono','funcionario'); status_agendamento ('agendado','confirmado','concluido','cancelado','faltou')
  - barbearias (id uuid pk, nome, slug unique, telefone, endereco, criado_em)
  - membros (barbearia_id fk, user_id fk auth.users, papel papel_membro, criado_em; pk composta)
  - barbeiros (id, barbearia_id, user_id opcional, nome, ativo bool, criado_em)
  - servicos (id, barbearia_id, nome, duracao_min int check>0, preco_centavos int check>=0, ativo, criado_em)
  - clientes (id, barbearia_id, nome, telefone, criado_em; unique(barbearia_id, telefone))
  - horarios_trabalho (id, barbearia_id, barbeiro_id, dia_semana 0-6, inicio time, fim time)
  - agendamentos (id, barbearia_id, barbeiro_id, cliente_id, servico_id, inicio/fim timestamptz, preco_centavos, status, observacao, criado_em; constraint de exclusão com btree_gist impedindo horários sobrepostos do mesmo barbeiro, exceto cancelados)
  - função eh_membro(b_id) security definer
  - função criar_barbearia(p_nome, p_slug) que cria a barbearia e insere o usuário logado como 'dono' em membros
  - policies: barbearias (select/update via eh_membro), membros (select), demais tabelas "for all" com using/with check eh_membro(barbearia_id)

## PRÓXIMAS ETAPAS (uma de cada vez)
1. ~~Atualizar o CLAUDE.md com este contexto e as regras de trabalho.~~ (feito)
2. Criar utils/supabase/client.ts (cliente do navegador).
3. Criar o middleware/proxy que renova a sessão de login (seguindo a doc atual do Supabase para Next.js 16).
4. Fazer um teste simples de conexão com o banco e mostrar como verificar.
5. Salvar o schema SQL do banco em supabase/migrations/ para versionar.
6. Autenticação: telas de cadastro e login (email e senha).
7. Onboarding: após o cadastro, tela para criar a barbearia chamando a função criar_barbearia.
8. Painel: CRUD de barbeiros, serviços e horários de trabalho.
9. Agenda: listar e criar agendamentos.
10. Página pública /b/[slug] para o cliente agendar sozinho.
