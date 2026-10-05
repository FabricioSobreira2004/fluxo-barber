# Pendências (coisas que precisam ser feitas no painel do Supabase ou revisadas por você)

Este arquivo é atualizado a cada etapa. Cada item tem: o que é, por que é
necessário, e o passo a passo para você resolver.

---

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

**O que é:** o site agora usa tipos TypeScript do banco (`utils/supabase/database.types.ts`)
nos dois clientes do Supabase (`utils/supabase/server.ts` e `client.ts`) — isso faz
`.from("tabela").select(...)` e `.rpc(...)` virem com autocomplete e checagem de tipo.

**Por que escrevi esse arquivo na mão:** o comando oficial (`supabase gen types
typescript`) precisa de login na CLI (`supabase login`), que abre o navegador —
e eu não tenho como fazer isso por você. Então escrevi `database.types.ts` no
mesmo formato que a CLI geraria, a partir do schema das migrations 001 a 003.
Ele já funciona normalmente; rodar a CLI é opcional, só pra ter 100% de certeza
de que bate com o banco real (ex: se você alterar uma coluna direto no painel
sem criar uma migration nova).

**Se quiser gerar pela CLI de verdade:**
1. No terminal, dentro da pasta do projeto, rode `npx supabase login` — ele abre
   o navegador pra você autorizar o acesso.
2. Depois, rode:
   ```
   npx supabase gen types typescript --project-id bvspfjhcooygqfsgirnu > utils/supabase/database.types.ts
   ```
   (o `--project-id` já é o do seu projeto, lido do `.env.local`.)
3. Esse comando SUBSTITUI o arquivo inteiro — tudo bem, porque os "atalhos"
   (`Tabelas`, `NovaLinha`, etc.) que escrevi no final do arquivo não existem
   no banco, então você precisaria colar essas ~15 linhas de volta no fim do
   arquivo depois de gerar (procure a seção "Atalhos" neste mesmo arquivo pra
   copiar antes de substituir, ou me avise depois que eu colo de novo).

## ⚠️ Nova rodada — Rodar a migration 003 (PRIORIDADE)

**O que é:** `supabase/migrations/003_padronizacao_e_correcoes.sql` padroniza
o telefone dos clientes (só dígitos), valida nome/telefone nas funções
públicas, corrige um bug de virada da meia-noite em
`criar_agendamento_publico`, e trava spam (máx. 3 agendamentos futuros por
telefone na mesma barbearia).

**Por que precisa rodar manualmente:** altera dados existentes (normaliza
telefones já cadastrados) e cria uma constraint — não posso executar isso
no seu banco, só você.

**O que fazer:**
1. Abra o **SQL Editor** no painel do Supabase.
2. Copie todo o conteúdo de `supabase/migrations/003_padronizacao_e_correcoes.sql`
   e execute.
3. **Atenção:** se você já tem clientes cadastrados com o mesmo telefone
   escrito de formas diferentes (ex: "(21) 99016-3583" e "21990163583" na
   mesma barbearia), o script vai PARAR com uma mensagem de erro explicando
   como encontrar e resolver essas duplicatas antes de rodar de novo — isso
   é intencional, pra não arriscar misturar o histórico de dois clientes
   diferentes automaticamente.
4. Sem rodar essa migration, o site continua funcionando como antes (as
   funções antigas continuam no banco), mas sem as correções e validações
   novas.

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
