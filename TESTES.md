# Testes das funções públicas (página `/b/[slug]`)

Testes feitos simulando exatamente um visitante sem login: só com a
**Publishable key** (nunca a Secret key), chamando as funções via
`supabase.rpc(...)`, do mesmo jeito que `app/b/[slug]/actions.ts` faz.

**Script usado:** `scripts/testar-funcoes-publicas.mjs` (roda com
`node scripts/testar-funcoes-publicas.mjs`). Ele lê a URL e a Publishable
key do seu `.env.local` — **não tem nenhuma chave escrita no código**, por
isso decidi manter o script no projeto (pode rodar de novo quando quiser,
em vez de eu ter que recriar tudo). Ele também é só leitura/escrita pública:
não faz login, não usa a Secret key.

**Barbearia de teste confirmada:** slug `barbearia-teste` → "barbearia
teste" (id `d22399f1-8ec5-4f9b-9201-5bdd7dfb5608`), com 1 barbeiro
("barbeiro1test") e 3 serviços ativos.

---

## ⚠️ Achado importante: o barbeiro de teste não tem horário de trabalho cadastrado

O script procurou horário livre pra "barbeiro1test", pra cada um dos 3
serviços, nos próximos 10–14 dias, e **não achou nenhum** — isso significa
que não existe nenhuma linha em `horarios_trabalho` pra esse barbeiro (você
pode confirmar em `/painel/horarios`).

**Por que isso importa pros testes:** a função `criar_agendamento_publico`
só deixa agendar um horário que caiba dentro de algum intervalo cadastrado
(checagem de expediente). Sem nenhum intervalo cadastrado, **todo**
agendamento é recusado nessa etapa — mesmo um com nome e telefone
perfeitamente válidos. Por isso, os testes que *precisam* de um agendamento
criado com sucesso (nome/telefone válidos, anti-spam, conflito de horário,
fronteira do expediente, `listar_horarios_livres`) não puderam ser
completados agora.

Os testes de **validação** (nome/telefone *inválidos*, que devem ser
recusados) não dependem disso — a validação de nome e telefone acontece
**antes** da checagem de expediente — e todos rodaram normalmente.

**Para completar os testes que faltaram:** cadastre pelo menos um
intervalo de horário de trabalho pro "barbeiro1test" em `/painel/horarios`
(ex: segunda a sexta, 08:00 às 18:00) e rode o script de novo:
```
node scripts/testar-funcoes-publicas.mjs
```
(Já deixei essa pendência também anotada no `PENDENCIAS.md`.)

---

## Resultado dos testes

| # | Teste | Esperado | Obtido | Resultado |
|---|-------|----------|--------|-----------|
| 1a | Nome com 1 letra | Erro "Nome precisa ter entre 2 e 100 caracteres" | Erro: "Nome precisa ter entre 2 e 100 caracteres" | ✅ Passou |
| 1b | Nome só com espaços | Mesmo erro (trim deixa vazio) | Erro: "Nome precisa ter entre 2 e 100 caracteres" | ✅ Passou |
| 1c | Nome com 101 caracteres | Mesmo erro | Erro: "Nome precisa ter entre 2 e 100 caracteres" | ✅ Passou |
| 1d | Nome válido com espaços nas pontas (deve salvar sem eles) | Agendamento criado | — | ⏭️ Pulado (sem horário livre) |
| 2a | Telefone com 9 dígitos | Erro "Telefone precisa ter 10 ou 11 números" | Erro: "Telefone precisa ter 10 ou 11 números (DDD + número)" | ✅ Passou |
| 2b | Telefone com 12 dígitos aleatórios | Mesmo erro | Erro: "Telefone precisa ter 10 ou 11 números (DDD + número)" | ✅ Passou |
| 2c | Telefone formatado `(21) 90000-0002` (deve aceitar e salvar só dígitos) | Agendamento criado | — | ⏭️ Pulado (sem horário livre) |
| extra | Telefone `+55 21 90000-0008` **antes** da migration 004 | Comportamento atual: recusado (bug) | Erro: "Telefone precisa ter 10 ou 11 números..." — confirma o bug relatado | ✅ Passou (comprova o bug) |
| 3 | Anti-spam: 3 agendamentos futuros OK, 4º bloqueado | 3 aceitos, 4º recusado | — | ⏭️ Pulado (sem horário livre) |
| 4 | Conflito de horário: 2 agendamentos no mesmo horário/barbeiro | 2º recusado com código `23P01` | — | ⏭️ Pulado (sem horário livre) |
| 5 | Fronteira do expediente (checagem que a migration 003 corrigiu) | Horário que não cabe é recusado | — | ⏭️ Pulado (sem horário livre) |
| 6 | `listar_horarios_livres` reflete agendamento feito | Horário some da lista | — | ⏭️ Pulado (sem horário livre) |
| 7a | Máscara de telefone em 375px, localhost | `(11) 99999-9999` enquanto digita | Confirmado: `21990163583` → `(21) 99016-3583` em tempo real | ✅ Passou |
| 7b | Máscara de telefone em 375px, produção (Vercel) | Mesmo comportamento | Confirmado: `11988887777` → `(11) 98888-7777` em tempo real | ✅ Passou |
| 7c | Página pública mostra "Nenhum horário livre nesse dia" quando não há expediente | Mensagem amigável, sem quebrar a tela | Confirmado em localhost e produção | ✅ Passou |
| 7d | Mensagens de erro do agendamento (nome/telefone inválido) na tela, amigáveis | Mensagem em português, sem termo técnico | — | ⏭️ Não testável pela UI agora: o botão "Confirmar agendamento" fica desabilitado sem nenhum horário selecionável. **Já testado e confirmado, porém, direto na função do banco** (testes 1a–1c, 2a–2b acima) — a mesma mensagem que o banco devolve é repassada sem alteração por `app/b/[slug]/actions.ts` (`error.code === "P0001" → erro: error.message`). Revalidar pela UI depois de cadastrar os horários. |

**Resumo:** 9 de 9 testes executáveis passaram. 7 testes ficaram pendentes
por falta de horário de trabalho cadastrado (não são falhas — são bloqueios
de dados de teste, como avisado nas instruções). **Nenhum bug foi
encontrado** nas funções já migradas (migration 003). O único problema
identificado (telefone com "+55") já era esperado — é o motivo de existir a
migration 004, criada nesta sessão.

---

## Testes do utilitário de telefone (`utils/telefone.ts`)

Criei `utils/telefone.test.ts` com 9 testes simples, usando o test runner
que já vem com o Node (não precisei instalar nenhuma biblioteca nova).
Rode com:
```
npm test
```
Resultado: **9 de 9 passaram**, incluindo os casos de `+55`:
- `"+55 21 99016-3583"` → `"21990163583"` (o `+` já era removido antes)
- `"55 21 99016-3583"` → `"21990163583"` (o `"55"` sozinho, sem o `+` — **esse
  era o caso quebrado**, corrigido agora em `utils/telefone.ts` e na
  migration 004)
- `"552133334444"` (fixo com 55 na frente) → `"2133334444"`
- Um telefone de 11 dígitos não é mexido só por parecer ter um prefixo

---

## Migration 004 — correção do "+55" (AINDA NÃO APLICADA)

**Arquivo:** `supabase/migrations/004_telefone_55.sql` — **não rodei**,
conforme pedido. Veja o passo a passo no `PENDENCIAS.md`.

**O bug:** a normalização da migration 003 só tirava caracteres que não são
dígito (`regexp_replace(..., '\D', '', 'g')`). Isso remove o `+` de
`"+55 21 99016-3583"`, mas o `"55"` continua colado: o resultado vira
`"5521990163583"`, com **13 dígitos** — e a constraint só aceita 10 ou 11,
então um telefone brasileiro perfeitamente válido, só por ter sido digitado
com o código do país, era **recusado por engano**. O teste "extra" na
tabela acima comprova esse comportamento no banco, do jeito que está hoje.

**A correção:** depois de tirar os não-dígitos, se sobrou algo com 12 ou 13
dígitos começando com `"55"`, tira esse prefixo também — exatamente a
mesma regra que já apliquei no `normalizarTelefone` do site. Também
corrigi o comentário da migration 003, que dizia (incorretamente) que o
`"+55"` inteiro já era removido ali.

---

## SQL para apagar os dados de teste

**Nesta rodada, nenhum dado de teste chegou a ser salvo** (todas as
tentativas que dependiam de sucesso foram bloqueadas pela falta de
horário de trabalho — ver seção acima), então não há nada pra limpar
agora. Mesmo assim, aqui está o SQL pronto pra quando você rodar os testes
completos (depois de cadastrar os horários) — rode no **SQL Editor** do
Supabase, **nesta ordem** (agendamentos primeiro, por causa da chave
estrangeira):

```sql
-- 1) apaga primeiro os AGENDAMENTOS de teste (a chave estrangeira
--    "agendamentos.cliente_id" aponta pra "clientes", por isso essa ordem)
delete from agendamentos
where cliente_id in (
  select c.id
  from clientes c
  join barbearias b on b.id = c.barbearia_id
  where b.slug = 'barbearia-teste'
    and (c.telefone like '2190000000%' or c.nome like 'TESTE CLAUDE%')
);

-- 2) depois apaga os CLIENTES de teste
delete from clientes c
using barbearias b
where b.id = c.barbearia_id
  and b.slug = 'barbearia-teste'
  and (c.telefone like '2190000000%' or c.nome like 'TESTE CLAUDE%');
```

Depois de rodar, confira que sumiram (deve devolver 0 linhas):
```sql
select count(*) from clientes where telefone like '2190000000%' or nome like 'TESTE CLAUDE%';
```
