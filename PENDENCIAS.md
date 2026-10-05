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

## 🔧 Para fazer agora

### Apagar a conta de teste do tutorial guiado

Pra testar o tour/checklist da Parte B desta rodada, criei UMA conta de teste no seu
`localhost` (confirmação de email estava desligada, então não precisei de um email de
verdade): `teste.tutorial@fluxobarber.test`, barbearia "Barbearia Tutorial Teste"
(slug `barbearia-tutorial-teste`), com 1 barbeiro de teste ("João Barbeiro") — sem
serviço, sem horário e sem agendamento algum cadastrado. Quando quiser apagar:

1. **Confira antes de apagar** (SQL Editor do Supabase), pra ter certeza que é a
   barbearia certa:
   ```sql
   select id, nome, slug, criado_em from barbearias where slug = 'barbearia-tutorial-teste';
   ```
2. **Apague a barbearia** — todas as tabelas (membros, barbeiros, serviços, clientes,
   horários, agendamentos) têm `on delete cascade` ligado a `barbearia_id`, então
   apagar só essa linha já leva tudo junto:
   ```sql
   delete from barbearias where slug = 'barbearia-tutorial-teste';
   ```
3. **Apague o usuário**: painel do Supabase → **Authentication → Users**, procure
   `teste.tutorial@fluxobarber.test` e apague por lá (o botão de apagar usuário fica
   no menu "..." da linha dele). Pode ser antes ou depois do passo 2 — são
   independentes (apagar o usuário sozinho não apagaria a barbearia, porque é a
   barbearia que "aponta" pro dono, e não o contrário).

### Testar o link de confirmação por email (preciso que você clique de verdade)

A rota `app/auth/confirm/route.ts` agora entende os dois formatos de link que
o Supabase pode mandar (veja a explicação completa na seção "Colar os 4
templates..." lá embaixo, em Pré-lançamento). Como eu não tenho como receber
e clicar num email de verdade, preciso que você confira isso manualmente:

**Teste 1 — cadastro novo:**
1. Vá em `/cadastro` (local ou no site publicado) e crie uma conta com um
   email de verdade que você consiga acessar.
2. Se aparecer a mensagem "Conta criada! Enviamos um link de confirmação...",
   abra o email (confira a caixa de spam também) e clique no link.
3. **Esperado:** você cai direto no `/onboarding`, já logado. Se cair numa
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
agora, mas fica registrado pra não esquecer:

- **Colar os 4 templates de email no painel do Supabase** (depende do SMTP
  próprio, item logo abaixo — por isso só entra aqui, em Pré-lançamento).
  Criei os templates em HTML (preto e dourado, no estilo do Fluxo Barber) na
  pasta `supabase/templates/` deste projeto, mas **o plano gratuito do
  Supabase, sem um SMTP próprio configurado, não deixa editar os templates de
  email** — por isso, hoje, todo email sai com o texto e o visual padrão do
  Supabase (em inglês, sem a cor da marca). Assim que o SMTP próprio
  estiver configurado (item abaixo), o passo a passo é:
  1. Abra o painel do Supabase → **Authentication → Email Templates**.
  2. Para cada um dos 4 templates abaixo: clique no nome na lista, apague o
     conteúdo atual, cole o conteúdo do arquivo `.html` correspondente deste
     projeto, cole o assunto sugerido no campo **Subject**, e clique em
     **Save**.

  | Template no painel | Arquivo neste projeto | Assunto sugerido |
  |---|---|---|
  | Confirm signup | `supabase/templates/confirm_signup.html` | Confirme seu cadastro no Fluxo Barber |
  | Reset Password | `supabase/templates/reset_password.html` | Redefina sua senha — Fluxo Barber |
  | Change Email Address | `supabase/templates/change_email.html` | Confirme a alteração do seu email — Fluxo Barber |
  | Magic Link | `supabase/templates/magic_link.html` | Seu link de acesso — Fluxo Barber |

  Esses templates usam um link **manual** (`token_hash` + `type`), apontando
  direto pra `app/auth/confirm/route.ts`, em vez do link padrão do Supabase
  (que passa primeiro pelo servidor deles). A rota já está pronta pra
  entender os dois formatos ao mesmo tempo, então colar os templates não
  quebra nada que já está funcionando hoje.
- **SMTP próprio** (ex: Resend, que tem plano gratuito generoso) em
  Authentication → Settings → SMTP Settings — é o que **libera a edição dos
  templates** acima, e também tira o envio de email do limite baixo do plano
  gratuito do Supabase (já vimos o erro `over_email_send_rate_limit` nos
  testes). Pra configurar direito (SPF/DKIM, e-mails não caindo no spam),
  o ideal é enviar a partir de um endereço no domínio **`fluxobarber.com.br`**
  — então esse item depende do item "Domínio próprio" logo abaixo.
- **Religar "Confirm email"** (Authentication → Providers → Email) — hoje,
  provavelmente, uma conta nova já nasce logada, sem precisar confirmar o
  email (bom pra testar rápido, ruim pra produção, porque não garante que o
  email da barbearia é de verdade). Só religue **depois** do SMTP próprio
  estar configurado, senão esbarra no mesmo limite de envio citado acima.
- **Revisão dos Termos de Uso e da Política de Privacidade por um advogado**
  antes do lançamento comercial — os textos atuais (`/termos` e
  `/privacidade`) são um modelo inicial, em linguagem simples, mas não
  substituem uma revisão jurídica (principalmente a parte de LGPD: papéis de
  controlador/operador, e qualquer cláusula de responsabilidade).
- **Domínio próprio** `fluxobarber.com.br` (hoje o site usa o domínio
  gratuito da Vercel, `fluxo-barber.vercel.app`).
- **Cobrança / assinaturas e CNPJ** — pra cobrar das barbearias de verdade, é
  preciso ter CNPJ e algum sistema de pagamento recorrente (ex: Stripe).

---

**Observação:** o horário de domingo 20:00–23:59 cadastrado pro
`barbeiro1test` é de propósito (conta de teste, usada pra testar a virada da
meia-noite) — não é uma pendência, pode ignorar.
