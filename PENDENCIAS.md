# Pendências (coisas que precisam ser feitas no painel do Supabase ou revisadas por você)

Este arquivo é atualizado a cada etapa. Cada item tem: o que é, por que é
necessário, e o passo a passo para você resolver.

---

## ✅ Migration 003 — já aplicada

Você confirmou que já rodou `supabase/migrations/003_padronizacao_e_correcoes.sql`
no SQL Editor. Testei as funções públicas depois disso — veja o resultado
completo em `TESTES.md`. Resumo: toda validação de nome/telefone funcionou
certinho.

## ✅ Migration 004 — já aplicada (e os comentários do arquivo foram revisados)

Você confirmou que já rodou `supabase/migrations/004_telefone_55.sql` e
que o telefone com `+55` agora é aceito corretamente — reconfirmei isso nos
testes desta rodada (`TESTES.md`).

**Atualizei só os COMENTÁRIOS do arquivo** (a lógica em si não mudou, então
**não precisa rodar de novo no banco**):
- O comentário antigo dizia "nenhum DDD brasileiro começa com 55", o que
  está errado (o DDD 55 existe, é de Santa Maria/RS). Troquei pela
  explicação correta: a regra só entra em ação quando sobram 12 ou 13
  dígitos, e um número do DDD 55 digitado *sem* código do país sempre tem
  10 ou 11 dígitos (não é afetado); digitado *com* `+55`, vira 13 dígitos e
  só os 2 primeiros (o código do país) são removidos — o DDD 55 real
  continua intacto nos dígitos que sobram.
- Recolei os comentários linha a linha que essa migration tinha perdido em
  relação à 003 (ex: explicação de cada validação, da trava de conflito de
  horário, do anti-spam).

## ⚠️ Apagar os dados de teste

Diferente da rodada anterior, desta vez os testes **criaram agendamentos de
verdade** no banco (21 de 21 testes passaram — ver `TESTES.md`). Tem um
SQL pronto em `TESTES.md`, com um **SELECT de conferência primeiro** (pra
você ver exatamente o que vai ser apagado antes de apagar) e depois o
DELETE na ordem certa (agendamentos, depois clientes).

## ⚠️ Horário de teste do domingo — lembre de remover depois dos testes

Você cadastrou um horário de teste pro "barbeiro1test" no **domingo,
20:00–23:59**, só pra eu testar a virada da meia-noite (ver `TESTES.md`).
Se você não for usar esse horário de verdade, **lembre de apagá-lo** em
`/painel/horarios` depois que terminar de conferir os testes — senão a
barbearia vai aparecer como "aberta" domingo à noite na página pública.

## Etapa 5 — Schema versionado

Sem pendência. O arquivo `supabase/migrations/001_schema_inicial.sql` é só
uma cópia do que já existe no banco (criado por você no SQL Editor), para
ficar versionado no git. Não precisa rodar nada.

## Etapa 7 — Confirmação de email (configuração no painel do Supabase)

**O que é:** por padrão, o Supabase exige que o usuário clique em um link
enviado por email antes de poder entrar (`Confirm email` ligado). Implementei
o fluxo completo pra isso funcionar:
- `/cadastro` cria a conta com `supabase.auth.signUp`.
- Se a confirmação estiver exigida, mostro a mensagem "enviamos um link pro
  seu email" (sem redirecionar, porque ainda não existe sessão).
- O link do email aponta pra rota `/auth/confirm`, que eu criei
  (`app/auth/confirm/route.ts`); ela valida o link e já loga o usuário.

**Por que isso pode travar seus testes:** pra `/auth/confirm` funcionar, o
Supabase precisa saber que `http://localhost:3000` é um endereço confiável
pra onde ele pode mandar esse link. Também notei durante os testes que o
plano gratuito do Supabase tem um limite baixo de emails por hora (tomei um
erro "over_email_send_rate_limit" só de testar o cadastro 2 vezes seguidas).

**O que fazer no painel do Supabase (escolha uma opção):**

1. **Deixar a confirmação ligada (mais parecido com produção):**
   - Vá em **Authentication → URL Configuration**.
   - Em **Site URL**, coloque `http://localhost:3000`.
   - Em **Redirect URLs**, adicione `http://localhost:3000/**`.
   - Assim o link do email vai funcionar em desenvolvimento.

2. **Desligar a confirmação por enquanto (mais rápido pra testar, recomendado
   durante o desenvolvimento):**
   - Vá em **Authentication → Providers → Email**.
   - Desmarque a opção **"Confirm email"**.
   - Com isso, `signUp` já devolve o usuário logado na hora, sem precisar de
     email nenhum — e você evita o limite de envio de emails do plano
     gratuito enquanto testa o cadastro várias vezes.
   - **Lembre de religar essa opção antes de colocar o sistema no ar pra
     clientes de verdade**, senão qualquer pessoa cadastra uma conta com
     email de outra pessoa sem precisar confirmar nada.

## Nova rodada — "Esqueci minha senha"

**O que é:** criei o fluxo completo: `/login` tem o link "Esqueci minha
senha" → `/esqueci-senha` (pede o email) → Supabase manda um email →
`/auth/confirm` (já existia, reaproveitado) processa o link → `/redefinir-senha`
(define a nova senha).

**O que fazer no painel do Supabase:**
1. Isso usa a MESMA configuração de **Site URL** e **Redirect URLs** da
   pendência "Confirmação de email" mais abaixo (Authentication → URL
   Configuration). Se você já resolveu aquela pendência, não precisa fazer
   nada de novo aqui.
2. Opcional: em **Authentication → Email Templates → Reset Password**, você
   pode personalizar o texto do email enviado (o padrão do Supabase já
   funciona, só não está em português).

## Nova rodada — Termos de Uso e Política de Privacidade

**O que é:** criei `/termos` e `/privacidade`, com link no cadastro
(checkbox obrigatória) e na página pública de agendamento.

**O que você precisa fazer:**
1. Procure por `[EMAIL DE CONTATO]` nos dois arquivos
   (`app/termos/page.tsx` e `app/privacidade/page.tsx`) e troque pelo email
   de contato real da barbearia/empresa.
2. **Importante:** os textos são um modelo inicial, escrito em linguagem
   simples — **precisam ser revisados por um advogado antes do lançamento
   comercial**, especialmente a parte de LGPD (papéis de controlador e
   operador) e qualquer cláusula de responsabilidade.

## Nova rodada — Gerar os tipos do banco pela CLI do Supabase (opcional)

**O que é:** o site usa tipos TypeScript do banco (`utils/supabase/database.types.ts`)
nos dois clientes do Supabase (`utils/supabase/server.ts` e `client.ts`) — isso faz
`.from("tabela").select(...)` e `.rpc(...)` virem com autocomplete e checagem de tipo.

**Tentei gerar de verdade nesta rodada** com:
```
npx supabase gen types typescript --project-id bvspfjhcooygqfsgirnu
```
e, como esperado, bateu nisto:
```
AccessTokenRequiredError: Access token not provided. Supply an access token by
running `supabase login` or setting the SUPABASE_ACCESS_TOKEN environment variable.
```
Isso exige abrir um navegador e logar na sua conta Supabase — não consigo
fazer isso por você. `database.types.ts` continua escrito à mão, no mesmo
formato que a CLI geraria, a partir do schema das migrations 001 a 004 (a
004 só mudou lógica interna da função, não mudou a assinatura dela nem
nenhuma tabela, então o arquivo de tipos continua correto sem alteração).

**Se quiser gerar pela CLI de verdade, 2 jeitos:**

**Opção A — login interativo (mais simples):**
1. No terminal, dentro da pasta do projeto, rode `npx supabase login` — ele
   abre o navegador pra você autorizar o acesso e salva o login localmente.
2. Depois, rode:
   ```
   npx supabase gen types typescript --project-id bvspfjhcooygqfsgirnu > utils/supabase/database.types.ts
   ```

**Opção B — gerando um token de acesso manualmente (se o navegador não abrir,
ex: rodando num servidor remoto):**
1. Acesse **https://supabase.com/dashboard/account/tokens** (menu da sua
   conta → **Access Tokens**).
2. Clique em **Generate new token**, dê um nome (ex: "cli-local") e copie o
   token gerado (começa com `sbp_...`) — ele só aparece uma vez.
3. No terminal, dentro da pasta do projeto:
   ```
   SUPABASE_ACCESS_TOKEN=sbp_seu_token_aqui npx supabase gen types typescript --project-id bvspfjhcooygqfsgirnu > utils/supabase/database.types.ts
   ```
   (no PowerShell: `$env:SUPABASE_ACCESS_TOKEN="sbp_seu_token_aqui"` numa
   linha, e o comando `npx supabase gen types ...` na linha seguinte.)
4. Guarde esse token como uma senha (dá acesso à sua conta Supabase pela
   CLI) — não cole ele em nenhum arquivo do projeto.

**Depois de gerar, dos dois jeitos:** esse comando SUBSTITUI o arquivo
inteiro — os "atalhos" (`Tabelas`, `NovaLinha`, `AtualizacaoLinha`,
`TipoEnum`) que escrevi no final do arquivo não existem no banco, então
precisaria colar essas ~15 linhas de volta no fim do arquivo depois de
gerar (procure a seção "Atalhos" no `database.types.ts` atual pra copiar
antes de substituir, ou me avise depois que eu colo de novo).

## Etapa 14 — Rodar o SQL da página pública de agendamento

**O que é:** a página `/b/[slug]` (onde o cliente agenda sozinho, sem login)
depende de 5 funções do banco que **ainda não existem no seu Supabase**.
Elas estão escritas em `supabase/migrations/002_agendamento_publico.sql`,
mas eu não tenho acesso ao painel pra executar esse SQL — só você pode.

**Por que precisa de funções especiais:** o RLS das tabelas exige que quem
lê/escreve seja um "membro" da barbearia (`eh_membro`). Um cliente agendando
pela internet não está logado, então ele não passaria nessa checagem. As
funções em `002_agendamento_publico.sql` rodam como "security definer"
(ignoram o RLS), mas cada uma devolve só o que é seguro mostrar
publicamente — nunca dados de outros clientes.

**O que fazer:**
1. Abra o **SQL Editor** no painel do Supabase.
2. Copie todo o conteúdo do arquivo `supabase/migrations/002_agendamento_publico.sql`
   deste projeto e execute.
3. Pronto — a partir daí, `/b/<slug-da-sua-barbearia>` já funciona pra
   qualquer visitante agendar um horário.

**Sem rodar esse SQL:** a página `/b/[slug]` ainda abre, mas mostra "página
não encontrada" (404) pra qualquer slug, porque a primeira função
(`buscar_barbearia_publica`) não existe ainda — isso é esperado e não é bug,
é só a pendência acima.
