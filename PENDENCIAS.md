# Pendências (coisas que precisam ser feitas no painel do Supabase ou revisadas por você)

Este arquivo é atualizado a cada rodada de trabalho. Está dividido em três partes:
o que já está resolvido, o que falta fazer agora (rápido), e o que só precisa
ser feito perto do lançamento de verdade pra clientes pagantes.

---

## ✅ Concluído

- **Migrations 001 a 004, todas já aplicadas no banco.** Isso inclui a 002
  (`002_agendamento_publico.sql`), que cria as 5 funções que a página pública
  `/b/[slug]` usa pra funcionar sem login (`buscar_barbearia_publica` e as
  outras) — rodadas anteriores desta pendência diziam que faltava rodar essa
  migration; não falta mais.
- **Dados de teste apagados.** Os agendamentos e clientes criados durante os
  testes automatizados (ver `TESTES.md`) já foram removidos do banco.
- **URL Configuration feita** em Authentication → URL Configuration:
  - Site URL: `https://fluxo-barber.vercel.app`
  - Redirect URLs: `https://fluxo-barber.vercel.app/**` e `http://localhost:3000/**`
  - Isso é o que permite os links de confirmação de email (cadastro, redefinir
    senha etc.) funcionarem tanto no site publicado quanto no seu `localhost`
    durante o desenvolvimento.
- **Login da CLI do Supabase feito** (`npx supabase login`) — por isso já foi
  possível gerar os tipos de verdade (item abaixo) sem precisar de token manual.
- **Tipos do banco gerados pela CLI de verdade** (`utils/supabase/database.types.ts`),
  substituindo os tipos que antes eram escritos à mão. Agora, sempre que o
  banco mudar, rode `npm run gen:types` pra atualizar o arquivo.
- **Email de contato definido:** `contato.fluxobarber@gmail.com`, usado em
  `/termos`, `/privacidade` e no rodapé do site.
- **Migration 005 aplicada (05/10/2026)**, com 2 ajustes seus em relação ao
  arquivo original (já refletidos em `supabase/migrations/005_barbearia_pronta_publica.sql`):
  o 3º `exists` passou a filtrar por `b.barbearia_id` (em vez de
  `ht.barbearia_id`), e foi adicionado `grant execute on function
  barbearia_esta_pronta(text) to anon, authenticated;` no final — sem isso, o
  PostgREST recusaria a chamada via API mesmo a função sendo `security
  definer`. Testado por você no SQL Editor: `barbearia-teste` e
  `barbearia-config-rapida-teste` → `true`; `barbearia-tutorial-teste`,
  `salao-de-beleza` e um slug inexistente → `false` — bate exatamente com o
  esperado (as duas primeiras têm barbeiro+serviço+horário ativos; as outras,
  não). A partir de agora, a página pública `/b/[slug]` já reflete a
  prontidão de verdade, em vez de sempre mostrar "ainda não pronta".

## 🔧 Para fazer agora

### Confirmar visualmente os 4 itens da rodada "Faturamento premium + Agenda sem confirmação manual"

Eu não tenho a senha de nenhuma conta de teste existente (ex:
`teste.faturamento@fluxobarber.test`, logo abaixo) e não quis criar uma
conta nova sozinho sem perguntar — por isso só validei esta rodada por
`npm run lint` + `npm run build` e, pros filtros do Faturamento, um script
isolado rodando a mesma lógica de datas (detalhes em `TESTES.md`). Pedido:
dê uma olhada visual nos 4 itens antes de considerar a rodada fechada —
o roteiro específico de cada um está na seção correspondente de `TESTES.md`.

### Colar os 4 templates de email e ligar o SMTP do Gmail (provisório)

Criei os templates em HTML (preto e dourado, estilo Fluxo Barber) na pasta
`supabase/templates/` deste projeto — eles já funcionam com um remetente
Gmail sem nenhuma alteração (não citam `fluxobarber.com.br`, e o rodapé já
usa `contato.fluxobarber@gmail.com`). Lista exata de arquivo + Subject pra
colar em cada um, e explicação completa de como o link de cada template
funciona: ver a seção "1 — Email via Gmail SMTP" do `RELATORIO.md` (rodada
mais recente).

Ordem certa, pra não travar no limite de envio do plano grátis do Supabase:

1. **Primeiro** configure o SMTP: Authentication → Settings → SMTP Settings
   → Host `smtp.gmail.com`, porta `465`, usuário `contato.fluxobarber@gmail.com`,
   senha = a **senha de app** do Gmail (não a senha normal da conta).
2. **Depois** cole os 4 templates (Authentication → Email Templates) — só é
   possível editá-los com um SMTP próprio configurado.
3. **Por último** religue "Confirm email" (Authentication → Providers →
   Email) — se religar antes do passo 1, o envio ainda cai no limite baixo
   do plano grátis do Supabase.

### Apagar as contas de teste (script consolidado)

Criei `supabase/manutencao/limpar_contas_teste.sql`, juntando numa só as
contas de teste já registradas aqui (veja a lista completa e a ordem certa
de apagar — barbearias antes dos usuários, por causa dos `on delete
cascade`/`on delete set null` das migrations — nos comentários do próprio
arquivo):

- `teste.faturamento@fluxobarber.test` — "Barbearia Teste Faturamento" (slug
  `barbearia-teste-faturamento`): 1 barbeiro, 2 serviços, 3 agendamentos de
  teste (status visuais da Agenda + números do Faturamento).
- `teste.tutorial@fluxobarber.test` — "Barbearia Tutorial Teste" (slug
  `barbearia-tutorial-teste`): deixada de propósito "não pronta" (sem
  serviço/horário), pra testar o selo âmbar do checklist.
- `teste.configrapida@fluxobarber.test` — "Barbearia Config Rapida Teste"
  (slug `barbearia-config-rapida-teste`): passada pelo assistente de
  configuração rápida até o fim, fica "pronta".

O arquivo tem 2 partes: primeiro um `select` só de leitura (pra você
conferir a lista de barbearias/usuários antes de qualquer coisa), depois os
`delete` (comentados dentro de `/* ... */`, só descomente depois de
conferir) — com proteção explícita (`not in (...)`) pra nunca apagar `demo`,
`barbearia-teste`, `salao-de-beleza`, nem os emails
`sobreira.fabricio@hotmail.com`/o seu usuário principal, mesmo que a lista
de "apagar" acima seja editada errado no futuro. **Nenhum desses deletes foi
rodado por mim** — o arquivo só foi criado, pra você revisar e rodar quando
quiser no SQL Editor.

### Testar o link de confirmação por email (preciso que você clique de verdade)

A rota `app/auth/confirm/route.ts` entende os dois formatos de link que o
Supabase pode mandar (veja a explicação completa na seção "1 — Email via
Gmail SMTP" do `RELATORIO.md`, rodada mais recente). Agora que o SMTP do
Gmail está sendo ligado, é a hora certa de testar isso de verdade — como eu
não tenho como receber e clicar num email de verdade, preciso que você
confira manualmente:

**Teste 1 — cadastro novo (agora também com o botão "Reenviar"):**
1. Vá em `/cadastro` (local ou no site publicado) e crie uma conta com um
   email de verdade que você consiga acessar.
2. Se aparecer a mensagem "Conta criada! Enviamos um link de confirmação...",
   confira se o botão **"Não recebeu? Reenviar email de confirmação"**
   aparece embaixo — clique nele e confira se chega um segundo email.
3. Abra qualquer um dos emails recebidos (confira a caixa de spam também) e
   clique no link.
4. **Esperado:** você cai direto no `/onboarding`, já logado. Se cair numa
   tela "Link inválido ou expirado" com o botão "Criar conta de novo", me
   avise com o link completo que apareceu na barra de endereço — ele ajuda a
   descobrir o que deu errado.

**Teste 2 — esqueci minha senha (esse era o que estava quebrado):**
1. Vá em `/esqueci-senha`, digite o email de uma conta que já existe e envie.
2. Abra o email de recuperação e clique no link.
3. **Esperado:** você cai em `/redefinir-senha`, já com uma sessão temporária
   (dá pra digitar a nova senha direto, sem precisar logar de novo).

**Teste 3 — link usado duas vezes (confere a tela de erro):**
1. Depois de clicar em qualquer um dos links acima, clique nele **de novo**
   (ex: abra o mesmo email outra vez e clique no link mais uma vez).
2. **Esperado:** cai em "Link inválido ou expirado" (`/auth/link-invalido`),
   com uma mensagem explicando que o link já foi usado ou expirou, e um botão
   pra pedir um novo (volta pra `/cadastro` ou `/esqueci-senha`, dependendo do
   teste).

## 🚀 Pré-lançamento (última etapa, antes de abrir pra clientes de verdade)

Essas pendências só importam quando o Fluxo Barber for sair do modo "só eu
testando" para receber clientes pagantes de verdade. Não precisa resolver
agora, mas fica registrado pra não esquecer, **na ordem certa**:

**a) Comprar o domínio `fluxobarber.com.br`**
- Registro.br, ~R$ 40/ano.
- Adicionar o domínio na Vercel (Project Settings → Domains).
- Atualizar em Authentication → URL Configuration, no painel do Supabase:
  **Site URL** e **Redirect URLs**, trocando `https://fluxo-barber.vercel.app`
  pelo domínio novo (ex: `https://fluxobarber.com.br`). Os templates de email
  (`supabase/templates/`) não precisam de nenhuma alteração quando isso
  acontecer — eles usam `{{ .SiteURL }}`, que já vem certo direto dessa
  configuração.

**b) Trocar o SMTP do Gmail pelo Resend**
- Hoje (ver "Para fazer agora" acima) o remetente é
  `contato.fluxobarber@gmail.com`, via SMTP do Gmail — **provisório**, só
  pra religar "Confirm email" sem esperar o domínio.
  Trocar pelo Resend (plano grátis) depois do domínio comprado (item a),
  com remetente `nao-responda@fluxobarber.com.br` — melhora a entrega (SPF/
  DKIM no domínio próprio) e tira o limite baixo de envio do Gmail/Supabase.
- Depois da troca, atualizar o rodapé dos 4 templates (hoje
  `contato.fluxobarber@gmail.com`) pro novo remetente, e trocar qualquer URL
  fixa que ainda citar `fluxo-barber.vercel.app` pelo domínio novo.

**c) Cobrança das barbearias**
- **Fase 1 (lançamento):** manual — Pix ou link de pagamento mandado por
  WhatsApp pra cada barbearia.
- **Fase 2 (quando tiver de 5 a 10 clientes pagantes):** automática, via
  Asaas (cobrança recorrente).

**d) CNPJ**
- Só depois que a receita for recorrente (ou seja, depois da fase 2 do item
  c) — não é bloqueante pro lançamento com cobrança manual via Pix/WhatsApp.

**e) Revisão jurídica dos Termos de Uso e da Política de Privacidade — ✅ já feito**
- `/termos` e `/privacidade` já foram revisados (LGPD incluída: papéis de
  controlador/operador e cláusulas de responsabilidade). Item concluído,
  mantido aqui só pra preservar a ordem completa do roteiro de
  pré-lançamento.

---

**Observação:** o horário de domingo 20:00–23:59 cadastrado pro
`barbeiro1test` é de propósito (conta de teste, usada pra testar a virada da
meia-noite) — não é uma pendência, pode ignorar.
