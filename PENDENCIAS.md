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

### Colar os 4 templates de email no painel do Supabase

Criei os templates em HTML (preto e dourado, no estilo do Fluxo Barber) na
pasta `supabase/templates/` deste projeto. Eles **não são aplicados
automaticamente** — o Supabase não lê essa pasta sozinho; você precisa colar
o conteúdo de cada arquivo no painel. Passo a passo:

1. Abra o painel do Supabase → **Authentication → Email Templates**.
2. Para cada um dos 4 templates abaixo:
   - Clique no nome do template na lista (ex: "Confirm signup").
   - Apague o conteúdo que estiver no campo de corpo do email.
   - Abra o arquivo correspondente neste projeto, copie **todo** o conteúdo
     (incluindo o comentário `<!-- ... -->` do topo, se quiser — ele só existe
     pra te explicar o link, não atrapalha o envio) e cole no painel.
   - No campo **Subject** (assunto), cole o assunto sugerido abaixo.
   - Clique em **Save**.

| Template no painel | Arquivo neste projeto | Assunto sugerido |
|---|---|---|
| Confirm signup | `supabase/templates/confirm_signup.html` | Confirme seu cadastro no Fluxo Barber |
| Reset Password | `supabase/templates/reset_password.html` | Redefina sua senha — Fluxo Barber |
| Change Email Address | `supabase/templates/change_email.html` | Confirme a alteração do seu email — Fluxo Barber |
| Magic Link | `supabase/templates/magic_link.html` | Seu link de acesso — Fluxo Barber |

**Por que os links desses templates são diferentes do padrão do Supabase:**
o botão padrão do Supabase (`{{ .ConfirmationURL }}`) aponta direto pro
servidor do Supabase, que confirma o link e manda a sessão de volta sozinho.
Esse projeto, em vez disso, tem sua própria rota `app/auth/confirm/route.ts`,
que recebe o link, confirma chamando `supabase.auth.verifyOtp()` e só depois
decide pra onde mandar o usuário (onboarding, redefinir senha, etc.). Por
isso os templates usam um link manual, apontando pra essa rota, com os
parâmetros `token_hash` e `type` que ela espera — expliquei isso em
comentário no topo de cada arquivo `.html`.

**Teste depois de colar:** peça pra criar uma conta nova (ou usar "esqueci
minha senha") e confira se o email chega em português, com a cor certa, e se
o link leva pro lugar esperado.

## 🚀 Pré-lançamento (última etapa, antes de abrir pra clientes de verdade)

Essas pendências só importam quando o Fluxo Barber for sair do modo "só eu
testando" para receber clientes pagantes de verdade. Não precisa resolver
agora, mas fica registrado pra não esquecer:

- **Religar "Confirm email"** (Authentication → Providers → Email) **junto
  com** configurar um serviço de email próprio via SMTP (ex: Resend, que tem
  plano gratuito generoso) em Authentication → Settings → SMTP Settings. Os
  dois precisam andar juntos: religar a confirmação sem um SMTP próprio
  esbarra rápido no limite de envio de email do plano gratuito do Supabase
  (já vimos o erro `over_email_send_rate_limit` nos testes).
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
