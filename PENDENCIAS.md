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
