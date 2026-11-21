# Fluxo Barber

**SaaS de agendamento online para barbearias.** O dono da barbearia cadastra a equipe, os serviços e o expediente, e o cliente marca o próprio horário por uma página pública, sem conflito de agenda.

🔗 **Demo:** [fluxo-barber.vercel.app](https://fluxo-barber.vercel.app)

---

## Funcionalidades

**Para a barbearia (painel)**
- Agenda interativa com os horários marcados
- Cadastro de barbeiros e serviços (duração e preço)
- Configuração de expediente e horários de funcionamento
- Visão de faturamento
- Onboarding com assistente de configuração rápida

**Para o cliente**
- Página pública da barbearia (`/b/nome-da-barbearia`)
- Agendamento sem login, só com horários realmente livres

**Conta e segurança**
- Cadastro, login, recuperação e redefinição de senha
- Confirmação de e-mail via Supabase Auth
- Página de política de privacidade

## Tecnologias

| Camada | Stack |
| --- | --- |
| Front-end | Next.js (App Router), React, TypeScript |
| Estilo e animação | Tailwind CSS, GSAP, Lucide Icons |
| Back-end e banco | Supabase (PostgreSQL, Auth, Server Actions) |
| Qualidade | ESLint, testes com o test runner nativo do Node |
| Deploy | Vercel |

## Estrutura

```
app/
  painel/        # área da barbearia: agenda, barbeiros, serviços, horários, faturamento
  b/[slug]/      # página pública de agendamento do cliente
  onboarding/    # primeira configuração da barbearia
  login/, cadastro/, esqueci-senha/, redefinir-senha/
components/      # componentes reutilizáveis
supabase/        # migrations SQL do banco
utils/           # regras de negócio, cliente Supabase e testes
```

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # roda os testes
```

É preciso um projeto no Supabase e as variáveis de ambiente `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` em um arquivo `.env.local`.

## Autor

**Fabrício Sobreira** — estudante de Análise e Desenvolvimento de Sistemas (Estácio)
[LinkedIn](https://www.linkedin.com/in/fabricio-barros-sobreira-da-silva-3b0676251/) · [GitHub](https://github.com/FabricioSobreira2004)

---

© 2026 Fabrício Sobreira. Todos os direitos reservados. O código está público para fins de portfólio; não é permitido copiar, redistribuir ou usar comercialmente sem autorização.
