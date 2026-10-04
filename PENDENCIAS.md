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
